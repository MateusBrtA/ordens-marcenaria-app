import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { LayoutGrid } from 'lucide-react';

export function CardSizeSlider({ onSizeChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [cardSize, setCardSize] = useState(3); // Tamanho padrão (médio)

  // Configurações de tamanho dos cards
  const sizeConfigs = {
    1: { name: 'Compacto', cols: 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6' },
    2: { name: 'Pequeno', cols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5' },
    3: { name: 'Médio', cols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' },
    4: { name: 'Grande', cols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' },
    5: { name: 'Extra Grande', cols: 'grid-cols-1 sm:grid-cols-1 lg:grid-cols-2' }
  };

  // Carregar tamanho salvo do localStorage
  useEffect(() => {
    const savedSize = localStorage.getItem('cardSize');
    if (savedSize) {
      const size = parseInt(savedSize);
      setCardSize(size);
      if (onSizeChange) {
        onSizeChange(sizeConfigs[size].cols);
      }
    } else {
      // Aplicar tamanho padrão
      if (onSizeChange) {
        onSizeChange(sizeConfigs[3].cols);
      }
    }
  }, [onSizeChange]);

  const handleSizeChange = (newSize) => {
    setCardSize(newSize);
    localStorage.setItem('cardSize', newSize.toString());
    if (onSizeChange) {
      onSizeChange(sizeConfigs[newSize].cols);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <LayoutGrid size={16} />
          Tamanho dos Cards
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajustar Tamanho dos Cards</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <Label>Selecione o tamanho dos cards:</Label>
            
            {/* Slider visual */}
            <div className="space-y-3">
              <input
                type="range"
                min="1"
                max="5"
                value={cardSize}
                onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              
              {/* Labels do slider */}
              <div className="flex justify-between text-xs text-gray-500">
                <span>Compacto</span>
                <span>Pequeno</span>
                <span>Médio</span>
                <span>Grande</span>
                <span>Extra Grande</span>
              </div>
            </div>

            {/* Indicador do tamanho atual */}
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                {sizeConfigs[cardSize].name}
              </div>
              <div className="text-sm text-gray-500">
                Tamanho atual dos cards
              </div>
            </div>

            {/* Preview visual */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="text-sm text-gray-600 mb-2">Preview:</div>
              <div className={`grid gap-2 ${sizeConfigs[cardSize].cols}`}>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white border rounded p-2 text-xs text-center"
                    style={{ minHeight: '40px' }}
                  >
                    Card {i}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setIsOpen(false)}>Aplicar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// CSS adicional para o slider (adicionar ao App.css)
export const sliderCSS = `
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.slider::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
`;

