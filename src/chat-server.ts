import express from "express";
import dotenv from "dotenv";
import path from "path";
import socketIo from "socket.io";
import { createServer, Server } from "http";
import Room from "./models/Room";
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

    private listen = async () => {
        this.server.listen(this.port);
        const rooms = await Room.find({}).exec();
        this.io.on("connection", async (socket) => {
            // console.log(socket.id)
            // const existingSocket = this.activeSockets.find(
            //     (existingSocket) => existingSocket === socket.id
            // );

            // if (!existingSocket) {
            //     this.activeSockets.push(socket.id);

            //     socket.broadcast.emit(`add-users-${code}`, {
            //         users: [socket.id],
            //     });
            // }
            await rooms.forEach((room) => {
                const { code } = room;

                socket.broadcast.emit(`add-users-${code}`, {
                    users: [socket.id],
                });
                socket.on(`call-user-${code}`, (data) => {
                    socket.to(data.to).emit(`call-made-${code}`, {
                        offer: data.offer,
                        socket: socket.id,
                    });
                });

                socket.on(`make-answer-${code}`, (data) => {
                    socket.to(data.to).emit(`answer-made-${code}`, {
                        socket: socket.id,
                        answer: data.answer,
                    });
                });

                socket.on(`reject-call-${code}`, (data) => {
                    socket.to(data.from).emit("call-rejected", {
                        socket: socket.id,
                    });
                });
            });
            console.log(socket._events);

            socket.on("disconnect", () => {
                this.activeSockets = this.activeSockets.filter(
                    (existingSocket) => existingSocket !== socket.id
                );
                // this.io.emit(`remove-user-${code}`, {
                //     user: socket.id,
                // });
            });
        });
    };

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
