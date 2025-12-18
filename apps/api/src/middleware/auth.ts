import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/supabase';

// Extend Express Request to include user info
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email?: string;
            };
        }
    }
}

/**
 * Middleware to verify Supabase JWT token from Authorization header
 * 
 * Usage:
 *   router.post('/protected-route', authMiddleware, (req, res) => {
 *     const userId = req.user?.userId;
 *     // ...
 *   });
 */
export async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Missing or invalid Authorization header'
            });
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        const userData = await verifyToken(token);

        if (!userData) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid or expired token'
            });
            return;
        }

        // Attach user data to request
        req.user = userData;

        next();
    } catch (error) {
        console.error('❌ Auth middleware error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Authentication failed'
        });
    }
}

/**
 * Optional auth middleware - doesn't reject if no token, but attaches user if present
 */
export async function optionalAuthMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const userData = await verifyToken(token);

            if (userData) {
                req.user = userData;
            }
        }

        next();
    } catch (error) {
        console.error('⚠️ Optional auth middleware error:', error);
        next(); // Continue even if auth fails
    }
}
