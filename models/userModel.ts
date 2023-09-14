require('dotenv').config();
import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const emailRegexPattern = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;

export interface IUser extends Document {
	name: string;
	email: string;
	password: string;

	avatar: {
		public_id: string;
		url: string;
	};
	role: string;
	isVerified: boolean;

	comparePassword: (password: string) => Promise<boolean>;
	signAccessToken: () => string;
	signRefreshToken: () => string;
}

const unverifiedUserSchema: Schema<IUser> = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Please enter your name'],
			maxLength: [30, 'Your name cannot exceed 30 characters'],
		},
		email: {
			type: String,
			required: [true, 'Please enter your email'],
			unique: true,

			match: [emailRegexPattern, 'Please enter a valid email address'],
		},
		password: {
			type: String,
			required: [true, 'Please enter your password'],
			minLength: [6, 'Your password must be longer than 6 characters'],
			select: false,
		},
		avatar: {
			public_id: {
				type: String,
				// required: true,
			},
			url: {
				type: String,
				// required: true,
			},
		},
		role: {
			type: String,
			default: 'user',
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

// Compare this snippet from models/userModel.ts:

const userSchema: Schema<IUser> = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Please enter your name'],
			maxLength: [30, 'Your name cannot exceed 30 characters'],
		},
		email: {
			type: String,
			required: [true, 'Please enter your email'],
			unique: true,

			/*

        validate: {
            function ValidateEmail(email:string) {
            return emailRegexPattern.test(email);
        }

        message: 'Please enter a valid email address'
        }
        
        */

			match: [emailRegexPattern, 'Please enter a valid email address'],
		},
		password: {
			type: String,
			required: [true, 'Please enter your password'],
			minLength: [6, 'Your password must be longer than 6 characters'],
			select: false,
		},
		avatar: {
			public_id: {
				type: String,
				// required: true,
			},
			url: {
				type: String,
				// required: true,
			},
		},
		role: {
			type: String,
			default: 'user',
		},
		isVerified: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

// sign access token

userSchema.methods.signAccessToken = function (): string {
	return jwt.sign(
		{ id: this._id },
		(process.env.ACCESS_TOKEN_SECRET as string) || ''
	);
};

// sign refresh token

userSchema.methods.signRefreshToken = function (): string {
	return jwt.sign(
		{ id: this._id },
		(process.env.REFRESH_TOKEN_SECRET as string) || ''
	);
};

//Hash the password

userSchema.pre<IUser>('save', async function (next) {
	if (!this.isModified('password')) {
		next();
	}

	this.password = await bcrypt.hash(this.password, 10);
});

//compare password

userSchema.methods.comparePassword = async function (
	enteredPassword: string
): Promise<boolean> {
	return await bcrypt.compare(enteredPassword, this.password);
};

const userModel: Model<IUser> = mongoose.model('User', userSchema);
export const unverifiedUserModel: Model<IUser> = mongoose.model(
	'UnverifiedUser',
	unverifiedUserSchema
);

export default userModel;
