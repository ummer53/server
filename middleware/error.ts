import { NextFunction, Request, Response } from 'express';
import { ErrorHandler } from '../utils/ErrorHandler';

// Path: utils/middleware/error.ts

export const ErrorHandlerMiddleware = (
	err: any,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	err.statusCode = err.statusCode || 500;
	err.message = err.message || 'Internal Server Error';

	//error for wrong mongo id
	if (err.name === 'CastError') {
		const message = `Resource not found. Invalid: ${err.path}`;
		err = new ErrorHandler(400, message);
	}

	//error for duplicate key
	if (err.statusCode === 11000) {
		const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
		err = new ErrorHandler(400, message);
	}

	//error for wrong jwt token

	if (err.name === 'JsonWebTokenError') {
		const message = 'JSON Web Token is invalid. Try again';
		err = new ErrorHandler(400, message);
	}

	//error for token expired

	if (err.name === 'TokenExpiredError') {
		const message = 'JSON Web Token is expired. Try again';
		err = new ErrorHandler(400, message);
	}

	res.status(err.statusCode).json({
		success: false,
		error: err.message,
	});
};
