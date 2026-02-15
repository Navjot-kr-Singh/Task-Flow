import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useBoardStore from '../store/boardStore';
import useAuthStore from '../store/authStore';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Plus, Trash2 } from 'lucide-react';
import api from '../api/axios';

const Dashboard = () => {
    const { boards, fetchBoards, isLoading, createBoard } = useBoardStore();
    const { user } = useAuthStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newBoardName, setNewBoardName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchBoards();
    }, [fetchBoards]);

    const handleCreateBoard = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            await createBoard({ name: newBoardName });
            setNewBoardName('');
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteBoard = async (e, boardId) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this board?')) {
            try {
                await api.delete(`/boards/${boardId}`);
                fetchBoards();
            } catch (error) {
                console.error(error);
            }
        }
    }

    const isAdmin = user?.role === 'admin';

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Your Boards</h1>
                {isAdmin && (
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Board
                    </Button>
                )}
            </div>

            {isLoading && boards.length === 0 ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {boards.map((board) => (
                        <Link
                            key={board._id}
                            to={`/board/${board._id}`}
                            className="block p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative group"
                        >
                            <h3 className="text-lg font-medium text-gray-900 mb-2 truncate">{board.name}</h3>
                            <p className="text-sm text-gray-500">
                                Created by {board.owner === user.id ? 'You' : 'Admin'}
                            </p>
                            {isAdmin && board.owner === user.id && (
                                <button
                                    onClick={(e) => handleDeleteBoard(e, board._id)}
                                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </Link>
                    ))}

                    {boards.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No boards</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {isAdmin ? 'Get started by creating a new board.' : 'Wait for an admin to add you to a board.'}
                            </p>
                            {isAdmin && (
                                <div className="mt-6">
                                    <Button onClick={() => setIsModalOpen(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        New Board
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New Board"
            >
                <form onSubmit={handleCreateBoard}>
                    <Input
                        label="Board Name"
                        value={newBoardName}
                        onChange={(e) => setNewBoardName(e.target.value)}
                        required
                        autoFocus
                        className="mb-4"
                    />
                    <div className="flex justify-end gap-3 mt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isCreating}>
                            Create Board
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Dashboard;
