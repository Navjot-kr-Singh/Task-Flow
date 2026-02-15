const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    board: {
        type: mongoose.Schema.ObjectId,
        ref: 'Board',
        required: true,
    },
    action: {
        type: String,
        required: true,
    },
    task: {
        type: mongoose.Schema.ObjectId,
        ref: 'Task',
    },
    details: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model('Activity', ActivitySchema);
