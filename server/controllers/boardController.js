const Board = require('../models/Board');
const User = require('../models/User');
const List = require('../models/List');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all boards
// @route   GET /api/boards
// @access  Private
exports.getBoards = asyncHandler(async (req, res, next) => {
    const boards = await Board.find({
        $or: [{ owner: req.user.id }, { members: req.user.id }],
    }).sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: boards.length,
        data: boards,
    });
});

// @desc    Get single board
// @route   GET /api/boards/:id
// @access  Private
exports.getBoard = asyncHandler(async (req, res, next) => {
    const board = await Board.findById(req.params.id)
        .populate('members', 'name email role')
        .populate('owner', 'name email');

    if (!board) {
        return res.status(404).json({ success: false, error: 'Board not found' });
    }

    // Check if user is member or owner
    const isMember = board.members.some(
        (member) => member._id.toString() === req.user.id
    );
    if (board.owner._id.toString() !== req.user.id && !isMember) {
        return res.status(403).json({ success: false, error: 'Not authorized to access this board' });
    }

    // Get lists for this board
    const lists = await List.find({ board: board._id }).sort('position');

    // Get tasks for this board
    const tasks = await Task.find({ board: board._id }).sort('position').populate('assignedUsers', 'name email');

    res.status(200).json({
        success: true,
        data: { ...board.toObject(), lists, tasks },
    });
});

// @desc    Create board
// @route   POST /api/boards
// @access  Private (Admin only)
exports.createBoard = asyncHandler(async (req, res, next) => {
    // Add user to req.body based on auth
    req.body.owner = req.user.id;
    // Initialize members with owner
    req.body.members = [req.user.id];

    const board = await Board.create(req.body);

    // Log activity
    await Activity.create({
        user: req.user.id,
        board: board._id,
        action: 'created board',
        details: `Board "${board.name}" created`,
    });

    res.status(201).json({
        success: true,
        data: board,
    });
});

// @desc    Add member to board
// @route   PUT /api/boards/:id/members
// @access  Private (Admin only)
exports.addMember = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    const board = await Board.findById(req.params.id);

    if (!board) {
        return res.status(404).json({ success: false, error: 'Board not found' });
    }

    if (board.owner.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to add members to this board' });
    }

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (board.members.includes(user._id)) {
        return res.status(400).json({ success: false, error: 'User is already a member' });
    }

    board.members.push(user._id);
    await board.save();

    await Activity.create({
        user: req.user.id,
        board: board._id,
        action: 'added member',
        details: `Added ${user.name} to board`,
    });

    res.status(200).json({
        success: true,
        data: board
    });
});

// @desc    Delete board
// @route   DELETE /api/boards/:id
// @access  Private (Admin only)
exports.deleteBoard = asyncHandler(async (req, res, next) => {
    const board = await Board.findById(req.params.id);

    if (!board) {
        return res.status(404).json({ success: false, error: 'Board not found' });
    }

    // Make sure user is board owner
    if (board.owner.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this board' });
    }

    await board.deleteOne();

    // Delete associated lists, tasks, activities
    await List.deleteMany({ board: board._id });
    await Task.deleteMany({ board: board._id });
    await Activity.deleteMany({ board: board._id });

    res.status(200).json({
        success: true,
        data: {},
    });
});
