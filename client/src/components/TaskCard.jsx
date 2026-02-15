import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CheckCircle, Circle, Trash2, GripVertical } from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';

const TaskCard = ({ task, isAdmin, onDelete, onStatusChange }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: task._id,
        data: {
            type: 'Task',
            task,
        },
        disabled: !isAdmin, // Only admin can drag? Requirement says "Assign users to tasks", "Move tasks". 
        // Requirement says: "User ... Cannot delete tasks". "User ... Can update task status".
        // Does User can drag? "Drag and drop tasks between lists" is a Core Feature. 
        // Usually only Admin can move tasks if User "Cannot create or delete lists". 
        // But typically users can move tasks. 
        // Admin Role: "Can move tasks across lists". User Role: "Can update task status". 
        // Implies User CANNOT move tasks. strict logic: disabled={!isAdmin}
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-gray-100 p-4 rounded-lg shadow-inner h-[100px] border-2 border-dashed border-gray-300 opacity-50"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group relative"
        >
            {/* Drag Handle - Only for Admin */}
            {isAdmin && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute top-2 right-2 cursor-grab p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"
                >
                    <GripVertical className="h-4 w-4" />
                </div>
            )}

            <div className="flex items-start gap-3 pr-6">
                <button
                    onClick={() => onStatusChange(task._id, !task.isCompleted)}
                    className={clsx(
                        "mt-0.5 flex-shrink-0 transition-colors",
                        task.isCompleted ? "text-green-500" : "text-gray-300 hover:text-gray-400"
                    )}
                >
                    {task.isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                    ) : (
                        <Circle className="h-5 w-5" />
                    )}
                </button>
                <div className="flex-1 min-w-0">
                    <h4 className={clsx("text-sm font-medium text-gray-900 truncate", task.isCompleted && "line-through text-gray-500")}>
                        {task.title}
                    </h4>
                    {task.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>}

                    <div className="flex items-center justify-between mt-3">
                        <div className="flex -space-x-2 overflow-hidden">
                            {task.assignedUsers?.map((u) => (
                                <div key={u._id} className="inline-block h-6 w-6 rounded-full ring-2 ring-white bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-800" title={u.name}>
                                    {u.name.charAt(0)}
                                </div>
                            ))}
                        </div>

                        {task.isCompleted && task.completedBy && (
                            <span className="text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium ml-auto border border-green-100">
                                Done by {task.completedBy.name?.split(' ')[0]}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {isAdmin && (
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent drag start if clicked on delete
                        onDelete(task._id);
                    }}
                    className="absolute bottom-2 right-2 p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            )}
        </div>
    );
};

export default TaskCard;
