import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import chatRoutes from './routes/chat';
import taskRoutes from './routes/tasks';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10kb' }));

// Request logging
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'mommy-ai-api',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/v1/chat', chatRoutes);
app.use('/v1/tasks', taskRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('❌ Unhandled error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║   🚀 Mommy AI API Server                         ║
║                                                  ║
║   Running on: http://localhost:${PORT}              ║
║                                                  ║
║   Endpoints:                                     ║
║   • POST /v1/chat         - Chat with AI        ║
║   • POST /v1/tasks/extract - Extract tasks      ║
║   • GET  /health          - Health check        ║
║                                                  ║
╚══════════════════════════════════════════════════╝
  `);

    // Log configuration status
    console.log('📋 Configuration:');
    console.log(`   • SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
    console.log(`   • OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '⚠️ Not set (will use fallbacks)'}`);
    console.log(`   • HUGGING_FACE_TOKEN: ${process.env.HUGGING_FACE_TOKEN ? '✅ Set' : '⚠️ Not set (will use fallbacks)'}`);
    console.log(`   • OLLAMA_ENDPOINTS: ${process.env.OLLAMA_ENDPOINTS || 'http://localhost:11434/api/generate (default)'}`);
    console.log('');
});

export default app;
