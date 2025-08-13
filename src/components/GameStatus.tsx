import { Player } from '@/types/game';
import { cn } from '@/lib/utils';
import { Trophy, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GameStatusProps {
  gameStatus: 'playing' | 'won' | 'draw';
  currentPlayer: Player;
  winner?: Player;
  onRestart: () => void;
  playerScores: { [key in Player]: number };
  hasReplayTurn: boolean;
}

export const GameStatus = ({
  gameStatus,
  currentPlayer,
  winner,
  onRestart,
  playerScores,
  hasReplayTurn,
}: GameStatusProps) => {
  if (gameStatus === 'playing') {
    return (
      <div className="text-center space-y-4">
        {/* Scores */}
        <div className="flex justify-center gap-8 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-game-player1">Joueur 1</div>
            <div className="text-3xl font-extrabold">{playerScores[1]}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-game-player2">Joueur 2</div>
            <div className="text-3xl font-extrabold">{playerScores[2]}</div>
          </div>
        </div>
        
        {/* Tour actuel */}
        <div className="flex items-center justify-center gap-2">
          <div
            className={cn(
              "w-4 h-4 rounded-full",
              currentPlayer === 1 ? "bg-game-player1" : "bg-game-player2"
            )}
          />
          <span className="text-lg font-semibold">
            Au tour du Joueur {currentPlayer}
            {hasReplayTurn && " (Tour bonus !)"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Formez une ligne qui totalise 15 ! Les cases spéciales multiplient la valeur des pions.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      {gameStatus === 'won' && winner && (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-2xl font-bold">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <span
              className={cn(
                winner === 1 ? "text-game-player1" : "text-game-player2"
              )}
            >
              Joueur {winner} gagne !
            </span>
          </div>
          <p className="text-muted-foreground">
            Félicitations ! Vous avez formé une ligne totalisant 15.
          </p>
        </div>
      )}

      {gameStatus === 'draw' && (
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-muted-foreground">Match nul !</h2>
          <p className="text-muted-foreground">
            Tous les pions ont été placés sans qu'aucun joueur ne gagne.
          </p>
        </div>
      )}

      <Button
        onClick={onRestart}
        variant="default"
        className="mt-4 bg-gradient-primary hover:shadow-hover transition-all duration-200"
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        Nouvelle partie
      </Button>
    </div>
  );
};