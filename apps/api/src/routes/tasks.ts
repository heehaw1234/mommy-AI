import { Router, Request, Response } from 'express';
import { taskService, ExtractedTask } from '../core/tasks';
import { getUserProfile } from '../lib/supabase';
import { optionalAuthMiddleware } from '../middleware/auth';

const router = Router();

interface TaskExtractionRequest {
    input: string;
    userId?: string;
    contextHints?: {
        currentTime?: string; // ISO date string
        existingTasks?: any[];
    };
}

interface TaskExtractionResponse {
    tasks: ExtractedTask[];
    originalInput: string;
    confidence: number;
    processingTime: number;
}

/**
 * POST /v1/tasks/extract
 * 
 * Extract structured tasks from natural language input
 * 
 * Body: { input: string, userId?: string, contextHints?: object }
 * Response: { tasks: ExtractedTask[], confidence: number, processingTime: number }
 */
router.post('/extract', optionalAuthMiddleware, async (req: Request, res: Response) => {
    try {
        const { input, userId: bodyUserId, contextHints } = req.body as TaskExtractionRequest;

        const userId = req.user?.userId || bodyUserId;

        if (!input || typeof input !== 'string') {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Input is required and must be a string'
            });
            return;
        }

        if (input.length > 1000) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'Input too long (max 1000 characters)'
            });
            return;
        }

        console.log(`📋 Task extraction request from user: ${userId || 'anonymous'}`);

        // Get user profile for personality context
        let profile = undefined;
        if (userId) {
            const userProfile = await getUserProfile(userId);
            if (userProfile) {
                profile = {
                    mommyLvl: userProfile.mommy_lvl,
                    personalityType: userProfile.ai_personality,
                    name: userProfile.name
                };
            }
        }

        // Parse context hints
        const parsedContextHints = contextHints ? {
            currentTime: contextHints.currentTime ? new Date(contextHints.currentTime) : undefined,
            existingTasks: contextHints.existingTasks
        } : undefined;

        // Extract tasks
        const result = await taskService.extractTasksFromInput(
            input,
            profile,
            parsedContextHints
        );

        console.log(`✅ Extracted ${result.tasks.length} tasks (confidence: ${result.confidence.toFixed(2)})`);

        const response: TaskExtractionResponse = {
            tasks: result.tasks,
            originalInput: result.originalInput,
            confidence: result.confidence,
            processingTime: result.processingTime
        };

        res.json(response);

    } catch (error) {
        console.error('❌ Task extraction error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to extract tasks'
        });
    }
});

/**
 * GET /v1/tasks/health
 * 
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        service: 'task-extraction',
        timestamp: new Date().toISOString()
    });
});

export default router;
