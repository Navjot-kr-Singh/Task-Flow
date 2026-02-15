const List = require('../models/List');
const Board = require('../models/Board');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create new list
// @route   POST /api/lists
// @access  Private (Admin only)
exports.createList = asyncHandler(async (req, res, next) => {
    const { name, boardId } = req.body;

    const board = await Board.findById(boardId);
    if (!board) {
        return res.status(404).json({ success: false, error: 'Board not found' });
    }

    if (board.owner.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to add list to this board' });
    }

    // Get max position
    const lists = await List.find({ board: boardId });
    const position = lists.length > 0 ? lists.length : 0;

    const list = await List.create({
        name,
        board: boardId,
        position,
    });

    req.io.to(boardId).emit('listCreated', list);

    await Activity.create({
        user: req.user.id,
        board: boardId,
        action: 'created list',
        details: `List "${list.name}" created`,
    });

    res.status(201).json({
        success: true,
        data: list,
    });
});

// @desc    Update list
// @route   PUT /api/lists/:id
// @access  Private (Admin only)
exports.updateList = asyncHandler(async (req, res, next) => {
    let list = await List.findById(req.params.id);

    if (!list) {
        return res.status(404).json({ success: false, error: 'List not found' });
    }

    const board = await Board.findById(list.board);
    if (board.owner.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to update this list' });
    }

    list = await List.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    req.io.to(list.board.toString()).emit('listUpdated', list);

    res.status(200).json({
        success: true,
        data: list,
    });
});

// @desc    Delete list
// @route   DELETE /api/lists/:id
// @access  Private (Admin only)
exports.deleteList = asyncHandler(async (req, res, next) => {
    const list = await List.findById(req.params.id);

    if (!list) {
        return res.status(404).json({ success: false, error: 'List not found' });
    }

    const board = await Board.findById(list.board);
    if (board.owner.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this list' });
    }

    await list.deleteOne();

    // Delete all tasks in this list
    await Task.deleteMany({ list: list._id });

    // Reorder remaining lists
    const lists = await List.find({ board: list.board }).sort('position');
    for (let i = 0; i < lists.length; i++) {
        if (lists[i].position !== i) {
            lists[i].position = i;
            await lists[i].save();
        }
    }

    req.io.to(list.board.toString()).emit('listDeleted', list._id);

    await Activity.create({
        user: req.user.id,
        board: list.board,
        action: 'deleted list',
        details: `List "${list.name}" deleted`,
    });

    res.status(200).json({
        success: true,
        data: {},
    });
});

// @desc    Reorder lists
// @route   PUT /api/lists/reorder
// @access  Private (Admin only)
exports.reorderLists = asyncHandler(async (req, res, next) => {
    const { boardId, listIds } = req.body;

    const board = await Board.findById(boardId);
    if (board.owner.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to reorder lists on this board' });
    }

    for (let i = 0; i < listIds.length; i++) {
        await List.findByIdAndUpdate(listIds[i], { position: i });
    }

    req.io.to(boardId).emit('listsReordered', listIds);

    res.status(200).json({ success: true, data: {} });
});
