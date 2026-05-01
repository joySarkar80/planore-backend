import express, { Application, Request, Response, Router } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import globalErrorHandler from './middlewares/globalErrorHandler';
import notFound from './middlewares/notFound';
import router from './routes';

const app: Application = express();
app.set("trust proxy", 1);
// parsers
app.use(express.json());
// app.use(cors());
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


// application routes
app.use('/api/v1', router);


app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Planora server!');
});
app.use(globalErrorHandler);
app.use(notFound);

export default app;
