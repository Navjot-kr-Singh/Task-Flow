const express = require('express');
const {
    createList,
    updateList,
    deleteList,
    reorderLists
} = require('../controllers/listController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router
    .route('/')
    .post(authorize('admin'), createList);

router.put('/reorder', authorize('admin'), reorderLists);

router
    .route('/:id')
    .put(authorize('admin'), updateList)
    .delete(authorize('admin'), deleteList);

module.exports = router;
