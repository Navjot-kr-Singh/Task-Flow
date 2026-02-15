const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a board name'],
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters'],
    },
    owner: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    members: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    }],
}, { timestamps: true });

module.exports = mongoose.model('Board', BoardSchema);
