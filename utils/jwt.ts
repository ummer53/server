require('dotenv').config();

import { Request, Response, NextFunction } from 'express';

import userModel, { IUser } from '../models/userModel';
import { redis } from './redis';

interface ITokenOptions {
	expiresIn: Date;
	maxAge: number;
	httpOnly: boolean;
	secure?: boolean;
	sameSite: 'none' | 'strict' | 'lax' | undefined;
}

export const createAccessToken = (
	user: IUser,
	statusCode: number,
	res: Response
) => {
	const token = user.signAccessToken();
	const refreshToken = user.signRefreshToken();
	//upload session to redis database
	redis.set(user._id, JSON.stringify(user) as any);

	// parse env varaibles to integratE with FALLBACK VALUES
	const accessTokenExpiresIn = parseInt(
		process.env.ACCESS_TOKEN_EXPIRES_IN || '300',
		10
	);
	const refreshTokenExpiresIn = parseInt(
		process.env.REFRESH_TOKEN_EXPIRES_IN || '86400',
		10
	);

	const AccessTokenOptions: ITokenOptions = {
		expiresIn: new Date(Date.now() + accessTokenExpiresIn * 1000),
		maxAge: accessTokenExpiresIn * 1000,
		httpOnly: true,
		sameSite: 'lax',
	};

	const refreshTokenOptions: ITokenOptions = {
		expiresIn: new Date(Date.now() + refreshTokenExpiresIn * 1000),
		maxAge: refreshTokenExpiresIn * 1000,
		httpOnly: true,
		sameSite: 'lax',
	};

	if (process.env.NODE_ENV === 'production') {
		AccessTokenOptions.secure = true;
		refreshTokenOptions.secure = true;
	}

	res.cookie('refreshToken', refreshToken, refreshTokenOptions);
	res.cookie('accessToken', token, AccessTokenOptions);
	res.status(statusCode).json({
		success: true,
		user,
		token,
	});
};
