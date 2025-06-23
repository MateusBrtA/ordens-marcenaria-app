
import { useState, useEffect } from 'react';
import api from '../services/api';

export const useHistorico = (filters = {}) => {
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistorico = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const response = await api.get(`/api/historico?${params.toString()}`);
      setHistorico(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorico();
  }, [JSON.stringify(filters)]);

  return {
    historico,
    loading,
    error,
    refetch: fetchHistorico,
  };
};


