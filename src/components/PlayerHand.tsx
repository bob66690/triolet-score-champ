import { useState } from 'react';
import { Player } from '@/types/game';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface PlayerHandProps {
  hand: (number | 'X')[];
  player: Player;
  isCurrentPlayer: boolean;
  onPionSelect: (pionIndex: number) => void;
  onExchange: (indices: number[]) => void;
  onPass: () => void;
  selectedPionIndex: number | null;
  pionBag: { [key: string]: number };
}

export const PlayerHand = ({
  hand,
  player,
  isCurrentPlayer,
  onPionSelect,
  onExchange,
  onPass,
  selectedPionIndex,
  pionBag,
}: PlayerHandProps) => {
  const [exchangeMode, setExchangeMode] = useState(false);
  const [selectedForExchange, setSelectedForExchange] = useState<number[]>([]);

  const handlePionClick = (pion: number | 'X', index: number) => {
    if (!isCurrentPlayer) return;
    
    if (exchangeMode) {
      setSelectedForExchange(prev => 
        prev.includes(index) 
          ? prev.filter(i => i !== index)
          : [...prev, index]
      );
    } else {
      onPionSelect(index);
    }
  };

  const handleExchange = () => {
    if (selectedForExchange.length > 0) {
      onExchange(selectedForExchange);
      setSelectedForExchange([]);
      setExchangeMode(false);
    }
  };

  const getPionInitialCount = (pion: number | 'X'): number => {
    const initialCounts: { [key: string]: number } = {
      '0': 9, '1': 9, '2': 8, '3': 8, '4': 7, '5': 8, '6': 6, '7': 6,
      '8': 4, '9': 4, '10': 3, '11': 3, '12': 2, '13': 2, '14': 1, '15': 1, 'X': 2
    };
    return initialCounts[pion.toString()] || 0;
  };

  return (
    <Card className={cn(
      "p-4 transition-all duration-300",
      isCurrentPlayer ? "ring-2 ring-primary shadow-lg" : "opacity-70"
    )}>
      <div className="space-y-4">
        <div className="text-center">
          <h3 className={cn(
            "text-lg font-semibold",
            player === 1 ? "text-game-player1" : "text-game-player2"
          )}>
            Joueur {player}
            {isCurrentPlayer && " (À votre tour)"}
          </h3>
        </div>

        {/* Player's pions */}
        <div className="flex gap-2 justify-center">
          {hand.map((pion, index) => (
            <Button
              key={index}
              variant={
                exchangeMode 
                  ? (selectedForExchange.includes(index) ? "default" : "outline")
                  : (selectedPionIndex === index ? "default" : "outline")
              }
              disabled={!isCurrentPlayer}
              onClick={() => handlePionClick(pion, index)}
              className={cn(
                "w-16 h-16 text-xl font-bold rounded-xl relative",
                "transition-all duration-200",
                isCurrentPlayer && "hover:scale-110 hover:shadow-hover",
                selectedPionIndex === index && !exchangeMode && player === 1 && "bg-game-player1 text-white",
                selectedPionIndex === index && !exchangeMode && player === 2 && "bg-game-player2 text-white",
              )}
            >
              {pion}
              {/* Initial pion count in bottom right corner */}
              <span className="absolute bottom-0 right-0 text-xs bg-background text-foreground rounded-tl px-1 leading-none">
                {getPionInitialCount(pion)}
              </span>
            </Button>
          ))}
        </div>

        {/* Action buttons */}
        {isCurrentPlayer && (
          <div className="flex gap-2 justify-center">
            {!exchangeMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExchangeMode(true)}
                >
                  Échanger
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPass}
                >
                  Passer
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleExchange}
                  disabled={selectedForExchange.length === 0}
                >
                  Confirmer échange
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setExchangeMode(false);
                    setSelectedForExchange([]);
                  }}
                >
                  Annuler
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};