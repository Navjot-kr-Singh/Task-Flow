const Task = require('../models/Task');
const List = require('../models/List');
const Board = require('../models/Board');
const Activity = require('../models/Activity');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create task
// @route   POST /api/tasks
// @access  Private (Admin only)
exports.createTask = asyncHandler(async (req, res, next) => {
    const { title, description, listId, boardId, assignedUsers } = req.body;

    const board = await Board.findById(boardId);
    if (!board) {
        return res.status(404).json({ success: false, error: 'Board not found' });
    }

    if (board.owner.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to create tasks on this board' });
    }

    // Get max position for tasks in this list
    const tasks = await Task.find({ list: listId });
    const position = tasks.length > 0 ? tasks.length : 0;

    const task = await Task.create({
        title,
        description,
        list: listId,
        board: boardId,
        assignedUsers: assignedUsers || [],
        position,
    });

    await Activity.create({
        user: req.user.id,
        board: boardId,
        action: 'created task',
        task: task._id,
        details: `Task "${task.title}" created`,
    });

    const populatedTask = await Task.findById(task._id).populate('assignedUsers', 'name email');

    req.io.to(boardId).emit('taskCreated', populatedTask);

    res.status(201).json({
        success: true,
        data: populatedTask,
    });
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private (Admin: all, User: status only)
exports.updateTask = asyncHandler(async (req, res, next) => {
    let task = await Task.findById(req.params.id);

    if (!task) {
        return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const board = await Board.findById(task.board);

    // If user is admin (owner), can update everything
    if (board.owner.toString() === req.user.id) {

        if (req.body.isCompleted !== undefined) {
            task.isCompleted = req.body.isCompleted;
            if (task.isCompleted) {
                task.completedBy = req.user.id;
                task.completedAt = Date.now();
            } else {
                task.completedBy = null;
                task.completedAt = null;
            }
        }

        if (req.body.title) task.title = req.body.title;
        if (req.body.description) task.description = req.body.description;
        if (req.body.assignedUsers) task.assignedUsers = req.body.assignedUsers;
        if (req.body.list) task.list = req.body.list;

        await task.save();
        await task.populate('assignedUsers', 'name email');
        await task.populate('completedBy', 'name');

        // Log if status changed or assigned users changed (simplified for now)
        if (req.body.isCompleted !== undefined) {
            await Activity.create({
                user: req.user.id,
                board: board._id,
                action: 'updated task status',
                task: task._id,
                details: `Task "${task.title}" status updated to ${req.body.isCompleted ? 'Done' : 'Undone'}`,
            });
        }

        req.io.to(task.board.toString()).emit('taskUpdated', task);

    } else {
        // If user is member, can ONLY update isCompleted status
        // Check if user is assigned to this task OR is just a member of the board (requirement: User can update task status)
        // Requirement says: "User ... Can update task status (done/undone)"

        // Check if user is member of board
        const isMember = board.members.some(m => m.toString() === req.user.id);
        if (!isMember) {
            return res.status(403).json({ success: false, error: 'Not authorized to update this task' });
        }

        // Only allow updating isCompleted
        if (req.body.title || req.body.description || req.body.assignedUsers) {
            return res.status(403).json({ success: false, error: 'Users can only update task status' });
        }

        task.isCompleted = req.body.isCompleted;

        if (task.isCompleted) {
            task.completedBy = req.user.id;
            task.completedAt = Date.now();
        } else {
            task.completedBy = null;
            task.completedAt = null;
        }

        await task.save();
        await task.populate('completedBy', 'name');

        await Activity.create({
            user: req.user.id,
            board: board._id,
            action: 'updated task status',
            task: task._id,
            details: `Task "${task.title}" status updated to ${task.isCompleted ? 'Done' : 'Undone'}`,
        });

        req.io.to(task.board.toString()).emit('taskUpdated', task);
    }

    res.status(200).json({
        success: true,
        data: task,
    });
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin only)
exports.deleteTask = asyncHandler(async (req, res, next) => {
    const task = await Task.findById(req.params.id);

    if (!task) {
        return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const board = await Board.findById(task.board);
    if (board.owner.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this task' });
    }

    await task.deleteOne();

    await Activity.create({
        user: req.user.id,
        board: board._id,
        action: 'deleted task',
        details: `Task "${task.title}" deleted`,
    });

    req.io.to(board._id.toString()).emit('taskDeleted', task._id);

    res.status(200).json({
        success: true,
        data: {},
    });
});

// @desc    Move task (drag and drop)
// @route   PUT /api/tasks/:id/move
// @access  Private (Admin only)
exports.moveTask = asyncHandler(async (req, res, next) => {
    const { newListId, newPosition } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
        return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const board = await Board.findById(task.board);
    if (board.owner.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to move this task' });
    }

    // If moving to a different list
    if (newListId && newListId !== task.list.toString()) {
        const oldListId = task.list;

        // Remove from old list by shifting positions of tasks below it
        await Task.updateMany(
            { list: oldListId, position: { $gt: task.position } },
            { $inc: { position: -1 } }
        );

        // Make space in new list
        await Task.updateMany(
            { list: newListId, position: { $gte: newPosition } },
            { $inc: { position: 1 } }
        );

        task.list = newListId;
        task.position = newPosition;
    } else {
        // Moving within same list
        const oldPosition = task.position;

        if (oldPosition < newPosition) {
            // Moving down: shift items between old and new positions UP (-1)
            await Task.updateMany(
                { list: task.list, position: { $gt: oldPosition, $lte: newPosition } },
                { $inc: { position: -1 } }
            );
        } else if (oldPosition > newPosition) {
            // Moving up: shift items between new and old positions DOWN (+1)
            await Task.updateMany(
                { list: task.list, position: { $gte: newPosition, $lt: oldPosition } },
                { $inc: { position: 1 } }
            );
        }
        task.position = newPosition;
    }

    await task.save();

    req.io.to(board._id.toString()).emit('taskMoved', {
        taskId: task._id,
        newListId: task.list,
        newPosition: task.position
    });

    res.status(200).json({ success: true, data: task });
});
