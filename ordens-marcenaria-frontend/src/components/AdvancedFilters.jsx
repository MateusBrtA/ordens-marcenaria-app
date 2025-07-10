import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Filter, X, Calendar, SortAsc, SortDesc } from 'lucide-react';

export function AdvancedFilters({ onFiltersChange, currentFilters = {} }) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    entryDateFrom: '',
    entryDateTo: '',
    exitDateFrom: '',
    exitDateTo: '',
    idSearch: '',
    sortBy: 'id',
    sortOrder: 'asc',
    ...currentFilters
  });

  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Verificar se há filtros ativos
  useEffect(() => {
    const active = filters.entryDateFrom || filters.entryDateTo || 
                  filters.exitDateFrom || filters.exitDateTo || 
                  filters.idSearch || 
                  filters.sortBy !== 'id' || filters.sortOrder !== 'asc';
    setHasActiveFilters(active);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
    setIsOpen(false);
  };

  const clearFilters = () => {
    const clearedFilters = {
      entryDateFrom: '',
      entryDateTo: '',
      exitDateFrom: '',
      exitDateTo: '',
      idSearch: '',
      sortBy: 'id',
      sortOrder: 'asc'
    };
    setFilters(clearedFilters);
    if (onFiltersChange) {
      onFiltersChange(clearedFilters);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    // Se já está no formato yyyy-mm-dd, retorna como está
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString;
    // Se está no formato dd/mm/yyyy, converte para yyyy-mm-dd
    if (dateString.includes('/')) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateString;
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    // Se está no formato yyyy-mm-dd, converte para dd/mm/yyyy
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    return dateString;
  };

  const sortOptions = [
    { value: 'id', label: 'ID da Ordem' },
    { value: 'entryDate', label: 'Data de Entrada' },
    { value: 'exitDate', label: 'Data de Saída' },
    { value: 'status', label: 'Status' },
    { value: 'carpenter', label: 'Marceneiro' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className={`flex items-center gap-2 ${hasActiveFilters ? 'border-blue-500 text-blue-600 bg-blue-50' : ''}`}
        >
          <Filter size={16} />
          Filtros Avançados
          {hasActiveFilters && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 ml-1">
              Ativo
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter size={20} />
            Filtros Avançados
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Filtro por ID */}
          <div className="space-y-2">
            <Label htmlFor="idSearch" className="flex items-center gap-2">
              <span>Buscar por ID da Ordem</span>
            </Label>
            <Input
              id="idSearch"
              value={filters.idSearch}
              onChange={(e) => handleFilterChange('idSearch', e.target.value)}
              placeholder="Digite o ID da ordem..."
              className="w-full"
            />
          </div>

          {/* Filtros de Data de Entrada */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar size={16} />
              Data de Entrada
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="entryDateFrom" className="text-xs text-gray-600">
                  De:
                </Label>
                <Input
                  id="entryDateFrom"
                  type="date"
                  value={formatDateForInput(filters.entryDateFrom)}
                  onChange={(e) => handleFilterChange('entryDateFrom', e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="entryDateTo" className="text-xs text-gray-600">
                  Até:
                </Label>
                <Input
                  id="entryDateTo"
                  type="date"
                  value={formatDateForInput(filters.entryDateTo)}
                  onChange={(e) => handleFilterChange('entryDateTo', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Filtros de Data de Saída */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar size={16} />
              Data de Saída
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="exitDateFrom" className="text-xs text-gray-600">
                  De:
                </Label>
                <Input
                  id="exitDateFrom"
                  type="date"
                  value={formatDateForInput(filters.exitDateFrom)}
                  onChange={(e) => handleFilterChange('exitDateFrom', e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="exitDateTo" className="text-xs text-gray-600">
                  Até:
                </Label>
                <Input
                  id="exitDateTo"
                  type="date"
                  value={formatDateForInput(filters.exitDateTo)}
                  onChange={(e) => handleFilterChange('exitDateTo', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Ordenação */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              {filters.sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
              Ordenação
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="sortBy" className="text-xs text-gray-600">
                  Ordenar por:
                </Label>
                <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="sortOrder" className="text-xs text-gray-600">
                  Ordem:
                </Label>
                <Select value={filters.sortOrder} onValueChange={(value) => handleFilterChange('sortOrder', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Crescente</SelectItem>
                    <SelectItem value="desc">Decrescente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Resumo dos filtros ativos */}
          {hasActiveFilters && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Filtros Ativos:</h4>
              <div className="space-y-1 text-xs text-blue-700">
                {filters.idSearch && <div>• ID: {filters.idSearch}</div>}
                {filters.entryDateFrom && <div>• Entrada de: {formatDateForDisplay(filters.entryDateFrom)}</div>}
                {filters.entryDateTo && <div>• Entrada até: {formatDateForDisplay(filters.entryDateTo)}</div>}
                {filters.exitDateFrom && <div>• Saída de: {formatDateForDisplay(filters.exitDateFrom)}</div>}
                {filters.exitDateTo && <div>• Saída até: {formatDateForDisplay(filters.exitDateTo)}</div>}
                {(filters.sortBy !== 'id' || filters.sortOrder !== 'asc') && (
                  <div>• Ordenação: {sortOptions.find(o => o.value === filters.sortBy)?.label} ({filters.sortOrder === 'asc' ? 'Crescente' : 'Decrescente'})</div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X size={16} />
              Limpar Filtros
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={applyFilters}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Aplicar Filtros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

