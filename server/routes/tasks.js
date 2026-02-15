const express = require('express');
const {
    createTask,
    updateTask,
    deleteTask,
    moveTask
} = require('../controllers/taskController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', authorize('admin'), createTask);
router.put('/:id', updateTask); // User can update status, Admin can update all
router.delete('/:id', authorize('admin'), deleteTask);
router.put('/:id/move', authorize('admin'), moveTask);

module.exports = router;
