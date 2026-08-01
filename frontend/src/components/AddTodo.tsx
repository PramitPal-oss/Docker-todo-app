import { FormEvent, useState } from 'react';
import { useCreateTodo } from '../hooks/useTodos';

export default function AddTodo() {
  const [title, setTitle] = useState('');
  const createTodo = useCreateTodo();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    createTodo.mutate(trimmed, {
      onSuccess: () => setTitle(''),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        disabled={createTodo.isPending}
      />
      <button
        type="submit"
        disabled={createTodo.isPending || !title.trim()}
        className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
      >
        {createTodo.isPending ? 'Adding…' : 'Add'}
      </button>
    </form>
  );
}
