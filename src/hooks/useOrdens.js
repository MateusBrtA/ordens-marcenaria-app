
import { useState, useEffect } from 'react';
import api from '../services/api';

export const useOrdens = (filters = {}) => {
  const [ordens, setOrdens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrdens = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const response = await api.get(`/api/ordens?${params.toString()}`);
      setOrdens(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar ordens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdens();
  }, [JSON.stringify(filters)]);

  const createOrdem = async (ordemData) => {
    try {
      const response = await api.post('/api/ordens', ordemData);
      fetchOrdens(); // Recarrega a lista após a criação
      return { success: true, ordem: response.data.ordem };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Erro ao criar ordem' 
      };
    }
  };

  const updateOrdem = async (id, ordemData) => {
    try {
      const response = await api.put(`/api/ordens/${id}`, ordemData);
      fetchOrdens(); // Recarrega a lista após a atualização
      return { success: true, ordem: response.data.ordem };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Erro ao atualizar ordem' 
      };
    }
  };

  const deleteOrdem = async (id) => {
    try {
      await api.delete(`/api/ordens/${id}`);
      fetchOrdens(); // Recarrega a lista após a exclusão
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Erro ao deletar ordem' 
      };
    }
  };

  return {
    ordens,
    loading,
    error,
    refetch: fetchOrdens,
    createOrdem,
    updateOrdem,
    deleteOrdem,
  };
};


