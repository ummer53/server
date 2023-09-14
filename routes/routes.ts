import express from 'express';
import {
	activateUser,
	loginAdmin,
	loginUser,
	logoutUser,
	registerUser,
} from '../controllers/userController';

const userRoutes = express.Router();

userRoutes.post('/register', registerUser);
userRoutes.post('/activate', activateUser);
userRoutes.post('/login', loginUser);
userRoutes.get('/logout', logoutUser);
userRoutes.post('/admin', loginAdmin);
export default userRoutes;
