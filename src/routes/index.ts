import * as express from 'express';
import * as path from 'path';
import mongoose from 'mongoose';
import Room from "../models/Room";

export class Routes {
    private app: express.Application;
    private rootFolder: String;

    constructor(app) {
        this.app = app;
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
                await response.send(newRoom);
            } catch (err) {
                response.status(400).send(err);
            }
        });
    }

    private getRoom(): void {
        this.app.get('/get-room/:code', async (request, response) => {
            const roomCode = request.params.code;
            const room = await Room.findOne({ code: roomCode }).exec();
            
            if (!room) {
                return response.status(400).send({
                    'message': 'not found'
                });
            }

            return response.status(200).send(room);
        })
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
        this.createRoom();
        this.getRoom();
    }
}
