import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

const app = express();
const _dirname = path.resolve();

// Set up rate limiter: max 100 requests per 15 minutes
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, 
	limit: 100, 
	standardHeaders: 'draft-7', 
	legacyHeaders: false, 
});

// CORS configuration
app.use(cors({
	origin: process.env.CORS_ORIGIN, // Configure allowed origin from environment variable
	credentials: true
}));

app.use(limiter);
app.use(helmet());

// Parsing middlewares
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());
app.use(express.static(path.join(_dirname)));

if (process.env.NODE_ENV === 'production') {
	console.log('Running in production mode');
	const compression = await import('compression');
	app.use(compression.default());
}

// Routes
import userRoute from './routes/user.routes.js';
import healthcheckRouter from './routes/healthcheck.routes.js';
import tweetRouter from './routes/tweet.routes.js';
import subscriptionRouter from './routes/subscription.routes.js';
import videoRouter from './routes/video.routes.js';
import commentRouter from './routes/comment.routes.js';
import likeRouter from './routes/like.routes.js';
import playlistRouter from './routes/playlist.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';

// Route declarations
app.use('/api/v1/healthcheck', healthcheckRouter);
app.use('/api/v1/users', userRoute);
app.use('/api/v1/tweets', tweetRouter);
app.use('/api/v1/subscriptions', subscriptionRouter);
app.use('/api/v1/videos', videoRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/api/v1/likes', likeRouter);
app.use('/api/v1/playlist', playlistRouter);
app.use('/api/v1/dashboard', dashboardRouter);

export { app };
