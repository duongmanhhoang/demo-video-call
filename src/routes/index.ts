import * as express from 'express';
import * as path from 'path';
import mongoose from 'mongoose';
import Room from "../models/Room";

export class Routes {
    private app: express.Application;
    private rootFolder: String;

    constructor(app) {
        this.app = app;
        this.rootFolder = path.join(__dirname, '../views/');
    }

    private home(): void {
        this.app.get('/', (request, response) => {
            response.sendFile('index.html', { root: this.rootFolder });
        });
    }

    private room(): void {
        this.app.get('/room/:code', (request, response) => {
            response.sendFile('room.html', { root: this.rootFolder });
        });
    }

    private createRoom(): void {
        this.app.post('/create-room', async (request, response) => {
            let roomCode = await this.makeRandomString(5);
            let checkRoomCodeExist = await Room.find({ code: roomCode }).exec();
            
            while (checkRoomCodeExist.length) {
                checkRoomCodeExist = await this.makeRandomString(5);
                checkRoomCodeExist = await Room.find({ code: roomCode }).exec();
            }

            const room = await new Room({
                _id: new mongoose.Types.ObjectId(),
                code: roomCode,
                status: 1
            });

            try {
                const newRoom = await room.save();
                // await response.send(newRoom);
                response.writeHead(302, {
                    'Location': `room/${newRoom.code}`
                  });
                response.end();
            } catch (err) {
                response.status(400).send(err);
            }
        });
    }

    private makeRandomString = function(length) {
        let firstString  = '';
        let secondString = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;

        for ( let i = 0; i < length; i++ ) {
            firstString += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        for ( let i = 0; i < length; i++ ) {
            secondString += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        return `${firstString}-${secondString}`;
     }

    public getRoutes(): void {
        this.home();
        this.room();
        this.createRoom();
    }
}
