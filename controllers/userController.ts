require('dotenv').config();
import { Request, Response, NextFunction } from 'express';
import userModel, { IUser, unverifiedUserModel } from '../models/userModel';
import { catchAsyncError } from '../middleware/catchAsyncError';
import jwt from 'jsonwebtoken';
import { ErrorHandler } from '../utils/ErrorHandler';
import ejs from 'ejs';
import path from 'path';
import sendEmail from '../utils/sendMail';
import { createAccessToken } from '../utils/jwt';

// user interface

interface IRegisterUser {
	name: string;
	email: string;
	password: string;
	avatar?: string;
}

//register user

export const registerUser = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		// console.log(
		// 	`name: ${req.body.name} email: ${req.body.email} password: ${req.body.password}`
		// );

		try {
			const { name, email, password }: IRegisterUser = req.body;
			const emailExistsInVerifiedUser = await userModel.findOne({ email });
			const emailExistsInUnverifiedUser = await unverifiedUserModel.findOne({
				email,
			});

			if (emailExistsInVerifiedUser) {
				return next(new ErrorHandler(400, 'Email already exists'));
			}

			//			console.log('emailExists', emailExists);

			const user: IRegisterUser = {
				name,
				email,
				password,
			};

			if (!emailExistsInUnverifiedUser) {
				await unverifiedUserModel.create(user);
			}

			const token = createActivationToken(user);
			const activationCode = token.activationCode;

			//			console.log('token', token);

			const data = {
				user: { name: user.name },
				activationCode: activationCode,
			};

			//			console.log('data', data);

			const html = await ejs.renderFile(
				path.join(__dirname + '../../mails/activation-mail.ejs'),
				data
			);

			//			console.log('html', html);

			try {
				await sendEmail({
					email: user.email,
					subject: 'Account Activation',
					template: 'activation-mail.ejs',
					data: data,
				});

				res.status(201).json({
					success: true,
					message: 'Account activation email sent',
					token,
				});
			} catch (err) {
				return next(new ErrorHandler(500, err.message));
			}
		} catch (err) {
			return next(new ErrorHandler(500, err.message));
		}
	}
);

interface IActivationToken {
	token: string;
	activationCode: string;
}

export function createActivationToken(user: any): IActivationToken {
	const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
	const token = jwt.sign({ user, activationCode }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRES_IN,
	});

	return { token, activationCode };
}

// activate user

interface IActivateUser {
	activationToken: string;
	activationCode: string;
}

export const activateUser = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		// console.log(
		// 	`name: ${req.body.name} email: ${req.body.email} password: ${req.body.password}`
		// );

		try {
			const { activationToken, activationCode }: IActivateUser = req.body;

			//			console.log('activationToken', activationToken);

			const decodedUser: { user: IUser; activationCode: string } = jwt.verify(
				activationToken,
				process.env.JWT_SECRET as string
			) as { user: IUser; activationCode: string };

			if (decodedUser.activationCode !== activationCode) {
				return next(new ErrorHandler(400, 'Invalid activation code'));
			}

			//			console.log('decoded', decoded);

			//const { user } = decodedUser;

			//			console.log('user', user);

			const { name, email, password } = decodedUser.user;

			//			console.log('name', name);

			// if (!name || !email || !password) {
			// 	return next(new ErrorHandler(400, 'Invalid user data'));
			// }

			if (await userModel.findOne({ email })) {
				return next(new ErrorHandler(400, 'Email already exists'));
			}

			const newUser = new userModel({
				name,
				email,
				password,
				isVerified: true,
			});

			console.log('newUser', newUser);

			unverifiedUserModel.findOne({ email }).deleteOne().exec();

			//			console.log('newUser', newUser);

			await newUser.save();

			res.status(201).json({
				success: true,
				message: 'Account activated',
			});
		} catch (err) {
			return next(new ErrorHandler(500, err.message));
		}
	}
);

// LOGIN USER

interface ILoginUser {
	email: string;
	password: string;
}

export const loginAdmin = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		// console.log('loginAdmin route hit');
		try {
			const { email, password }: ILoginUser = req.body;

			//			console.log('email', email);

			if (!email || !password) {
				return next(
					new ErrorHandler(
						400,
						'Invalid user data either password or email is missing'
					)
				);
			}

			const user = await userModel
				.findOne({ email, role: 'admin' })
				.select('+password');

			//			console.log('user', user);
			if (!user) {
				return next(new ErrorHandler(401, 'Invalid credentials'));
			}

			const isMatch = await user.comparePassword(password);
			if (!isMatch) {
				return next(new ErrorHandler(401, 'Invalid credentials'));
			}

			createAccessToken(user, 200, res.json('admin logged in successfully')); //send token to client
		} catch (err) {
			return next(new ErrorHandler(500, err.message));
		}
	}
);

export const loginUser = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { email, password }: ILoginUser = req.body;

			//			console.log('email', email);

			if (!email || !password) {
				return next(
					new ErrorHandler(
						400,
						'Invalid user data either password or email is missing'
					)
				);
			}

			const user = await userModel.findOne({ email }).select('+password');

			//			console.log('user', user);
			if (!user) {
				return next(new ErrorHandler(401, 'Invalid credentials'));
			}

			const isMatch = await user.comparePassword(password);
			if (!isMatch) {
				return next(new ErrorHandler(401, 'Invalid credentials'));
			}

			createAccessToken(user, 200, res); //send token to client
		} catch (err) {
			return next(new ErrorHandler(500, err.message));
		}
	}
);

// logout user

export const logoutUser = catchAsyncError(
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			res.cookie('refreshToken', '', {
				maxAge: 0,
			});
			res.cookie('accessToken', '', {
				maxAge: 0,
			});
			res.status(200).json({
				success: true,
				message: 'Logged out Successfully',
			});
		} catch (err) {
			return next(new ErrorHandler(500, err.message));
		}
	}
);

module.exports = {
	registerUser,
	createActivationToken,
	activateUser,
	loginAdmin,
	loginUser,
	logoutUser,
};
