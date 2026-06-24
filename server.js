import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { localeMiddleware } from './middleware/locale.js';
import routes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bookgo API is running',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

app.use(cors());
app.use(express.json({ strict: false }));
app.use(localeMiddleware);

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, private, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Vary', 'Authorization');
  next();
});

app.use(routes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: req.t('errors.routeNotFound')
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: req.t?.('errors.serverError') ?? 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Bookgo API listening on port ${PORT}`);
});
