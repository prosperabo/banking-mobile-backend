import express, { Application, Request as ExpressRequest } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import path from 'path';
import { expressErrorHandler } from './shared/handlers';
import router from './routes';
import { config } from './config';

const { nodeEnv, clientUrls, version } = config;

const app: Application = express();

// Middleware
app.use(
  express.json({
    verify: (req: ExpressRequest & { rawBody?: Buffer }, _res, buf) => {
      // Preserve raw body for webhook signature verification
      req.rawBody = buf;
    },
  })
);
app.use(morgan('tiny'));

const corsOptions = {
  origin: nodeEnv === 'development' ? '*' : clientUrls,
};

app.use(cors(corsOptions));

// Serve static files from public directory
app.use('/public', express.static(path.join(__dirname, '../public')));

app.use(`/api/v${version}`, router);

// Global error handler (must be registered after routes)

app.use(expressErrorHandler);

export default app;
