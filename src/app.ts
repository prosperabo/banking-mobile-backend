import express, { Application, Request as ExpressRequest } from 'express';
import morgan from 'morgan';
import cors from 'cors';
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

app.use(`/api/v${version}`, router);

export default app;
