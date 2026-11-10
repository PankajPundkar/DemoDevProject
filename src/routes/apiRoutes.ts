import { Router } from 'express';
import { apiController } from '../controllers/apiController';
import { requireAuthApi } from '../middleware/auth';
import { apiLimiter } from '../middleware/rateLimit';

export const apiRoutes = Router();

apiRoutes.use(apiLimiter);
apiRoutes.get('/me', requireAuthApi, apiController.me);
apiRoutes.post('/consent', apiController.recordConsent);
