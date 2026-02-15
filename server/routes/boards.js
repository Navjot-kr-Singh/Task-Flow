const express = require('express');
const {
    getBoards,
    getBoard,
    createBoard,
    deleteBoard,
    addMember
} = require('../controllers/boardController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router
    .route('/')
    .get(getBoards)
    .post(authorize('admin'), createBoard);

router
    .route('/:id')
    .get(getBoard)
    .delete(authorize('admin'), deleteBoard);

router.route('/:id/members').put(authorize('admin'), addMember);

module.exports = router;
