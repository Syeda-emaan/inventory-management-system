import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export const useCategories = () =>
  useQuery({
    queryKey: ['categories', 'all'],
    queryFn: async () => (await api.get('/categories', { params: { limit: 100 } })).data.data,
  });

export const useSuppliers = () =>
  useQuery({
    queryKey: ['suppliers', 'all'],
    queryFn: async () => (await api.get('/suppliers', { params: { limit: 100 } })).data.data,
  });