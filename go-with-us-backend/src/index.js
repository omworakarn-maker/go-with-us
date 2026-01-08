import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
// Increase payload limit to handle base64 images (5MB image = ~6.7MB base64)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Go With Us Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      trips: '/api/trips',
      messages: '/api/messages',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Start server if not running on Vercel
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
    console.log(`📍 http://localhost:${port}`);
  });
}

export default app;
