import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { ChatServer } from './chat-server';
import { Routes } from './routes/index';


dotenv.config();

mongoose.connect(
    process.env.DB_CONNECT,
    { useUnifiedTopology: true, useNewUrlParser: true },
    () => console.log('DB Connected')
  );
 
let app = new ChatServer().getApp();
app.use(cors());
const routes = new Routes(app);
 
routes.getRoutes();
 
export default app;
