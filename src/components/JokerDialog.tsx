import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface JokerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onValueSelect: (value: number) => void;
}

export const JokerDialog = ({ isOpen, onClose, onValueSelect }: JokerDialogProps) => {
  const [selectedValue, setSelectedValue] = useState<number>(0);

  const handleConfirm = () => {
    onValueSelect(selectedValue);
    onClose();
  };

  const values = Array.from({ length: 16 }, (_, i) => i); // 0 to 15

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choisir la valeur du Joker</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Label>Quelle valeur voulez-vous attribuer à ce joker ?</Label>
          <div className="grid grid-cols-4 gap-2">
            {values.map((value) => (
              <Button
                key={value}
                variant={selectedValue === value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedValue(value)}
                className="aspect-square"
              >
                {value}
              </Button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleConfirm}>
              Confirmer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};