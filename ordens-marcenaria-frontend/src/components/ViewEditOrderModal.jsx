import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx'
import { Calendar, User, Package, Edit, Eye, Plus, X, Save, Trash2 } from 'lucide-react'

export function ViewEditOrderModal({ isOpen, onClose, order, onUpdateOrder, carpenters, isEditMode, onToggleEditMode }) {
    const [formData, setFormData] = useState({
        id: '',
        description: '',
        entryDate: '',
        exitDate: '',
        carpenter: '',
        status: '',
        materials: []
    })
    const [newMaterial, setNewMaterial] = useState({ description: '', quantity: 1 })

    const statusOptions = [
        { value: 'atrasada', label: 'Atrasada' },
        { value: 'paraHoje', label: 'Para Hoje' },
        { value: 'emProcesso', label: 'Em Processo' },
        { value: 'recebida', label: 'Recebida' },
        { value: 'concluida', label: 'Concluída' }
    ]

    // Carregar dados da ordem quando o modal abrir
    useEffect(() => {
        if (order) {
            setFormData({
                id: order.id || '',
                description: order.description || '',
                entryDate: order.entryDate || '',
                exitDate: order.exitDate || '',
                carpenter: order.carpenter || '',
                status: order.status || '',
                materials: order.materials || []
            })
        }
    }, [order])

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isEditMode) return;

        try {
            // Garantir que materiais tenham estrutura correta
            const materialsWithIds = formData.materials.map((material, index) => ({
                id: material.id || `temp_${index}`,
                description: material.description || '',
                quantity: material.quantity || 1
            }));

            const updatedOrder = {
                ...formData,
                materials: materialsWithIds
            };

            await onUpdateOrder(updatedOrder);
            onClose();
            // NÃO resetar isEditMode aqui - será feito no App.jsx

        } catch (error) {
            console.error('Erro ao salvar ordem:', error);
            // Manter em modo edição se houver erro
        }
    };

    // ADICIONAR função para cancelar edição
    const handleCancelEdit = () => {
        // Restaurar dados originais
        if (order) {
            setFormData({
                id: order.id || '',
                description: order.description || '',
                entryDate: order.entryDate || '',
                exitDate: order.exitDate || '',
                status: order.status || 'recebida',
                carpenter: order.carpenter || '',
                materials: order.materials || []
            });
        }
        onToggleEditMode(); // Voltar ao modo visualização
    };

    const addMaterial = () => {
        const newMaterial = {
            id: `temp_${Date.now()}`, // CORREÇÃO: Gerar ID único temporário
            description: '',
            quantity: 1
        };
        setFormData(prev => ({
            ...prev,
            materials: [...prev.materials, newMaterial]
        }));
    };

    const removeMaterial = (index) => {
        setFormData(prev => ({
            ...prev,
            materials: prev.materials.filter((_, i) => i !== index)
        }));
    };

    const updateMaterial = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            materials: prev.materials.map((material, i) =>
                i === index
                    ? { ...material, [field]: value }
                    : material
            )
        }));
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        if (dateString.includes('/')) return dateString;
        if (dateString.includes('-')) {
            const parts = dateString.split('T')[0].split('-');
            if (parts.length === 3) {
                const [year, month, day] = parts;
                return `${day}/${month}/${year}`;
            }
        }
        try {
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('pt-BR');
            }
        } catch (e) {
            console.warn('Erro ao formatar data:', dateString);
        }
        return dateString;
    }

    if (!order) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isEditMode ? <Edit size={20} /> : <Eye size={20} />}
                        {isEditMode ? 'Editar' : 'Visualizar'} Ordem #{order.id}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Informações Básicas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Nº da Ordem</label>
                            {isEditMode ? (
                                <Input
                                    type="text"
                                    value={formData.id}
                                    onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                                    disabled={true}
                                    className="bg-gray-100"
                                    placeholder="Ex: OS-123"
                                />
                            ) : (
                                <div className="p-2 bg-gray-50 rounded border">{formData.id}</div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Status</label>
                            {isEditMode ? (
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusOptions.map(option => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="p-2 bg-gray-50 rounded border">
                                    {statusOptions.find(s => s.value === formData.status)?.label || formData.status}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Descrição do Serviço</label>
                        {isEditMode ? (
                            <Textarea
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Descreva o serviço a ser realizado..."
                                rows={4}
                            />
                        ) : (
                            <div className="p-3 bg-gray-50 rounded border min-h-[100px] whitespace-pre-wrap">
                                {formData.description}
                            </div>
                        )}
                    </div>

                    {/* Datas e Marceneiro */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Data de Entrada</label>
                            {isEditMode ? (
                                <Input
                                    type="date"
                                    value={formData.entryDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, entryDate: e.target.value }))}
                                />
                            ) : (
                                <div className="p-2 bg-gray-50 rounded border">{formatDate(formData.entryDate)}</div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Data de Saída</label>
                            {isEditMode ? (
                                <Input
                                    type="date"
                                    value={formData.exitDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, exitDate: e.target.value }))}
                                />
                            ) : (
                                <div className="p-2 bg-gray-50 rounded border">{formatDate(formData.exitDate)}</div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Encarregado</label>
                            {isEditMode ? (
                                <Select
                                    value={formData.carpenter || ''}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, carpenter: value === 'none' ? '' : value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="(Nenhum)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">(Nenhum)</SelectItem>
                                        {carpenters.map(carpenter => (
                                            <SelectItem key={carpenter} value={carpenter}>{carpenter}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="p-2 bg-gray-50 rounded border">{formData.carpenter || '(Nenhum)'}</div>
                            )}
                        </div>
                    </div>

                    {/* Materiais */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Materiais</label>

                        {/* Lista de materiais */}
                        {formData.materials && formData.materials.length > 0 ? (
                            <div className="space-y-2 mb-4">
                                {formData.materials.map((material, index) => (
                                    <div key={material.id || index} className="flex items-center justify-between bg-gray-50 p-3 rounded border">
                                        <span>{material.description} (Qtd: {material.quantity})</span>
                                        {isEditMode && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeMaterial(material.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <X size={16} />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-3 bg-gray-50 rounded border text-gray-500 text-center mb-4">
                                Nenhum material cadastrado
                            </div>
                        )}

                        {/* Adicionar novo material (apenas no modo edição) */}
                        {isEditMode && (
                            <div>
                                <h4 className="font-medium mb-2">Adicionar Novo Material</h4>
                                <div className="flex gap-2">
                                    <Input
                                        type="text"
                                        placeholder="Descrição do material"
                                        value={newMaterial.description}
                                        onChange={(e) => setNewMaterial(prev => ({ ...prev, description: e.target.value }))}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        min="1"
                                        value={newMaterial.quantity}
                                        onChange={(e) => setNewMaterial(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                        className="w-20"
                                    />
                                    <Button type="button" onClick={addMaterial} className="bg-blue-500 hover:bg-blue-600">
                                        <Plus size={16} />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex justify-between">
                        <div className="flex gap-2">
                            {!isEditMode ? (
                                <>
                                    <Button onClick={onToggleEditMode} className="bg-blue-500 hover:bg-blue-600">
                                        <Edit size={16} className="mr-2" />
                                        Editar
                                    </Button>
                                    <Button variant="outline" onClick={onClose}>
                                        Fechar
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button type="submit" form="edit-order-form" className="bg-green-500 hover:bg-green-600">
                                        <Save size={16} className="mr-2" />
                                        Salvar
                                    </Button>
                                    <Button variant="outline" onClick={handleCancelEdit}>
                                        <X size={16} className="mr-2" />
                                        Cancelar
                                    </Button>
                                </>
                            )}
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}