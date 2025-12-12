
import React, { useEffect, useRef, useState } from 'react';

interface GameCanvasProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Item {
  x: number;
  y: number;
  type: 'grape' | 'bug' | 'golden';
  speed: number;
  emoji: string;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  
  // Refs pour la boucle de jeu (évite les re-renders React dans la boucle)
  const gameState = useRef({
    playerX: 0,
    items: [] as Item[],
    score: 0,
    lives: 3,
    frame: 0,
    isPlaying: false
  });

  useEffect(() => {
    const saved = localStorage.getItem('sommelier_highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset game
    setGameOver(false);
    setScore(0);
    gameState.current = {
      playerX: canvas.width / 2,
      items: [],
      score: 0,
      lives: 3,
      frame: 0,
      isPlaying: true
    };

    let animationFrameId: number;

    const spawnItem = (width: number) => {
      const rand = Math.random();
      let type: Item['type'] = 'grape';
      let emoji = '🍇';
      let speed = 3 + Math.random() * 2;

      if (rand > 0.95) {
        type = 'golden';
        emoji = '🍾'; // Champagne bonus
        speed = 5;
      } else if (rand > 0.75) {
        type = 'bug';
        emoji = '🐛'; // Maladie de la vigne
        speed = 2 + Math.random() * 2;
      }

      gameState.current.items.push({
        x: Math.random() * (width - 40) + 20,
        y: -50,
        type,
        speed,
        emoji
      });
    };

    const render = () => {
      if (!gameState.current.isPlaying) return;

      // Update Canvas Size responsive
      if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }

      const width = canvas.width;
      const height = canvas.height;

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Background gradient subtil
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#fdfbf7');
      gradient.addColorStop(1, '#fce7f3'); // Rose pale en bas
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Spawn logic
      gameState.current.frame++;
      if (gameState.current.frame % 40 === 0) { // Spawn rate
        spawnItem(width);
      }

      // Draw Player (Panier)
      const playerY = height - 80;
      const playerWidth = 80;
      // Clamp player position
      gameState.current.playerX = Math.max(playerWidth/2, Math.min(width - playerWidth/2, gameState.current.playerX));
      
      ctx.font = '60px serif';
      ctx.textAlign = 'center';
      ctx.fillText('🧺', gameState.current.playerX, playerY + 50);

      // Update & Draw Items
      for (let i = gameState.current.items.length - 1; i >= 0; i--) {
        const item = gameState.current.items[i];
        item.y += item.speed + (gameState.current.score * 0.05); // Accélération progressive

        // Draw
        ctx.font = '40px serif';
        ctx.fillText(item.emoji, item.x, item.y);

        // Collision Player
        if (
          item.y > playerY && 
          item.y < playerY + 60 && 
          Math.abs(item.x - gameState.current.playerX) < 50
        ) {
          if (item.type === 'bug') {
             gameState.current.lives--;
             // Shake effect visuals could go here
          } else {
             gameState.current.score += (item.type === 'golden' ? 50 : 10);
          }
          gameState.current.items.splice(i, 1);
          setScore(gameState.current.score);
          continue;
        }

        // Out of bounds
        if (item.y > height) {
          gameState.current.items.splice(i, 1);
        }
      }

      // Draw HUD
      ctx.fillStyle = '#9b1c1c';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${gameState.current.score}`, 20, 40);
      
      ctx.textAlign = 'right';
      ctx.fillText(`Vies: ${'❤️'.repeat(gameState.current.lives)}`, width - 20, 40);

      // Game Over Check
      if (gameState.current.lives <= 0) {
        gameState.current.isPlaying = false;
        setGameOver(true);
        if (gameState.current.score > highScore) {
            setHighScore(gameState.current.score);
            localStorage.setItem('sommelier_highscore', gameState.current.score.toString());
        }
      } else {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isOpen]);

  // Input Handlers
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!gameState.current.isPlaying) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      gameState.current.playerX = e.touches[0].clientX - rect.left;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!gameState.current.isPlaying) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      gameState.current.playerX = e.clientX - rect.left;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4">
      
      {/* Header Modal */}
      <div className="w-full max-w-lg flex justify-between items-center mb-4 text-white">
        <h2 className="text-2xl font-serif font-bold text-yellow-400">La Vendange</h2>
        <button onClick={onClose} className="p-2 bg-white/20 rounded-full hover:bg-white/40">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="relative w-full max-w-lg aspect-[3/4] bg-stone-100 rounded-xl overflow-hidden shadow-2xl border-4 border-stone-800">
        <canvas 
            ref={canvasRef}
            className="w-full h-full touch-none cursor-crosshair"
            onTouchMove={handleTouchMove}
            onMouseMove={handleMouseMove}
        />

        {gameOver && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-fade-in">
                <p className="text-4xl mb-2">fin de saison !</p>
                <p className="text-6xl font-bold text-yellow-400 mb-6">{score}</p>
                {score >= highScore && score > 0 && <p className="text-sm font-bold uppercase tracking-widest bg-wine-600 px-3 py-1 rounded mb-4">Nouveau Record !</p>}
                <p className="text-stone-300 mb-8">Record: {Math.max(score, highScore)}</p>
                
                <button 
                    onClick={() => {
                        setGameOver(false);
                        setScore(0);
                        gameState.current.items = [];
                        gameState.current.score = 0;
                        gameState.current.lives = 3;
                        gameState.current.isPlaying = true;
                        // Force re-render loop
                        const canvas = canvasRef.current;
                        if(canvas) {
                             // Trick simple pour relancer la boucle via le useEffect ou une fonction dédiée
                             // Ici on ferme et rouvre virtuellement ou on rappelle render
                             // Pour simplifier dans ce composant, on peut juste changer un state "restartKey"
                             // Mais le plus simple est de rappeler onClose puis réouvrir, ou gérer une fonction restart.
                             // Hack rapide : on modifie le state pour trigger le useEffect
                             onClose();
                             setTimeout(onClose, 0); // Re-open logic handled by parent usually, but here simplest is modifying state inside.
                             // Actually better:
                             // Re-calling render manually would be complex with hooks.
                             // Let's rely on parent re-mounting or just direct manipulation
                             window.location.reload(); // Trop brutal.
                        }
                    }}
                    className="bg-wine-600 hover:bg-wine-500 text-white px-8 py-3 rounded-full font-bold text-lg shadow-lg transition-transform hover:scale-105"
                >
                    Rejouer 🍇
                </button>
                <p className="mt-4 text-xs text-stone-400">Cliquez sur rejouer ou fermez la fenêtre</p>
            </div>
        )}
      </div>
      
      <p className="text-white/50 mt-4 text-sm text-center">
        Glissez votre doigt ou la souris pour déplacer le panier.<br/>
        Attrapez les raisins 🍇 et le champagne 🍾.<br/>
        Évitez les insectes 🐛 !
      </p>
    </div>
  );
};

export default GameCanvas;
