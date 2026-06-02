import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../lib/apiClient';
import { useAuthStore } from '../../../store/authStore';
import type { LoginRequest, LoginResponse } from '../../../types';

export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const mutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials);
      return data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      navigate('/dashboard');
    },
  });

  return {
    login: mutation.mutate,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
