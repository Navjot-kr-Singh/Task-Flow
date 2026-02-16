import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import { Plus, GripHorizontal, Trash2 } from 'lucide-react';

const ListColumn = ({ list, tasks, isAdmin, onAddTask, onDeleteList, onStatusChange, onDeleteTask }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: list._id,
        data: {
            type: 'List',
            list,
        },
        disabled: !isAdmin,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    if (isDragging) {
        return (
            <div ref={setNodeRef} style={style} className="w-80 flex-shrink-0 opacity-50 bg-gray-200 rounded-lg h-[500px] border-2 border-dashed border-gray-400">
            </div>
        )
    }

    const taskIds = tasks.map(t => t._id);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="w-80 flex-shrink-0 bg-black/40 backdrop-blur-md rounded-lg flex flex-col max-h-[calc(100vh-140px)] border border-white/10"
        >
            <div className="p-4 flex items-center justify-between border-b border-white/10 group">
                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-white">
                            <GripHorizontal className="h-5 w-5" />
                        </div>
                    )}
                    <h3 className="font-semibold text-white">{list.name}</h3>
                    <span className="text-gray-400 text-sm">({tasks.length})</span>
                </div>
                {isAdmin && (
                    <button onClick={() => onDeleteList(list._id)} className="text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <TaskCard
                            key={task._id}
                            task={task}
                            isAdmin={isAdmin}
                            onStatusChange={onStatusChange}
                            onDelete={onDeleteTask}
                        />
                    ))}
                </SortableContext>
            </div>

            {isAdmin && (
                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={onAddTask}
                        className="flex items-center justify-center w-full py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-md transition-colors border-2 border-dashed border-gray-500 hover:border-gray-400"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Task
                    </button>
                </div>
            )}
        </div>
    );
};

export default ListColumn;
