import { useState } from 'react';
import { Player } from '@/types/game';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PionSelectorProps {
  availablePions: { [key: number]: boolean };
  currentPlayer: Player;
  onPionSelect: (pion: number) => void;
  selectedPion: number | null;
}

export const PionSelector = ({
  availablePions,
  currentPlayer,
  onPionSelect,
  selectedPion,
}: PionSelectorProps) => {
  const [hoveredPion, setHoveredPion] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Pions disponibles
        </h3>
        <p className="text-sm text-muted-foreground">
          Joueur {currentPlayer} - Sélectionnez un pion
        </p>
      </div>
      
      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((pion) => (
          <Button
            key={pion}
            variant={selectedPion === pion ? "default" : "outline"}
            disabled={!availablePions[pion]}
            onClick={() => onPionSelect(pion)}
            onMouseEnter={() => setHoveredPion(pion)}
            onMouseLeave={() => setHoveredPion(null)}
            className={cn(
              "w-16 h-16 text-xl font-bold rounded-xl",
              "transition-all duration-200",
              availablePions[pion] && "hover:scale-110 hover:shadow-hover",
              selectedPion === pion && currentPlayer === 1 && "bg-game-player1 text-white",
              selectedPion === pion && currentPlayer === 2 && "bg-game-player2 text-white",
              !availablePions[pion] && "opacity-30 cursor-not-allowed",
              hoveredPion === pion && availablePions[pion] && "shadow-lg"
            )}
          >
            {pion}
          </Button>
        ))}
      </div>
    </div>
  );
};