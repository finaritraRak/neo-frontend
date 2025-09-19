import axios from 'axios';
import { BlogPost, Category, BlogStats } from '../types/blog';

const API_BASE_URL = '/api/blog';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Désactiver l'authentification pour allowAny
api.interceptors.request.use((config) => {
  // Vous pouvez ajouter ici des headers si nécessaire
  return config;
});

export const blogService = {
  // Posts
  getPosts: () => api.get<BlogPost[]>('/posts/'),
  getPost: (id: number) => api.get<BlogPost>(`/posts/${id}/`),
  createPost: (data: Partial<BlogPost>) => api.post<BlogPost>('/posts/', data),
  updatePost: (id: number, data: Partial<BlogPost>) => api.put<BlogPost>(`/posts/${id}/`, data),
  deletePost: (id: number) => api.delete(`/posts/${id}/`),
  
  // Categories
  getCategories: () => api.get<Category[]>('/categories/'),
  createCategory: ( Partial<Category>) => api.post<Category>('/categories/', data),
  
  // Stats
  getStats: () => api.get<BlogStats>('/stats/'),
};