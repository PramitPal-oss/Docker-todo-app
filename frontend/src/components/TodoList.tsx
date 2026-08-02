import { useTodos } from '../hooks/useTodos';
import TodoItem from './TodoItem';

export default function TodoList() {
  const { data: todos, isLoading, isError, error } = useTodos();

  if (isLoading) {
    return <p className='py-8 text-center text-sm text-slate-400'>Loading todos…</p>;
  }

  if (isError) {
    return (
      <p className='rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600'>
        Failed to load todos: {error instanceof Error ? error.message : 'Unknown error'}
      </p>
    );
  }

  if (!todos || todos.length === 0) {
    return <p className='py-8 text-center text-sm text-slate-400'>No todos yet. Add one above to get started.</p>;
  }

  return (
    <ul className='flex flex-col gap-2 font-sans'>
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}
