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
    private users: any[] = [];
    private socketRoomMap: any[] = [];

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
        this.app.set('port', this.port);
    }

    private listen = async () => {
        this.server.listen(this.port);
        const rooms = await Room.find({}).exec();
        this.io.on("connection", async (socket) => {
            socket.on("join-room", (roomCode, userDetail) => {
                socket.join(roomCode);
                const newUser = {
                    socketId: socket.id,
                    ...userDetail,
                };

                if (this.users[roomCode]) {
                    this.users[roomCode].push(newUser);
                } else {
                    this.users[roomCode] = [newUser];
                }

                this.socketRoomMap[socket.id] = roomCode;

                const usersInThisRoom = this.users[roomCode].filter(
                    (user) => user.socketId !== socket.id
                );

                socket.emit("users-present-in-room", usersInThisRoom);

                socket.on(`send-chat-${roomCode}`, (data) => {
                    this.io.sockets.emit(`send-chat-${roomCode}`, data);
                })
            });
            

            socket.on("initiate-signal", (payload) => {
                const roomCode = this.socketRoomMap[socket.id];
                let room = this.users[roomCode];
                let name = "";

                if (room) {
                    const user = room.find(
                        (user) => user.socketId === socket.id
                    );
                    name = user.name;
                }

                this.io.to(payload.userToSignal).emit("user-joined", {
                    signal: payload.signal,
                    callerId: payload.callerId,
                    name,
                });
            });

            socket.on("ack-signal", (payload) => {
                this.io.to(payload.callerId).emit("signal-accepted", {
                    signal: payload.signal,
                    id: socket.id,
                });
            });

            socket.on("disconnect", () => {
                const roomCode = this.socketRoomMap[socket.id];
                let room = this.users[roomCode];
                if (room) {
                    room = room.filter((user) => user.socketId !== socket.id);
                    this.users[roomCode] = room;
                }
                // on disconnect sending to all users that user has disconnected
                socket.to(roomCode).broadcast.emit("user-disconnected", socket.id);
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
