import { useState } from 'react';
import { useTrioletGame } from '@/hooks/useTrioletGame';
import { GameBoard } from '@/components/GameBoard';
import { PlayerHand } from '@/components/PlayerHand';
import { GameStatus } from '@/components/GameStatus';
import { JokerDialog } from '@/components/JokerDialog';
import { Position } from '@/types/game';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const TrioletGame = () => {
  const { gameState, placePionTemporarily, removePionTemporarily, validateTurn, exchangePions, passTurn, resetGame, isValidPlacement, assignJokerValue } = useTrioletGame();
  const [selectedPionIndex, setSelectedPionIndex] = useState<number | null>(null);
  const [temporaryPlacements, setTemporaryPlacements] = useState<{position: Position, pion: number | 'X', originalIndex: number}[]>([]);
  const [jokerDialog, setJokerDialog] = useState<{ isOpen: boolean; position: Position | null }>({ isOpen: false, position: null });

  const handleCellClick = (position: Position) => {
    if (gameState.gameStatus !== 'playing') return;

    // Check if clicking on a temporarily placed pion to remove it
    const tempPlacement = temporaryPlacements.find(p => p.position.row === position.row && p.position.col === position.col);
    if (tempPlacement) {
      removePionTemporarily(position);
      setTemporaryPlacements(prev => prev.filter(p => p !== tempPlacement));
      return;
    }

    // Place a selected pion
    if (selectedPionIndex !== null && gameState.playerHands?.[gameState.currentPlayer]) {
      const hand = gameState.playerHands[gameState.currentPlayer];
      if (selectedPionIndex >= 0 && selectedPionIndex < hand.length) {
        const pion = hand[selectedPionIndex];
        if (isValidPlacement(position, temporaryPlacements.map(p => p.position))) {
          // If it's a joker, open dialog to choose value
          if (pion === 'X' && gameState.jokersPlayedThisTurn === 0) {
            setJokerDialog({ isOpen: true, position });
            return;
          }
          placePionTemporarily(position, pion, selectedPionIndex);
          setTemporaryPlacements(prev => [...prev, { position, pion, originalIndex: selectedPionIndex }]);
          setSelectedPionIndex(null);
        }
      }
    }
  };

  const handleJokerValueSelect = (value: number) => {
    if (jokerDialog.position && selectedPionIndex !== null) {
      const hand = gameState.playerHands[gameState.currentPlayer];
      const pion = hand[selectedPionIndex];
      
      placePionTemporarily(jokerDialog.position, pion, selectedPionIndex);
      assignJokerValue(jokerDialog.position, value);
      setTemporaryPlacements(prev => [...prev, { position: jokerDialog.position!, pion, originalIndex: selectedPionIndex }]);
      setSelectedPionIndex(null);
    }
    setJokerDialog({ isOpen: false, position: null });
  };

  const handlePionSelect = (pionIndex: number) => {
    setSelectedPionIndex(selectedPionIndex === pionIndex ? null : pionIndex);
  };

  const handleExchange = (indices: number[]) => {
    exchangePions(indices);
  };

  const handleValidateTurn = () => {
    if (temporaryPlacements.length > 0) {
      validateTurn(temporaryPlacements);
      setTemporaryPlacements([]);
    }
    setSelectedPionIndex(null);
  };

  const handlePass = () => {
    // Clear temporary placements first
    temporaryPlacements.forEach(placement => {
      removePionTemporarily(placement.position);
    });
    setTemporaryPlacements([]);
    passTurn();
    setSelectedPionIndex(null);
  };

  const handleRestart = () => {
    resetGame();
    setSelectedPionIndex(null);
    setTemporaryPlacements([]);
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
                selectedPionIndex={selectedPionIndex}
                pionBag={gameState.pionBag}
              />
              <PlayerHand
                hand={gameState.playerHands[2] || []}
                player={2}
                isCurrentPlayer={gameState.currentPlayer === 2}
                onPionSelect={handlePionSelect}
                onExchange={handleExchange}
                onPass={handlePass}
                selectedPionIndex={selectedPionIndex}
                pionBag={gameState.pionBag}
              />
            </div>
          )}

          {/* Turn Actions */}
          {gameState.gameStatus === 'playing' && (
            <Card className="p-4 max-w-md mx-auto">
              <div className="text-center space-y-4">
                {selectedPionIndex !== null && (
                  <p className="text-sm text-muted-foreground">
                    Pion sélectionné: {gameState.playerHands?.[gameState.currentPlayer]?.[selectedPionIndex]}
                  </p>
                )}
                {temporaryPlacements.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Pions placés temporairement: {temporaryPlacements.length}
                  </p>
                )}
                <div className="flex gap-2 justify-center">
                  {temporaryPlacements.length > 0 && (
                    <Button onClick={handleValidateTurn} variant="default">
                      Valider le tour ({temporaryPlacements.length} pion{temporaryPlacements.length > 1 ? 's' : ''})
                    </Button>
                  )}
                  <Button onClick={handlePass} variant="outline">
                    Passer le tour
                  </Button>
                </div>
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
              isInteractive={gameState.gameStatus === 'playing'}
              temporaryPlacements={temporaryPlacements}
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

        <JokerDialog
          isOpen={jokerDialog.isOpen}
          onClose={() => setJokerDialog({ isOpen: false, position: null })}
          onValueSelect={handleJokerValueSelect}
        />
      </div>
    </div>
  );
};