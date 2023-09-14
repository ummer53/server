import mongoose from 'mongoose';
require('dotenv').config();
const dbURI = process.env.DB_URI;

export const connect = async () => {
	try {
		const conn = await mongoose.connect(dbURI);
		console.log(`Connected to DB${conn.connection.host}}`);
	} catch (err) {
		console.log(err.message);
		setTimeout(connect, 5000);
	}
};
