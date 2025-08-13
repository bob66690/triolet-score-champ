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
          />
        </Card>

        {/* Main Game Area */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Game Board */}
          <div className="flex justify-center">
            <GameBoard
              board={gameState.board}
              onCellClick={handleCellClick}
              winningLine={gameState.winningLine}
              isInteractive={gameState.gameStatus === 'playing' && selectedPion !== null}
            />
          </div>

          {/* Pion Selector */}
          {gameState.gameStatus === 'playing' && (
            <Card className="p-6">
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
          <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-2">Objectif</h4>
              <p>Être le premier à former une ligne (horizontale, verticale ou diagonale) de 3 pions dont la somme est exactement 15.</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Comment jouer</h4>
              <p>Chacun votre tour, sélectionnez un pion numéroté (1-9) et placez-le sur le plateau. Chaque pion ne peut être utilisé qu'une seule fois.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};