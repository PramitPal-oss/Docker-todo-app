import { useState } from 'react';
import { Todo } from '../types/todo';
import { useDeleteTodo, useUpdateTodo } from '../hooks/useTodos';

interface TodoItemProps {
  todo: Todo;
}

export default function TodoItem({ todo }: TodoItemProps) {
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(todo.title);

  const toggleCompleted = () => {
    updateTodo.mutate({ id: todo.id, updates: { completed: !todo.completed } });
  };

  const saveEdit = () => {
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== todo.title) {
      updateTodo.mutate({ id: todo.id, updates: { title: trimmed } });
    } else {
      setDraftTitle(todo.title);
    }
    setIsEditing(false);
  };

  return (
    <li className='group flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:shadow-md'>
      <input
        type='checkbox'
        checked={todo.completed}
        onChange={toggleCompleted}
        className='h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-500'
      />

      {isEditing ? (
        <input
          type='text'
          value={draftTitle}
          autoFocus
          onChange={(e) => setDraftTitle(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveEdit();
            if (e.key === 'Escape') {
              setDraftTitle(todo.title);
              setIsEditing(false);
            }
          }}
          className='flex-1 rounded border border-indigo-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
        />
      ) : (
        <span
          onDoubleClick={() => setIsEditing(true)}
          className={`flex-1 cursor-text select-none text-sm font-mono ${
            todo.completed ? 'text-slate-400 line-through' : 'text-slate-800'
          }`}
        >
          {todo.title}
        </span>
      )}

      <button
        onClick={() => deleteTodo.mutate(todo.id)}
        disabled={deleteTodo.isPending}
        className='shrink-0 rounded-md px-2 py-1 text-xs font-medium text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:opacity-50'
        aria-label={`Delete ${todo.title}`}
      >
        Delete
      </button>
    </li>
  );
}
