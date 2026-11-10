import { Router } from 'express';
import { authController } from '../controllers/authController';
import { redirectIfAuthenticated } from '../middleware/auth';
import { loginLimiter, registerLimiter } from '../middleware/rateLimit';

export const authRoutes = Router();

authRoutes.get('/login', redirectIfAuthenticated, authController.showLogin);
authRoutes.post('/login', redirectIfAuthenticated, loginLimiter, authController.login);

authRoutes.get('/register', redirectIfAuthenticated, authController.showRegister);
authRoutes.post('/register', redirectIfAuthenticated, registerLimiter, authController.register);

// Logout is POST-only (with CSRF token) so it can't be triggered by a link or <img>.
// It works even if the login already expired: the session is destroyed either way.
authRoutes.post('/logout', authController.logout);
