import React, { useRef, useEffect, useCallback } from 'react';
import { Player, Entity, Particle, GameState } from '../types';

interface GameCanvasProps {
  gameState: GameState;
  onGameOver: (score: number, time: number) => void;
  onScoreUpdate: (score: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, onGameOver, onScoreUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const scoreRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  
  // Game State Refs (Mutable for performance)
  const playerRef = useRef<Player>({ x: 0, y: 0, radius: 20, speed: 5, color: '#38bdf8', angle: 0 });
  const enemiesRef = useRef<Entity[]>([]);
  const starsRef = useRef<Entity[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const touchPos = useRef<{ x: number, y: number } | null>(null);

  // Constants
  const SPAWN_RATE = 60; // Frames
  const STAR_COUNT = 100;
  
  // Initialize Stars
  const initStars = (width: number, height: number) => {
    starsRef.current = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      starsRef.current.push({
        id: i,
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2,
        speed: Math.random() * 3 + 0.5,
        color: `rgba(255, 255, 255, ${Math.random()})`
      });
    }
  };

  // Create Explosion
  const createExplosion = (x: number, y: number, color: string) => {
    for (let i = 0; i < 15; i++) {
      particlesRef.current.push({
        id: Math.random(),
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        maxLife: 1.0,
        color: color,
        size: Math.random() * 4 + 2
      });
    }
  };

  // Reset Game
  const resetGame = (width: number, height: number) => {
    scoreRef.current = 0;
    startTimeRef.current = Date.now();
    playerRef.current = { 
      x: width / 2, 
      y: height - 100, 
      radius: 20, 
      speed: 7, 
      color: '#38bdf8',
      angle: 0
    };
    enemiesRef.current = [];
    particlesRef.current = [];
    onScoreUpdate(0);
  };

  const update = (width: number, height: number, frameCount: number) => {
    if (gameState !== GameState.PLAYING) return;

    // 1. Move Player
    const player = playerRef.current;
    
    // Keyboard Input
    if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) player.x -= player.speed;
    if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) player.x += player.speed;
    if (keysPressed.current['ArrowUp'] || keysPressed.current['w']) player.y -= player.speed;
    if (keysPressed.current['ArrowDown'] || keysPressed.current['s']) player.y += player.speed;

    // Touch/Mouse Follow Input
    if (touchPos.current) {
        const dx = touchPos.current.x - player.x;
        const dy = touchPos.current.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 5) {
            player.x += (dx / distance) * player.speed;
            player.y += (dy / distance) * player.speed;
        }
        // Rotate towards movement
        player.angle = Math.atan2(dy, dx) + Math.PI / 2;
    } else {
        // Default tilt based on horizontal movement
        if (keysPressed.current['ArrowLeft'] || keysPressed.current['a']) player.angle = -0.3;
        else if (keysPressed.current['ArrowRight'] || keysPressed.current['d']) player.angle = 0.3;
        else player.angle = 0;
    }

    // Boundaries
    player.x = Math.max(player.radius, Math.min(width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(height - player.radius, player.y));

    // 2. Spawn Enemies
    if (frameCount % Math.max(10, SPAWN_RATE - Math.floor(scoreRef.current / 50)) === 0) {
      const size = Math.random() * 30 + 15;
      enemiesRef.current.push({
        id: Date.now() + Math.random(),
        x: Math.random() * width,
        y: -50,
        radius: size,
        speed: Math.random() * 4 + 2 + (scoreRef.current / 200),
        color: Math.random() > 0.9 ? '#fde047' : '#ef4444' // Yellow (Bonus) or Red (Enemy)
      });
    }

    // 3. Update Enemies
    for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
      const enemy = enemiesRef.current[i];
      enemy.y += enemy.speed;

      // Collision Detection
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < player.radius + enemy.radius) {
        if (enemy.color === '#fde047') {
           // Bonus
           scoreRef.current += 50;
           onScoreUpdate(scoreRef.current);
           createExplosion(enemy.x, enemy.y, '#fde047');
           enemiesRef.current.splice(i, 1);
        } else {
            // Game Over
            createExplosion(player.x, player.y, player.color);
            onGameOver(scoreRef.current, (Date.now() - startTimeRef.current) / 1000);
            return;
        }
      } else if (enemy.y > height + 50) {
        enemiesRef.current.splice(i, 1);
        scoreRef.current += 10;
        onScoreUpdate(scoreRef.current);
      }
    }

    // 4. Update Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        if (p.life <= 0) particlesRef.current.splice(i, 1);
    }
  };

  const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    // Draw Stars
    ctx.fillStyle = '#ffffff';
    starsRef.current.forEach(star => {
        star.y += star.speed * (gameState === GameState.PLAYING ? 1 : 0.2);
        if (star.y > height) star.y = 0;
        
        ctx.globalAlpha = Math.random() * 0.5 + 0.3;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw Player
    if (gameState === GameState.PLAYING) {
        const p = playerRef.current;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = p.color;
        
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.radius);
        ctx.lineTo(p.radius, p.radius);
        ctx.lineTo(0, p.radius * 0.5);
        ctx.lineTo(-p.radius, p.radius);
        ctx.closePath();
        ctx.fill();
        
        // Thruster
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(-p.radius * 0.5, p.radius * 0.8);
        ctx.lineTo(0, p.radius * 2 + Math.random() * 10);
        ctx.lineTo(p.radius * 0.5, p.radius * 0.8);
        ctx.fill();

        ctx.restore();
    }

    // Draw Enemies
    enemiesRef.current.forEach(e => {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.shadowBlur = 15;
        ctx.shadowColor = e.color;
        ctx.fillStyle = e.color;
        
        if (e.color === '#fde047') {
            // Coin/Star shape
            ctx.beginPath();
            ctx.arc(0, 0, e.radius * 0.6, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Asteroid/Enemy shape
            ctx.beginPath();
            const spikes = 5;
            const outerRadius = e.radius;
            const innerRadius = e.radius / 2;
            let rot = Math.PI / 2 * 3;
            let x = 0;
            let y = 0;
            const step = Math.PI / spikes;

            ctx.moveTo(0, 0 - outerRadius);
            for (let i = 0; i < spikes; i++) {
                x = Math.cos(rot) * outerRadius;
                y = Math.sin(rot) * outerRadius;
                ctx.lineTo(x, y);
                rot += step;

                x = Math.cos(rot) * innerRadius;
                y = Math.sin(rot) * innerRadius;
                ctx.lineTo(x, y);
                rot += step;
            }
            ctx.lineTo(0, 0 - outerRadius);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    });

    // Draw Particles
    particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  };

  const loop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (gameState === GameState.PLAYING) {
        requestRef.current = requestAnimationFrame(loop);
    } else {
         // Keep animating background even if not playing
        requestRef.current = requestAnimationFrame(loop);
    }
    
    // Auto resize
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        // Re-init stars on resize
        if (starsRef.current.length === 0) initStars(canvas.width, canvas.height);
    }

    update(canvas.width, canvas.height, (requestRef.current || 0));
    draw(ctx, canvas.width, canvas.height);
  }, [gameState, onGameOver, onScoreUpdate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if(canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initStars(canvas.width, canvas.height);
    }

    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };
    const handleTouchStart = (e: TouchEvent) => { 
        touchPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const handleTouchMove = (e: TouchEvent) => {
        touchPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        e.preventDefault();
    };
    const handleTouchEnd = () => { touchPos.current = null; };
    const handleMouseMove = (e: MouseEvent) => {
        // Optional: Mouse control
        // touchPos.current = { x: e.clientX, y: e.clientY };
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    // window.addEventListener('mousemove', handleMouseMove);

    if (gameState === GameState.PLAYING) {
        resetGame(window.innerWidth, window.innerHeight);
    }
    
    requestRef.current = requestAnimationFrame(loop);

    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
        // window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gameState, loop]);

  return <canvas ref={canvasRef} className="absolute inset-0 block bg-slate-900" />;
};

export default GameCanvas;