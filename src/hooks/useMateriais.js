import { useState, useEffect } from 'react';
import api from '../services/api';

export const useMateriais = (filters = {}) => {
  const [materiais, setMateriais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMateriais = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const response = await api.get(`/api/materiais?${params.toString()}`);
      setMateriais(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao carregar materiais');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMateriais();
  }, [JSON.stringify(filters)]);

  const createMaterial = async (materialData) => {
    try {
      const response = await api.post('/api/materiais', materialData);
      fetchMateriais();
      return { success: true, material: response.data.material };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Erro ao criar material' 
      };
    }
  };

  const updateMaterial = async (id, materialData) => {
    try {
      const response = await api.put(`/api/materiais/${id}`, materialData);
      fetchMateriais();
      return { success: true, material: response.data.material };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Erro ao atualizar material' 
      };
    }
  };

  const deleteMaterial = async (id) => {
    try {
      await api.delete(`/api/materiais/${id}`);
      fetchMateriais();
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Erro ao deletar material' 
      };
    }
  };

  const updateEstoque = async (id, quantidade, operacao) => {
    try {
      const response = await api.put(`/api/materiais/${id}/estoque`, { quantidade, operacao });
      fetchMateriais();
      return { success: true, material: response.data.material };
    } catch (err) {
      return { 
        success: false, 
        message: err.response?.data?.message || 'Erro ao atualizar estoque' 
      };
    }
  };

  return {
    materiais,
    loading,
    error,
    refetch: fetchMateriais,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    updateEstoque,
  };
};