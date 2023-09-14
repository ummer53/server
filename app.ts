require('dotenv').config();
import express, { Request, Response, NextFunction } from 'express';
export const app = express();
import CORS from 'cors';
import cookieParser from 'cookie-parser';
import { ErrorHandlerMiddleware } from './middleware/error';
import userRoutes from './routes/routes';

//body-parser

app.use(express.json({ limit: '50mb' }));

//cookie-parser

app.use(cookieParser());

//cors

app.use(
	CORS({
		origin: 'http://localhost:3000',
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		credentials: true, // Enable credentials (if needed)
	})
);

//routes
app.use('/api/v1', userRoutes);

app.use(express.static('build'));
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/build/index.html');
});

app.get('/test', (_req: Request, res: Response, next: NextFunction) => {
	console.log('test route hit');
	res.status(200).json({
		success: true,
		message: 'Hello World!',
	});

	next();
});

//error handling

app.all('*', (req: Request, _res: Response, next: NextFunction) => {
	const err = new Error(`Route ${req.originalUrl} not found`) as any;
	err.statusCode = 404;
	next(err);
});

app.use(ErrorHandlerMiddleware);
