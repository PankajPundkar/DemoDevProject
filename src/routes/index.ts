import { Router } from 'express';
import { authRoutes } from './authRoutes';
import { pageRoutes } from './pageRoutes';
import { apiRoutes } from './apiRoutes';

export const routes = Router();

routes.use(pageRoutes);
routes.use(authRoutes);
routes.use('/api', apiRoutes);
