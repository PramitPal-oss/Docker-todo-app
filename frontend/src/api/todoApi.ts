import axiosInstance from './axios';
import { ApiResponse, Todo } from '../types/todo';

export const fetchTodos = async (): Promise<Todo[]> => {
  const { data } = await axiosInstance.get<ApiResponse<Todo[]>>('/todos');
  return data.data;
};

export const createTodo = async (title: string): Promise<Todo> => {
  const { data } = await axiosInstance.post<ApiResponse<Todo>>('/todos', { title });
  return data.data;
};

export const updateTodo = async (
  id: number,
  updates: Partial<Pick<Todo, 'title' | 'completed'>>
): Promise<Todo> => {
  const { data } = await axiosInstance.put<ApiResponse<Todo>>(`/todos/${id}`, updates);
  return data.data;
};

export const deleteTodo = async (id: number): Promise<Todo> => {
  const { data } = await axiosInstance.delete<ApiResponse<Todo>>(`/todos/${id}`);
  return data.data;
};
