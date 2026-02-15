import { create } from 'zustand';
import api from '../api/axios';

const useBoardStore = create((set, get) => ({
    boards: [],
    currentBoard: null,
    isLoading: false,
    error: null,

    fetchBoards: async () => {
        set({ isLoading: true, error: null });
        try {
            const res = await api.get('/boards');
            set({ boards: res.data.data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    },

    fetchBoard: async (id) => {
        set({ isLoading: true, error: null, currentBoard: null }); // Clear current board first
        try {
            const res = await api.get(`/boards/${id}`);
            set({ currentBoard: res.data.data, isLoading: false });
        } catch (error) {
            set({ error: error.response?.data?.error || 'Failed to fetch board', isLoading: false });
        }
    },

    createBoard: async (boardData) => {
        try {
            const res = await api.post('/boards', boardData);
            set((state) => ({ boards: [res.data.data, ...state.boards] }));
            return res.data.data;
        } catch (error) {
            throw error;
        }
    },

    // Real-time update actions
    updateList: (updatedList) => {
        const { currentBoard } = get();
        if (!currentBoard) return;

        const newLists = currentBoard.lists.map(list =>
            list._id === updatedList._id ? updatedList : list
        );

        set({ currentBoard: { ...currentBoard, lists: newLists } });
    },

    addList: (newList) => {
        const { currentBoard } = get();
        if (!currentBoard) return;

        set({ currentBoard: { ...currentBoard, lists: [...currentBoard.lists, newList] } });
    },

    deleteList: (listId) => {
        const { currentBoard } = get();
        if (!currentBoard) return;

        set({ currentBoard: { ...currentBoard, lists: currentBoard.lists.filter(l => l._id !== listId) } });
    },

    reorderListsInStore: (listIds) => {
        const { currentBoard } = get();
        if (!currentBoard) return;

        // Create a map for quick lookup
        const listMap = new Map(currentBoard.lists.map(l => [l._id, l]));

        // Reconstruct the array based on listIds order
        const newLists = listIds.map(id => listMap.get(id)).filter(Boolean);

        // Add any lists that might be missing from listIds (edge case safety)
        currentBoard.lists.forEach(l => {
            if (!listIds.includes(l._id)) newLists.push(l);
        });

        set({ currentBoard: { ...currentBoard, lists: newLists } });
    },

    addTask: (newTask) => {
        const { currentBoard } = get();
        if (!currentBoard) return;

        set({ currentBoard: { ...currentBoard, tasks: [...currentBoard.tasks, newTask] } });
    },

    updateTask: (updatedTask) => {
        const { currentBoard } = get();
        if (!currentBoard) return;

        const newTasks = currentBoard.tasks.map(task =>
            task._id === updatedTask._id ? updatedTask : task
        );

        set({ currentBoard: { ...currentBoard, tasks: newTasks } });
    },

    deleteTask: (taskId) => {
        const { currentBoard } = get();
        if (!currentBoard) return;

        set({ currentBoard: { ...currentBoard, tasks: currentBoard.tasks.filter(t => t._id !== taskId) } });
    },

    moveTaskInStore: (taskId, newListId, newPosition) => {
        const { currentBoard } = get();
        if (!currentBoard) return;

        // Optimistic update is complex here because we need to recalculate positions
        // For now, simpler approach: Update the specific task's list and position
        // and sort. A full fetch might be safer but less "optimistic".
        // Let's trust the backend socket event to trigger a clean update mostly,
        // but for local drag end we might want immediate feedback.
        // NOTE: We rely on the socket event 'taskMoved' which sends the updated structure or we re-fetch.
        // But actually, the backend 'taskMoved' event sends { taskId, newListId, newPosition }.

        // We will implement a smart reorder here later if needed.
        // Ideally, simple update:
        const newTasks = currentBoard.tasks.map(task => {
            if (task._id === taskId) {
                return { ...task, list: newListId, position: newPosition };
            }
            return task;
        });

        set({ currentBoard: { ...currentBoard, tasks: newTasks } });
    },

    // Real-time helper to completely replace board data if needed
    setBoard: (boardData) => set({ currentBoard: boardData }),

}));

export default useBoardStore;
