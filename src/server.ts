import { ChatServer } from './chat-server';
import { Routes } from './routes/index';
 
let app = new ChatServer().getApp();
const routes = new Routes(app);
 
routes.getRoutes();
 
export default app;
