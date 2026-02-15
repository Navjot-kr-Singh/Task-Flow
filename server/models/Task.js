const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a task title'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    board: {
        type: mongoose.Schema.ObjectId,
        ref: 'Board',
        required: true,
    },
    list: {
        type: mongoose.Schema.ObjectId,
        ref: 'List',
        required: true,
    },
    assignedUsers: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    }],
    position: {
        type: Number,
        required: true,
        default: 0,
    },
    isCompleted: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

// Index for search
TaskSchema.index({ title: 'text' });

module.exports = mongoose.model('Task', TaskSchema);
