import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Trophy, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CatchPopcornGameProps {
  isOpen: boolean;
  onClose: () => void;
  onWin: (coins: number) => void;
}

type Particle = {
  id: number;
  x: number;
  y: number;
  type: 'normal' | 'gold' | 'fire';
  speed: number;
  rotation: number;
  rotSpeed: number;
};

type HitText = {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
};

const BUCKET_WIDTH = 130;
const BUCKET_HEIGHT = 110;
const PARTICLE_SIZE = 45;
const GAME_DURATION = 30; // seconds

export default function CatchPopcornGame({ isOpen, onClose, onWin }: CatchPopcornGameProps) {
  const [gameState, setGameState] = useState<'start' | 'playing' | 'end'>('start');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [hitTexts, setHitTexts] = useState<HitText[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const bucketXRef = useRef(window.innerWidth / 2 - BUCKET_WIDTH / 2);
  const particlesRef = useRef<Particle[]>([]);
  const hitTextsRef = useRef<HitText[]>([]);
  const scoreRef = useRef(0);
  const requestRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  
  // Track bàn phím
  const keysRef = useRef({ left: false, right: false });

  const handleMove = useCallback((clientX: number) => {
    const windowWidth = window.innerWidth;
    const x = clientX - BUCKET_WIDTH / 2;
    const clampedX = Math.max(0, Math.min(x, windowWidth - BUCKET_WIDTH));
    bucketXRef.current = clampedX;
    
    const bucketEl = document.getElementById('popcorn-bucket');
    if (bucketEl) {
      bucketEl.style.transform = `translateX(${clampedX}px)`;
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
    };

    if (gameState === 'playing') {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, handleMove]);

  const addHitText = (text: string, color: string, x: number, y: number) => {
    const newHit = { id: Date.now() + Math.random(), x, y, text, color };
    hitTextsRef.current.push(newHit);
    setTimeout(() => {
      hitTextsRef.current = hitTextsRef.current.filter(h => h.id !== newHit.id);
    }, 800);
  };

  const gameLoop = useCallback((time: number) => {
    if (gameState !== 'playing') return;

    if (!containerRef.current) {
      requestRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const containerHeight = containerRef.current.clientHeight;
    
    // Spawn
    if (time - lastSpawnRef.current > 350) { 
      const types: ('normal' | 'gold' | 'fire')[] = ['normal', 'normal', 'normal', 'gold', 'fire'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      particlesRef.current.push({
        id: Date.now() + Math.random(),
        x: Math.random() * (window.innerWidth - PARTICLE_SIZE),
        y: -50,
        type,
        speed: type === 'fire' ? 9 : (type === 'gold' ? 7 : 5),
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10
      });
      lastSpawnRef.current = time;
    }

    // Xử lý di chuyển bằng bàn phím (trơn tru)
    if (keysRef.current.left) {
      bucketXRef.current -= 15; // Tốc độ di chuyển bàn phím
    }
    if (keysRef.current.right) {
      bucketXRef.current += 15;
    }
    
    // Clamp bucket position
    bucketXRef.current = Math.max(0, Math.min(bucketXRef.current, window.innerWidth - BUCKET_WIDTH));
    
    const bucketX = bucketXRef.current;
    const bucketY = containerHeight - BUCKET_HEIGHT - 20;

    // Trực tiếp update DOM của ly bắp để mượt nhất có thể khi xài phím
    const bucketEl = document.getElementById('popcorn-bucket');
    if (bucketEl) {
      bucketEl.style.transform = `translateX(${bucketX}px)`;
    }

    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.y += p.speed;
      p.rotation += p.rotSpeed;

      const isCollidingX = p.x + PARTICLE_SIZE > bucketX - 30 && p.x < bucketX + BUCKET_WIDTH + 30;
      const isCollidingY = p.y + PARTICLE_SIZE > bucketY && p.y < bucketY + BUCKET_HEIGHT;

      if (isCollidingX && isCollidingY) {
        if (p.type === 'normal') {
          scoreRef.current += 1;
          addHitText('+1', 'text-white', p.x, bucketY - 20);
        }
        if (p.type === 'gold') {
          scoreRef.current += 5;
          addHitText('+5', 'text-yellow-400', p.x, bucketY - 20);
        }
        if (p.type === 'fire') {
          scoreRef.current = Math.max(0, scoreRef.current - 5);
          addHitText('-5', 'text-red-500', p.x, bucketY - 20);
          containerRef.current.classList.add('shake-effect');
          setTimeout(() => containerRef.current?.classList.remove('shake-effect'), 200);
        }
        
        setScore(scoreRef.current);
        particlesRef.current.splice(i, 1);
        continue;
      }

      if (p.y > containerHeight) {
        particlesRef.current.splice(i, 1);
      }
    }

    for (let i = 0; i < hitTextsRef.current.length; i++) {
      hitTextsRef.current[i].y -= 2; // Bay lên trên
    }

    setParticles([...particlesRef.current]);
    setHitTexts([...hitTextsRef.current]);

    requestRef.current = requestAnimationFrame(gameLoop);
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(gameLoop);
      
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameState('end');
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        clearInterval(timer);
      };
    }
  }, [gameState, gameLoop]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(GAME_DURATION);
    scoreRef.current = 0;
    particlesRef.current = [];
    hitTextsRef.current = [];
    setParticles([]);
    setHitTexts([]);
    bucketXRef.current = window.innerWidth / 2 - BUCKET_WIDTH / 2;
  };

  const handleFinish = () => {
    if (score >= 50) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#ff0000', '#ffa500', '#ffff00'] });
      onWin(500);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950 via-gray-900 to-black text-white flex items-center justify-center overflow-hidden font-sans select-none touch-none" 
        ref={containerRef}
      >
        <style>{`
          .shake-effect { animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both; }
          @keyframes shake {
            10%, 90% { transform: translate3d(-4px, 0, 0); }
            20%, 80% { transform: translate3d(6px, 0, 0); }
            30%, 50%, 70% { transform: translate3d(-10px, 0, 0); }
            40%, 60% { transform: translate3d(10px, 0, 0); }
          }
          .hit-text { animation: floatUp 0.8s ease-out forwards; }
          @keyframes floatUp {
            0% { opacity: 1; transform: scale(1.5); }
            100% { opacity: 0; transform: scale(1) translateY(-40px); }
          }
          .bucket-stripe {
            background: repeating-linear-gradient(90deg, #dc2626, #dc2626 20px, #ffffff 20px, #ffffff 40px);
          }
        `}</style>

        {/* Cinematic Spotlight Effect */}
        <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none"></div>

        {gameState !== 'playing' && (
          <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50 backdrop-blur-md">
            <X className="w-6 h-6" />
          </button>
        )}

        {gameState === 'start' && (
          <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} className="text-center max-w-lg p-10 bg-black/60 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_0_100px_rgba(220,38,38,0.3)] relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-600/30 blur-3xl rounded-full pointer-events-none"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-orange-600/30 blur-3xl rounded-full pointer-events-none"></div>
            
            <div className="text-8xl mb-6 filter drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">🍿</div>
            <h1 className="text-5xl font-black mb-4 tracking-tight"><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500">POPCORN</span> CATCH</h1>
            <p className="text-gray-300 mb-2 text-lg font-medium">Hứng bắp để tích điểm. Đạt 50 điểm nhận ngay 500 CineCoins!</p>
            <p className="text-yellow-500 mb-8 text-sm font-bold bg-yellow-500/10 inline-block px-4 py-2 rounded-full">
              ⌨️ Hỗ trợ chơi bằng Phím Mũi Tên (Trái/Phải) hoặc phím A/D!
            </p>
            
            <div className="flex justify-center gap-8 mb-10 text-base font-bold bg-white/5 p-4 rounded-2xl">
              <div className="flex flex-col items-center"><span className="text-3xl mb-1">🍿</span> +1 Điểm</div>
              <div className="flex flex-col items-center"><span className="text-3xl mb-1 filter drop-shadow-[0_0_10px_yellow]">⭐</span> +5 Điểm</div>
              <div className="flex flex-col items-center"><span className="text-3xl mb-1">🔥</span> -5 Điểm</div>
            </div>

            <button onClick={startGame} className="w-full py-5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 rounded-2xl font-black text-2xl flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(220,38,38,0.5)]">
              <Play className="w-7 h-7 fill-current" /> BẮT ĐẦU CHƠI
            </button>
          </motion.div>
        )}

        {gameState === 'playing' && (
          <>
            {/* Top HUD */}
            <div className="absolute top-8 inset-x-8 flex items-center justify-between pointer-events-none">
              <div className="bg-black/40 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-xl flex items-center gap-3 text-yellow-400 shadow-lg">
                <Trophy className="w-8 h-8 fill-yellow-400/20" /> 
                <span className="text-4xl font-black">{score}</span>
              </div>
              
              <div className={`px-6 py-3 rounded-2xl backdrop-blur-xl border border-white/10 flex items-center gap-3 font-black text-3xl shadow-lg transition-colors ${timeLeft <= 10 ? 'bg-red-600/80 text-white animate-pulse' : 'bg-black/40 text-white'}`}>
                <Clock className="w-7 h-7" /> {timeLeft}s
              </div>
            </div>

            {/* Particles */}
            {particles.map(p => (
              <div
                key={p.id}
                className="absolute text-5xl flex items-center justify-center will-change-transform"
                style={{
                  left: p.x,
                  top: p.y,
                  width: PARTICLE_SIZE,
                  height: PARTICLE_SIZE,
                  transform: `rotate(${p.rotation}deg)`,
                }}
              >
                {p.type === 'normal' && <span className="filter drop-shadow-md">🍿</span>}
                {p.type === 'gold' && <span className="filter drop-shadow-[0_0_15px_rgba(250,204,21,1)]">⭐</span>}
                {p.type === 'fire' && <span className="filter drop-shadow-[0_0_20px_rgba(239,68,68,1)]">🔥</span>}
              </div>
            ))}

            {/* Hit Texts */}
            {hitTexts.map(h => (
              <div
                key={h.id}
                className={`absolute font-black text-3xl hit-text pointer-events-none drop-shadow-lg ${h.color}`}
                style={{ left: h.x, top: h.y }}
              >
                {h.text}
              </div>
            ))}

            {/* Catcher Bucket */}
            <div
              id="popcorn-bucket"
              className="absolute bottom-5 will-change-transform filter drop-shadow-[0_10px_20px_rgba(220,38,38,0.4)]"
              style={{
                left: 0,
                width: BUCKET_WIDTH,
                height: BUCKET_HEIGHT,
                transform: `translateX(${bucketXRef.current}px)`,
              }}
            >
              <div className="w-full h-full relative perspective-1000">
                {/* 3D-like Bucket Shape */}
                <div 
                  className="absolute inset-0 bucket-stripe border-4 border-red-700 shadow-inner rounded-b-2xl opacity-95"
                  style={{ transform: 'perspective(100px) rotateX(-5deg)' }}
                ></div>
                {/* Rim */}
                <div className="absolute top-0 inset-x-0 h-4 bg-red-800 rounded-full shadow-lg border border-red-500 z-10"></div>
                {/* Logo */}
                <div className="absolute inset-0 flex items-center justify-center z-20">
                  <div className="bg-white px-3 py-1 rounded-full font-black text-red-600 border-2 border-red-600 shadow-md text-sm transform -rotate-12">CINE</div>
                </div>
              </div>
            </div>
          </>
        )}

        {gameState === 'end' && (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md p-10 bg-black/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
            <h2 className="text-4xl font-black mb-2 text-white">HẾT GIỜ!</h2>
            <p className="text-gray-400 mb-6 text-lg">Bạn đã hứng được tổng cộng:</p>
            
            <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 mb-8 filter drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
              {score}
            </div>

            {score >= 50 ? (
              <div className="bg-green-500/20 border border-green-500/50 text-green-400 p-5 rounded-2xl mb-8 font-bold text-lg">
                🎉 Quá đỉnh! Bạn nhận được 500 CineCoins!
              </div>
            ) : (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-5 rounded-2xl mb-8 font-bold text-lg">
                Cần 50 điểm để nhận xu. Thử lại lần sau nhé!
              </div>
            )}

            <button onClick={handleFinish} className="w-full py-4 bg-white hover:bg-gray-200 text-black rounded-2xl font-black text-xl transition-transform active:scale-95 shadow-lg">
              XÁC NHẬN
            </button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
