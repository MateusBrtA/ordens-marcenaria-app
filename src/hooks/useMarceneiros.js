import { useState, useEffect } from 'react';
import api from '../services/api';

export const useMarceneiros = (filters = {}) => {
  const [marceneiros, setMarceneiros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMarceneiros = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const response = await api.get(`/api/marceneiros?${params.toString()}`);
      setMarceneiros(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar marceneiros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarceneiros();
  }, [JSON.stringify(filters)]);

  const createMarceneiro = async (marceneiroData) => {
    try {
      const response = await api.post('/api/marceneiros', marceneiroData);
      fetchMarceneiros();
      return { success: true, marceneiro: response.data.marceneiro };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Erro ao criar marceneiro' 
      };
    }
  };

  const updateMarceneiro = async (id, marceneiroData) => {
    try {
      const response = await api.put(`/api/marceneiros/${id}`, marceneiroData);
      fetchMarceneiros();
      return { success: true, marceneiro: response.data.marceneiro };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Erro ao atualizar marceneiro' 
      };
    }
  };

  const deleteMarceneiro = async (id) => {
    try {
      await api.delete(`/api/marceneiros/${id}`);
      fetchMarceneiros();
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Erro ao deletar marceneiro' 
      };
    }
  };

  return {
    marceneiros,
    loading,
    error,
    refetch: fetchMarceneiros,
    createMarceneiro,
    updateMarceneiro,
    deleteMarceneiro,
  };
};