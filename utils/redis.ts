import { Redis } from 'ioredis';

require('dotenv').config();

const redisClient = () => {
	if (process.env.REDIS_URL) {
		console.log('redis url', process.env.REDIS_URL);
		return process.env.REDIS_URL;
	} else {
		throw new Error('No redis url found');
	}
};

export const redis = new Redis(redisClient());
