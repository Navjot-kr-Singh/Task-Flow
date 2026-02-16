import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
} from '@dnd-kit/sortable';

import useBoardStore from '../store/boardStore';
import useAuthStore from '../store/authStore';
import ListColumn from '../components/ListColumn';
import TaskCard from '../components/TaskCard';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Plus, Search, UserPlus } from 'lucide-react'; // Added UserPlus icon
import api from '../api/axios';

const BoardView = () => {
    const { id } = useParams();
    const {
        currentBoard,
        fetchBoard,
        isLoading,
        updateTask: updateTaskStore,
        addTask: addTaskStore,
        deleteTask: deleteTaskStore,
        moveTaskInStore,
        updateList: updateListStore,
        addList: addListStore,
        deleteList: deleteListStore,
        reorderListsInStore
    } = useBoardStore();

    const { user } = useAuthStore();
    const [activeId, setActiveId] = useState(null);
    const [activeTask, setActiveTask] = useState(null);
    const [activeList, setActiveList] = useState(null);

    // Modals state
    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isMemberModalOpen, setIsMemberModalOpen] = useState(false); // New modal state
    const [selectedListId, setSelectedListId] = useState(null);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [newListName, setNewListName] = useState('');
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [memberEmail, setMemberEmail] = useState(''); // New member email state

    const isAdmin = user?.role === 'admin';

    // Socket.io connection
    useEffect(() => {
        // Force new connection
        const socket = io('http://localhost:5001', {
            transports: ['websocket', 'polling'], // Ensure robust connection
        });

        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            socket.emit('joinBoard', id);
        });

        // Re-emit join if reconnected
        socket.io.on('reconnect', () => {
            console.log('Socket reconnected');
            socket.emit('joinBoard', id);
        });

        socket.on('listCreated', (data) => addListStore(data));
        socket.on('listUpdated', (data) => updateListStore(data));
        socket.on('listDeleted', (listId) => deleteListStore(listId));
        socket.on('listsReordered', (listIds) => reorderListsInStore(listIds));

        socket.on('taskCreated', (data) => {
            console.log('Task created event received:', data);
            addTaskStore(data);
        });
        socket.on('taskUpdated', (data) => updateTaskStore(data));
        socket.on('taskDeleted', (taskId) => deleteTaskStore(taskId));

        socket.on('taskMoved', (data) => {
            moveTaskInStore(data.taskId, data.newListId, data.newPosition);
        });

        return () => {
            socket.disconnect();
        };
    }, [id, addListStore, updateListStore, deleteListStore, reorderListsInStore, addTaskStore, updateTaskStore, deleteTaskStore, moveTaskInStore]);

    useEffect(() => {
        fetchBoard(id);
    }, [id, fetchBoard]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const listIds = useMemo(() => currentBoard?.lists.map((l) => l._id) || [], [currentBoard]);

    const onDragStart = (event) => {
        if (event.active.data.current?.type === 'List') {
            setActiveId(event.active.id);
            setActiveList(event.active.data.current.list);
            return;
        }

        if (event.active.data.current?.type === 'Task') {
            setActiveId(event.active.id);
            setActiveTask(event.active.data.current.task);
            return;
        }
    };

    const onDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveTask = active.data.current?.type === 'Task';
        const isOverTask = over.data.current?.type === 'Task';
        const isOverList = over.data.current?.type === 'List';

        if (!isActiveTask) return;

        // Moving task over another task
        if (isActiveTask && isOverTask) {
            const activeTask = active.data.current.task;
            const overTask = over.data.current.task;

            if (activeTask.list !== overTask.list) {
                const activeIndex = currentBoard.tasks.findIndex(t => t._id === activeId);
                const overIndex = currentBoard.tasks.findIndex(t => t._id === overId);

                if (activeIndex !== -1 && overIndex !== -1) {
                    const newTasks = [...currentBoard.tasks];
                    newTasks[activeIndex].list = overTask.list;
                    updateTaskStore({ ...newTasks[activeIndex] });
                }
            }
        }

        // Moving task over a list container
        if (isActiveTask && isOverList) {
            const activeTask = active.data.current.task;
            const overListId = overId;

            if (activeTask.list !== overListId) {
                const activeIndex = currentBoard.tasks.findIndex(t => t._id === activeId);
                if (activeIndex !== -1) {
                    const newTasks = [...currentBoard.tasks];
                    newTasks[activeIndex].list = overListId;
                    updateTaskStore({ ...newTasks[activeIndex] });
                }
            }
        }
    };

    const onDragEnd = async (event) => {
        setActiveId(null);
        setActiveList(null);
        setActiveTask(null);

        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveList = active.data.current?.type === 'List';
        const isOverList = over.data.current?.type === 'List';
        const isActiveTask = active.data.current?.type === 'Task';

        // 1. Reordering Lists
        if (isActiveList && isOverList) {
            const oldIndex = listIds.indexOf(activeId);
            const newIndex = listIds.indexOf(overId);

            if (oldIndex !== newIndex) {
                const newListIds = arrayMove(listIds, oldIndex, newIndex);
                reorderListsInStore(newListIds);
                try {
                    await api.put('/lists/reorder', { boardId: id, listIds: newListIds });
                } catch (error) {
                    console.error('Failed to reorder lists', error);
                    fetchBoard(id);
                }
            }
        }

        // 2. Reordering/Moving Tasks
        if (isActiveTask) {
            const taskInStore = currentBoard.tasks.find(t => t._id === activeId);
            if (!taskInStore) return;

            const targetListId = taskInStore.list;

            let newListId = targetListId;
            let newPosition = taskInStore.position;

            if (over.data.current?.type === 'List') {
                newListId = overId;
                const tasksInList = currentBoard.tasks.filter(t => t.list === newListId && t._id !== activeId);
                newPosition = tasksInList.length;
            } else if (over.data.current?.type === 'Task') {
                const overTask = over.data.current.task;
                newListId = overTask.list;
                newPosition = overTask.position;
            }

            moveTaskInStore(activeId, newListId, newPosition);

            try {
                await api.put(`/tasks/${activeId}/move`, {
                    newListId,
                    newPosition
                });
            } catch (error) {
                console.error(error);
                fetchBoard(id);
            }
        }
    };

    const handleCreateList = async (e) => {
        e.preventDefault();
        try {
            await api.post('/lists', { name: newListName, boardId: id });
            setNewListName('');
            setIsListModalOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tasks', {
                title: newTaskTitle,
                description: newTaskDesc,
                listId: selectedListId,
                boardId: id
            });
            setNewTaskTitle('');
            setNewTaskDesc('');
            setIsTaskModalOpen(false);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/boards/${id}/members`, { email: memberEmail });
            setMemberEmail('');
            setIsMemberModalOpen(false);
            fetchBoard(id); // Refresh board data to show new member (if we displayed members)
            alert('Member added successfully!');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.error || 'Failed to add member');
        }
    };

    const handleStatusChange = async (taskId, isCompleted) => {
        updateTaskStore({ _id: taskId, isCompleted });
        try {
            await api.put(`/tasks/${taskId}`, { isCompleted });
        } catch (error) {
            fetchBoard(id);
        }
    }

    const handleDeleteTask = async (taskId) => {
        if (window.confirm('Delete task?')) {
            try {
                await api.delete(`/tasks/${taskId}`);
            } catch (e) { console.error(e) }
        }
    }

    if (isLoading || !currentBoard) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl font-bold text-white shadow-sm">{currentBoard.name}</h1>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    {/* Search Bar */}
                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            className="bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-gray-400 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {isAdmin && (
                        <div className="flex gap-2">
                            <Button onClick={() => setIsMemberModalOpen(true)} variant="secondary">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Add Member
                            </Button>
                            <Button onClick={() => setIsListModalOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add List
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
            >
                <div className="flex gap-6 overflow-x-auto pb-4 h-full items-start">
                    <SortableContext
                        items={listIds}
                        strategy={horizontalListSortingStrategy}
                    >
                        {currentBoard.lists.map((list) => {
                            // Filter tasks for this list based on search query
                            const filteredTasks = currentBoard.tasks
                                .filter(t => t.list === list._id)
                                .filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
                                .sort((a, b) => a.position - b.position);

                            return (
                                <ListColumn
                                    key={list._id}
                                    list={list}
                                    tasks={filteredTasks}
                                    isAdmin={isAdmin}
                                    onAddTask={() => {
                                        setSelectedListId(list._id);
                                        setIsTaskModalOpen(true);
                                    }}
                                    onDeleteList={async (id) => {
                                        if (window.confirm('Delete list?')) {
                                            await api.delete(`/lists/${id}`);
                                        }
                                    }}
                                    onStatusChange={handleStatusChange}
                                    onDeleteTask={handleDeleteTask}
                                />
                            );
                        })}
                    </SortableContext>
                </div>

                <DragOverlay>
                    {activeList ? (
                        <div className="w-80 bg-white/10 backdrop-blur-md rounded-lg p-4 opacity-80 h-[300px] border border-white/20">
                            <div className="font-bold mb-4 text-white">{activeList.name}</div>
                        </div>
                    ) : activeTask ? (
                        <TaskCard task={activeTask} />
                    ) : null}
                </DragOverlay>
            </DndContext>

            {/* Create List Modal */}
            <Modal isOpen={isListModalOpen} onClose={() => setIsListModalOpen(false)} title="Create List">
                <form onSubmit={handleCreateList}>
                    <Input
                        label="List Name"
                        value={newListName}
                        onChange={e => setNewListName(e.target.value)}
                        required autoFocus className="mb-4"
                    />
                    <div className="flex justify-end gap-3 mt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsListModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Create</Button>
                    </div>
                </form>
            </Modal>

            {/* Create Task Modal */}
            <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Create Task">
                <form onSubmit={handleCreateTask}>
                    <Input
                        label="Title"
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        required autoFocus className="mb-4"
                    />
                    <Input
                        label="Description"
                        value={newTaskDesc}
                        onChange={e => setNewTaskDesc(e.target.value)}
                        className="mb-4"
                    />
                    <div className="flex justify-end gap-3 mt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsTaskModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Create</Button>
                    </div>
                </form>
            </Modal>

            {/* Add Member Modal */}
            <Modal isOpen={isMemberModalOpen} onClose={() => setIsMemberModalOpen(false)} title="Add Member to Board">
                <form onSubmit={handleAddMember}>
                    <p className="text-sm text-gray-500 mb-4">
                        Enter the email address of the user you want to add to this board.
                    </p>
                    <Input
                        label="User Email"
                        type="email"
                        value={memberEmail}
                        onChange={e => setMemberEmail(e.target.value)}
                        required autoFocus className="mb-4"
                    />
                    <div className="flex justify-end gap-3 mt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsMemberModalOpen(false)}>Cancel</Button>
                        <Button type="submit">Add Member</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default BoardView;
