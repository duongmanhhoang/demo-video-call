const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoomSchema = new Schema({
    _id: Schema.Types.ObjectId,
    code: {
        type: String,
        required: true,
        max: 10
    },
    status: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Room', RoomSchema);
