import * as express from "express";
import * as dotenv from "dotenv";
import * as path from "path";
import * as socketIo from "socket.io";
import { createServer, Server } from "http";
dotenv.config();

export class ChatServer {
    private app: express.Application;
    private port: string;
    private server: Server;
    private io: socketIo.Server;
    private activeSockets: string[] = [];

    constructor() {
        this.createApp();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();
    }

    private createApp(): void {
        this.app = express();
        this.app.use(express.static(path.join(__dirname, "../public")));
    }

    private config(): void {
        this.port = process.env.PORT;
    }

    private listen(): void {
        this.server.listen(this.port);
        this.io.on("connection", (socket) => {
            const existingSocket = this.activeSockets.find(
                (existingSocket) => existingSocket === socket.id
            );

            if (!existingSocket) {
                this.activeSockets.push(socket.id);

                socket.broadcast.emit("add-users", {
                    users: [socket.id],
                });
            }

            socket.on("call-user", (data) => {
                socket.to(data.to).emit("call-made", {
                    offer: data.offer,
                    socket: socket.id
                });
            });

            socket.on("make-answer", (data) => {
                socket.to(data.to).emit("answer-made", {
                    socket: socket.id,
                    answer: data.answer,
                });
            });

            socket.on("reject-call", (data) => {
                socket.to(data.from).emit("call-rejected", {
                    socket: socket.id,
                });
            });

            socket.on("disconnect", () => {
                this.activeSockets = this.activeSockets.filter(
                    (existingSocket) => existingSocket !== socket.id
                );
                this.io.emit("remove-user", {
                    user: socket.id,
                });
            });
            // socket.on("make-offer", (data) => {
            //     socket.to(data.to).emit("offer-made", {
            //         offer: data.offer,
            //         socket: socket.id,
            //     });
            // });

            // socket.on("make-answer", (data) => {
            //     socket.to(data.to).emit("answer-made", {
            //         socket: socket.id,
            //         answer: data.answer,
            //     });
            // });
        });
    }

    private createServer(): void {
        this.server = createServer(this.app);
    }

    private sockets(): void {
        this.io = socketIo(this.server);
    }

    public getApp(): express.Application {
        return this.app;
    }
}
