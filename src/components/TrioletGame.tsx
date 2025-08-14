import { useState } from 'react';
import { useTrioletGame } from '@/hooks/useTrioletGame';
import { GameBoard } from '@/components/GameBoard';
import { PlayerHand } from '@/components/PlayerHand';
import { GameStatus } from '@/components/GameStatus';
import { Position } from '@/types/game';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const TrioletGame = () => {
  const { gameState, placePions, exchangePions, passTurn, resetGame } = useTrioletGame();
  const [selectedPions, setSelectedPions] = useState<(number | 'X')[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<Position[]>([]);

  const handleCellClick = (position: Position) => {
    if (selectedPions.length > 0 && gameState.gameStatus === 'playing') {
      const newPositions = [...selectedPositions, position];
      setSelectedPositions(newPositions);
      
      // If we have the same number of positions as selected pions, place them
      if (newPositions.length === selectedPions.length) {
        const success = placePions(newPositions, selectedPions);
        if (success) {
          setSelectedPions([]);
          setSelectedPositions([]);
        }
      }
    }
  };

  const handlePionSelect = (pion: number | 'X') => {
    if (selectedPions.includes(pion)) {
      setSelectedPions(prev => prev.filter(p => p !== pion));
    } else if (selectedPions.length < 3) {
      setSelectedPions(prev => [...prev, pion]);
    }
    // Reset positions when changing pion selection
    setSelectedPositions([]);
  };

  const handleExchange = (indices: number[]) => {
    exchangePions(indices);
  };

  const handlePass = () => {
    passTurn();
    setSelectedPions([]);
    setSelectedPositions([]);
  };

  const handleRestart = () => {
    resetGame();
    setSelectedPions([]);
    setSelectedPositions([]);
  };

  const handlePlacePions = () => {
    if (selectedPions.length > 0 && selectedPositions.length === selectedPions.length) {
      const success = placePions(selectedPositions, selectedPions);
      if (success) {
        setSelectedPions([]);
        setSelectedPositions([]);
      }
    }
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
          {/* Player Hands */}
          {gameState.gameStatus === 'playing' && gameState.playerHands && (
            <div className="grid md:grid-cols-2 gap-6">
              <PlayerHand
                hand={gameState.playerHands[1] || []}
                player={1}
                isCurrentPlayer={gameState.currentPlayer === 1}
                onPionSelect={handlePionSelect}
                onExchange={handleExchange}
                onPass={handlePass}
                selectedPions={selectedPions}
                pionBag={gameState.pionBag}
              />
              <PlayerHand
                hand={gameState.playerHands[2] || []}
                player={2}
                isCurrentPlayer={gameState.currentPlayer === 2}
                onPionSelect={handlePionSelect}
                onExchange={handleExchange}
                onPass={handlePass}
                selectedPions={selectedPions}
                pionBag={gameState.pionBag}
              />
            </div>
          )}

          {/* Placement Controls */}
          {gameState.gameStatus === 'playing' && selectedPions.length > 0 && (
            <Card className="p-4 max-w-md mx-auto">
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Pions sélectionnés: {selectedPions.join(', ')}
                </p>
                <p className="text-sm text-muted-foreground">
                  Cliquez sur {selectedPions.length} case{selectedPions.length > 1 ? 's' : ''} du plateau pour placer vos pions
                </p>
                {selectedPositions.length === selectedPions.length && (
                  <Button onClick={handlePlacePions}>
                    Placer les pions
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedPions([]);
                    setSelectedPositions([]);
                  }}
                >
                  Annuler
                </Button>
              </div>
            </Card>
          )}

          {/* Game Board */}
          <div className="flex justify-center">
            <GameBoard
              board={gameState.board}
              specialCells={gameState.specialCells}
              onCellClick={handleCellClick}
              winningLine={gameState.winningLine}
              isInteractive={gameState.gameStatus === 'playing' && selectedPions.length > 0}
            />
          </div>
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