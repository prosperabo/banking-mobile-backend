import express, { Application } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import router from './routes';
import { config } from './config';

const { nodeEnv, clientUrls, version } = config;

const app: Application = express();

// Middleware
app.use(express.json());
app.use(morgan('tiny'));

const corsOptions = {
  origin: nodeEnv === 'development' ? '*' : clientUrls,
};
app.use(cors(corsOptions));

app.use(`/api/v${version}`, router);

export default app;
