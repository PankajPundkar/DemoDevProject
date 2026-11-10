import { Router } from 'express';
import { pageController } from '../controllers/pageController';
import { requireAuth } from '../middleware/auth';

export const pageRoutes = Router();

pageRoutes.get('/', pageController.home);
pageRoutes.get('/dashboard', requireAuth, pageController.dashboard);
pageRoutes.get('/privacy', pageController.privacy);
pageRoutes.get('/cookies', pageController.cookies);
pageRoutes.get('/terms', pageController.terms);
