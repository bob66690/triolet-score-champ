import { useState } from 'react';
import { useTrioletGame } from '@/hooks/useTrioletGame';
import { GameBoard } from '@/components/GameBoard';
import { PionSelector } from '@/components/PionSelector';
import { GameStatus } from '@/components/GameStatus';
import { Position } from '@/types/game';
import { Card } from '@/components/ui/card';

export const TrioletGame = () => {
  const { gameState, placePion, resetGame } = useTrioletGame();
  const [selectedPion, setSelectedPion] = useState<number | null>(null);

  const handleCellClick = (position: Position) => {
    if (selectedPion && gameState.gameStatus === 'playing') {
      const success = placePion(position, selectedPion);
      if (success) {
        setSelectedPion(null);
      }
    }
  };

  const handlePionSelect = (pion: number) => {
    setSelectedPion(selectedPion === pion ? null : pion);
  };

  const handleRestart = () => {
    resetGame();
    setSelectedPion(null);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Triolet
          </h1>
          <p className="text-muted-foreground">
            Formez une ligne de 3 pions qui totalise exactement 15 points
          </p>
        </div>

        {/* Game Status */}
        <Card className="p-6">
          <GameStatus
            gameStatus={gameState.gameStatus}
            currentPlayer={gameState.currentPlayer}
            winner={gameState.winner}
            onRestart={handleRestart}
            playerScores={gameState.playerScores}
            hasReplayTurn={gameState.hasReplayTurn}
          />
        </Card>

        {/* Main Game Area */}
        <div className="space-y-8">
          {/* Game Board */}
          <div className="flex justify-center">
            <GameBoard
              board={gameState.board}
              specialCells={gameState.specialCells}
              onCellClick={handleCellClick}
              winningLine={gameState.winningLine}
              isInteractive={gameState.gameStatus === 'playing' && selectedPion !== null}
            />
          </div>

          {/* Pion Selector */}
          {gameState.gameStatus === 'playing' && (
            <Card className="p-6 max-w-md mx-auto">
              <PionSelector
                availablePions={gameState.availablePions}
                currentPlayer={gameState.currentPlayer}
                onPionSelect={handlePionSelect}
                selectedPion={selectedPion}
              />
            </Card>
          )}
        </div>

        {/* Rules */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Règles du jeu</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-2">Objectif</h4>
              <p>Formez une ligne (3+ pions consécutifs) dont la somme est exactement 15. Les cases spéciales multiplient la valeur des pions !</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Comment jouer</h4>
              <p>Sélectionnez un pion (1-9) et placez-le sur le plateau 15x15. Chaque pion ne peut être utilisé qu'une seule fois.</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Cases spéciales</h4>
              <p><strong>2x/3x :</strong> Multiplient la valeur du pion. <strong>↻ :</strong> Vous rejouez un tour supplémentaire.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};