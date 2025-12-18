import { Router, Request, Response } from 'express';
import { orchestrator } from '../core/llm';
import { getUserProfile } from '../lib/supabase';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

interface ChatRequest {
    message: string;
    userId?: string; // Optional if using auth middleware
}

interface ChatResponse {
    text: string;
    personality: {
        mommyLvl: number;
        aiPersonality: number;
    };
}

/**
 * POST /v1/chat
 * 
 * Generate AI chat response with personality customization
 * 
 * Body: { message: string, userId?: string }
 * Response: { text: string, personality: { mommyLvl, aiPersonality } }
 */
router.post('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const { message, userId: bodyUserId } = req.body as ChatRequest;

        // Get userId from auth token or request body
        const userId = req.user?.userId || bodyUserId;

        if (!message || typeof message !== 'string') {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Message is required and must be a string'
            });
            return;
        }

        if (message.length > 2000) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Message too long (max 2000 characters)'
            });
            return;
        }

        console.log(`📨 Chat request from user: ${userId || 'anonymous'}`);

        // Get user's personality settings
        let mommyLvl = 0;
        let aiPersonality = 0;

        if (userId) {
            const profile = await getUserProfile(userId);
            if (profile) {
                mommyLvl = profile.mommy_lvl || 0;
                aiPersonality = profile.ai_personality || 0;
                console.log(`👤 User profile: mommy_lvl=${mommyLvl}, ai_personality=${aiPersonality}`);
            }
        }

        // Generate response
        const text = await orchestrator.generateResponse(message, {
            mommyLvl,
            personalityType: aiPersonality
        });

        const response: ChatResponse = {
            text,
            personality: {
                mommyLvl,
                aiPersonality
            }
        };

        console.log(`✅ Chat response generated (${text.length} chars)`);

        res.json(response);

    } catch (error) {
        console.error('❌ Chat endpoint error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to generate response'
        });
    }
});

/**
 * POST /v1/chat/authenticated
 * 
 * Same as /v1/chat but requires authentication
 */
router.post('/authenticated', authMiddleware, async (req: Request, res: Response) => {
    try {
        const { message } = req.body as ChatRequest;
        const userId = req.user!.userId;

        if (!message || typeof message !== 'string') {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Message is required'
            });
            return;
        }

        const profile = await getUserProfile(userId);
        const mommyLvl = profile?.mommy_lvl || 0;
        const aiPersonality = profile?.ai_personality || 0;

        const text = await orchestrator.generateResponse(message, {
            mommyLvl,
            personalityType: aiPersonality
        });

        res.json({
            text,
            personality: { mommyLvl, aiPersonality },
            user: { id: userId }
        });

    } catch (error) {
        console.error('❌ Authenticated chat error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to generate response'
        });
    }
});

export default router;
