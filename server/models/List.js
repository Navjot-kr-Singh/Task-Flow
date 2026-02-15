const mongoose = require('mongoose');

const ListSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a list name'],
        trim: true,
    },
    board: {
        type: mongoose.Schema.ObjectId,
        ref: 'Board',
        required: true,
    },
    position: {
        type: Number,
        required: true,
        default: 0,
    },
}, { timestamps: true });

module.exports = mongoose.model('List', ListSchema);
