import AddTodo from './components/AddTodo';
import TodoList from './components/TodoList';

export default function App() {
  return (
    <div className='min-h-screen bg-slate-50 py-12 px-4'>
      <div className='mx-auto w-full max-w-lg'>
        <header className='mb-8 text-center'>
          <h1 className='text-2xl font-semibold text-slate-900'>Todo</h1>
          <p className='mt-1 text-sm text-slate-500'>Stay on top of what matters today.</p>
        </header>

        <div className='mb-6'>
          <AddTodo />
        </div>

        <TodoList />
      </div>
    </div>
  );
}
