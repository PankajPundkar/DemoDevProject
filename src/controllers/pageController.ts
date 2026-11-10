import type { Request, Response } from 'express';

export const pageController = {
  home(req: Request, res: Response) {
    const extraMessages = req.query.loggedOut === '1' ? [{ type: 'success', text: 'You have been logged out.' }] : [];
    return res.renderPage('home', { title: 'Home', extraMessages });
  },

  dashboard(req: Request, res: Response) {
    // req.user only contains safe public fields (see toPublicUser).
    return res.renderPage('dashboard', { title: 'Dashboard', user: req.user });
  },

  privacy(_req: Request, res: Response) {
    return res.renderPage('privacy', { title: 'Privacy Policy' });
  },

  cookies(_req: Request, res: Response) {
    return res.renderPage('cookies', { title: 'Cookie Policy' });
  },

  terms(_req: Request, res: Response) {
    return res.renderPage('terms', { title: 'Terms of Use' });
  },
};
