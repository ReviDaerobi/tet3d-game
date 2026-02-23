import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Edges, Float } from '@react-three/drei';
import useSound from 'use-sound';
import * as THREE from 'three';

// --- 1. KONFIGURASI ---
const COLS_PER_SIDE = 8;
const SIDES = 4;
const TOTAL_COLS = COLS_PER_SIDE * SIDES; 
const ROWS = 20;

const SFX = {
  MOVE: '/sounds/move.mp3',
  ROTATE: '/sounds/rotate.mp3', 
  CLEAR: '/sounds/clear.mp3',
  DROP: '/sounds/drop.mp3',
  GAMEOVER: '/sounds/gameover.mp3',
};

const TRACKS = [
  '/sounds/track1.mp3',
  '/sounds/track2.mp3',
  '/sounds/track3.mp3',
  '/sounds/track4.mp3',
];

const TETROMINOES = [
  { shape: [{x: -1, y: 0}, {x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}], color: '#00f2ff' }, 
  { shape: [{x: 0, y: 0}, {x: 1, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}], color: '#ffef00' }, 
  { shape: [{x: -1, y: 0}, {x: 0, y: 0}, {x: 1, y: 0}, {x: 0, y: 1}], color: '#a800ff' }, 
  { shape: [{x: 0, y: 0}, {x: 1, y: 0}, {x: -1, y: 1}, {x: 0, y: 1}], color: '#00ff44' }, 
  { shape: [{x: -1, y: 0}, {x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}], color: '#ff0044' }, 
  { shape: [{x: -1, y: 1}, {x: -1, y: 0}, {x: 0, y: 0}, {x: 1, y: 0}], color: '#0055ff' }, 
  { shape: [{x: 1, y: 1}, {x: -1, y: 0}, {x: 0, y: 0}, {x: 1, y: 0}], color: '#ff8800' }  
];

// --- 2. HELPERS ---
const createEmptyBoard = () => Array.from({ length: ROWS }, () => Array(TOTAL_COLS).fill(null));
const getRandomPiece = (side = 0) => {
  const rand = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
  return { x: (side * COLS_PER_SIDE) + 4, y: 18, shape: rand.shape, color: rand.color };
};

function get3DPosition(gridX, gridY) {
  const y3D = gridY - ROWS / 2 + 0.5;
  const side = Math.floor(gridX / COLS_PER_SIDE);
  const localX = gridX % COLS_PER_SIDE;
  const radius = 4.6; 
  const offset = localX - (COLS_PER_SIDE / 2) + 0.5;
  if (side === 0) return [offset, y3D, radius];
  if (side === 1) return [radius, y3D, -offset];
  if (side === 2) return [-offset, y3D, -radius];
  if (side === 3) return [-radius, y3D, offset];
  return [0, 0, 0];
}

// --- 3. 3D COMPONENTS ---
function CameraRig({ side, isMenu }) {
  useFrame((state) => {
    // Deteksi jika layar HP (Portrait), mundurkan kamera sedikit lebih jauh
    const isPortrait = state.size.width < state.size.height;
    const angle = isMenu ? state.clock.getElapsedTime() * 0.15 : (side * Math.PI) / 2;
    const radius = isPortrait ? 38 : 30; // Mundur di HP agar pilar terlihat utuh
    state.camera.position.lerp(new THREE.Vector3(Math.sin(angle) * radius, isMenu ? 6 : 0, Math.cos(angle) * radius), 0.05);
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

function Block({ gridX, gridY, color, opacity = 1 }) {
  const position = useMemo(() => get3DPosition(gridX, gridY), [gridX, gridY]);
  return (
    <mesh position={position}>
      <boxGeometry args={[0.9, 0.9, 0.9]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={opacity} />
      <Edges scale={1.1} threshold={15} color="white" />
    </mesh>
  );
}

function Explosion({ gridY }) {
  const groupRef = useRef();
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < TOTAL_COLS; i++) {
      temp.push({ angle: (i / TOTAL_COLS) * Math.PI * 2, speed: 10 + Math.random() * 5, yOffset: (gridY - ROWS / 2) + 0.5 });
    }
    return temp;
  }, [gridY]);
  const startTime = useRef(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    if (startTime.current === null) startTime.current = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - startTime.current;
    groupRef.current.children.forEach((mesh, i) => {
      const p = particles[i];
      const dist = 4.6 + (elapsed * p.speed);
      mesh.position.set(Math.sin(p.angle) * dist, p.yOffset + (elapsed * 3), Math.cos(p.angle) * dist);
      mesh.scale.setScalar(Math.max(0, 1 - elapsed * 2));
    });
  });
  return <group ref={groupRef}>{particles.map((_, i) => <mesh key={i}><boxGeometry args={[0.3, 0.3, 0.3]} /><meshBasicMaterial color="white" /></mesh>)}</group>;
}

// --- 4. MAIN APP ---
export default function App() {
  const [playMove] = useSound(SFX.MOVE, { volume: 0.3 });
  const [playRotate] = useSound(SFX.ROTATE, { volume: 0.4 });
  const [playClear] = useSound(SFX.CLEAR, { volume: 0.6 });
  const [playDrop] = useSound(SFX.DROP, { volume: 0.4 });
  const [playGameOver] = useSound(SFX.GAMEOVER, { volume: 0.7 });

  const [trackIndex, setTrackIndex] = useState(0);
  const [playT1, { stop: stopT1 }] = useSound(TRACKS[0], { loop: true, volume: 0.25 });
  const [playT2, { stop: stopT2 }] = useSound(TRACKS[1], { loop: true, volume: 0.25 });
  const [playT3, { stop: stopT3 }] = useSound(TRACKS[2], { loop: true, volume: 0.25 });
  const [playT4, { stop: stopT4 }] = useSound(TRACKS[3], { loop: true, volume: 0.25 });

  const stopAllTracks = useCallback(() => {
    stopT1(); stopT2(); stopT3(); stopT4();
  }, [stopT1, stopT2, stopT3, stopT4]);

  const [gameState, setGameState] = useState(() => ({
    board: createEmptyBoard(),
    activePiece: getRandomPiece(0),
    score: 0,
    level: 1,
    status: 'MENU', 
  }));
  
  const [cameraSide, setCameraSide] = useState(0);
  const [explosions, setExplosions] = useState([]); 
  const cameraSideRef = useRef(0);

  useEffect(() => { cameraSideRef.current = cameraSide; }, [cameraSide]);

  // Jukebox Logic
  useEffect(() => {
    if (gameState.status !== 'PLAYING' && gameState.status !== 'PAUSED') { stopAllTracks(); return; }
    stopAllTracks();
    const tracks = [playT1, playT2, playT3, playT4];
    tracks[trackIndex]();
    return () => stopAllTracks();
  }, [trackIndex, gameState.status, playT1, playT2, playT3, playT4, stopAllTracks]);

  const checkCollision = useCallback((pieceX, pieceY, shape, board) => {
    if (!shape || !board) return true;
    for (let block of shape) {
      const absX = (pieceX + block.x + TOTAL_COLS) % TOTAL_COLS;
      const absY = pieceY + block.y;
      if (absY < 0) return true;
      if (absY >= ROWS) continue; 
      if (board[absY] && board[absY][absX] !== null) return true;
    }
    return false;
  }, []);

  const getGhostY = useCallback(() => {
    if (!gameState.activePiece) return 0;
    const { x, y, shape } = gameState.activePiece;
    let ghostY = y;
    while (!checkCollision(x, ghostY - 1, shape, gameState.board)) ghostY--;
    return ghostY;
  }, [gameState.activePiece, gameState.board, checkCollision]);

  // FUNGSI UTAMA UNTUK AKSI (Keyboard & Mobile Buttons)
  const handleAction = useCallback((action) => {
    if (gameState.status !== 'PLAYING') return;

    if (action === 'CAM_LEFT') { setCameraSide(s => (s - 1 + 4) % 4); playRotate(); return; }
    if (action === 'CAM_RIGHT') { setCameraSide(s => (s + 1) % 4); playRotate(); return; }

    setGameState((prev) => {
      let { x, y, shape, color } = prev.activePiece;
      let newX = x, newY = y, newShape = shape;
      let moved = false, rotated = false;

      if (action === 'MOVE_LEFT') { newX = (x - 1 + TOTAL_COLS) % TOTAL_COLS; moved = true; }
      if (action === 'MOVE_RIGHT') { newX = (x + 1) % TOTAL_COLS; moved = true; }
      if (action === 'MOVE_DOWN') { newY = y - 1; moved = true; }
      if (action === 'ROTATE') { newShape = shape.map(b => ({ x: -b.y, y: b.x })); rotated = true; }

      if (checkCollision(newX, newY, newShape, prev.board)) return prev;
      if (rotated) playRotate(); else if (moved) playMove();
      return { ...prev, activePiece: { x: newX, y: newY, shape: newShape, color } };
    });
  }, [gameState.status, checkCollision, playMove, playRotate]);

  const resetGame = () => {
    setCameraSide(0);
    setExplosions([]);
    setGameState({ board: createEmptyBoard(), activePiece: getRandomPiece(0), score: 0, level: 1, status: 'PLAYING' });
  };

  // Keyboard Event
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setGameState(prev => ({ ...prev, status: prev.status === 'PLAYING' ? 'PAUSED' : prev.status === 'PAUSED' ? 'PLAYING' : prev.status }));
        return;
      }
      if (e.key.toLowerCase() === 'c' && gameState.status === 'PLAYING') {
        setGameState(prev => ({ ...prev, score: prev.score + 500, level: Math.floor((prev.score + 500) / 500) + 1 }));
        playClear(); return;
      }
      const map = { a: 'CAM_LEFT', d: 'CAM_RIGHT', ArrowLeft: 'MOVE_LEFT', ArrowRight: 'MOVE_RIGHT', ArrowDown: 'MOVE_DOWN', ArrowUp: 'ROTATE' };
      if (map[e.key] || map[e.key.toLowerCase()]) handleAction(map[e.key] || map[e.key.toLowerCase()]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.status, handleAction, playClear]);

  // Game Loop
  useEffect(() => {
    if (gameState.status !== 'PLAYING') return;
    const dropInterval = setInterval(() => {
      setGameState((prev) => {
        const { x, y, shape, color } = prev.activePiece;
        const nextY = y - 1;
        if (checkCollision(x, nextY, shape, prev.board)) {
          if (y >= 18) { playGameOver(); return { ...prev, status: 'GAMEOVER' }; }
          playDrop();
          let newBoard = prev.board.map(row => [...row]);
          shape.forEach(b => {
            const absX = (x + b.x + TOTAL_COLS) % TOTAL_COLS;
            if (y + b.y >= 0 && y + b.y < ROWS) newBoard[y + b.y][absX] = color;
          });
          let clearedY = [];
          const filtered = newBoard.filter((row, i) => { if (row.every(c => c !== null)) { clearedY.push(i); return false; } return true; });
          if (clearedY.length > 0) {
            playClear();
            const newExps = clearedY.map(yPos => ({ id: Math.random(), y: yPos }));
            setExplosions(old => [...old, ...newExps]);
            setTimeout(() => setExplosions(old => old.filter(e => !newExps.includes(e))), 1000);
          }
          while (filtered.length < ROWS) filtered.push(Array(TOTAL_COLS).fill(null));
          const nScore = prev.score + ([0, 100, 300, 500, 800][clearedY.length] || 0);
          return { ...prev, board: filtered, activePiece: getRandomPiece(cameraSideRef.current), score: nScore, level: Math.floor(nScore / 500) + 1 };
        }
        return { ...prev, activePiece: { ...prev.activePiece, y: nextY } };
      });
    }, Math.max(100, 800 - (gameState.level - 1) * 100)); 
    return () => clearInterval(dropInterval);
  }, [gameState.status, gameState.level, checkCollision, playDrop, playClear, playGameOver]);

  const ghostY = useMemo(() => (gameState.status === 'PLAYING' ? getGhostY() : 0), [gameState.status, getGhostY]);

  return (
    <div className="w-screen h-screen bg-[#010101] overflow-hidden font-sans select-none text-white touch-none">
      
      {/* --- HUD --- */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-4 md:p-10">
        <div className="flex justify-between items-start pointer-events-auto">
            <div className="bg-cyan-500/10 backdrop-blur-md border border-cyan-500/20 p-3 md:p-5 px-5 md:px-8 rounded-2xl md:rounded-3xl">
                <p className="text-[8px] md:text-[10px] uppercase font-black text-cyan-400 tracking-widest">LVL</p>
                <p className="text-xl md:text-4xl font-mono font-black">{gameState.level}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-3 md:p-5 px-5 md:px-10 rounded-2xl md:rounded-3xl text-right">
                <p className="text-[8px] md:text-[10px] uppercase font-bold text-white/30 tracking-widest">SCORE</p>
                <p className="text-xl md:text-4xl font-mono font-black">{gameState.score}</p>
            </div>
        </div>

        {/* HUD Bawah: Pause Button & Ghost Assist */}
        <div className="flex justify-between items-end pointer-events-auto">
            <button 
              onTouchStart={() => setGameState(p => ({...p, status: 'PAUSED'}))}
              className="md:hidden w-12 h-12 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center font-bold text-xs"
            >
              ESC
            </button>
            <div className="hidden md:block bg-black/60 backdrop-blur-md border border-white/5 p-4 rounded-xl">
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px] font-bold font-mono text-white/40 italic">
                    <span>CAM ROTATE</span> <span className="text-white text-right font-normal">A / D</span>
                    <span>MOVE PIECE</span> <span className="text-white text-right font-normal">← → ↓</span>
                </div>
            </div>
            {gameState.level <= 2 && gameState.status === 'PLAYING' && <div className="text-cyan-400/30 text-[9px] font-mono animate-pulse uppercase">Ghost_Assist</div>}
        </div>
      </div>

      {/* --- MOBILE CONTROLS (Hanya muncul di Mobile/Layar Kecil) --- */}
      {gameState.status === 'PLAYING' && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-end p-6 md:hidden pb-12">
           <div className="flex justify-between items-center w-full pointer-events-auto opacity-60">
              {/* Left: Camera Controls */}
              <div className="flex gap-3">
                 <button onTouchStart={() => handleAction('CAM_LEFT')} className="w-14 h-14 bg-white/10 rounded-full border border-white/10 flex items-center justify-center text-xl">A</button>
                 <button onTouchStart={() => handleAction('CAM_RIGHT')} className="w-14 h-14 bg-white/10 rounded-full border border-white/10 flex items-center justify-center text-xl">D</button>
              </div>
              {/* Right: Movement Controls */}
              <div className="grid grid-cols-3 gap-2">
                 <div />
                 <button onTouchStart={() => handleAction('ROTATE')} className="w-14 h-14 bg-cyan-500/40 rounded-full border border-cyan-400/20 flex items-center justify-center text-xl font-bold">↑</button>
                 <div />
                 <button onTouchStart={() => handleAction('MOVE_LEFT')} className="w-14 h-14 bg-white/10 rounded-full border border-white/10 flex items-center justify-center text-xl">←</button>
                 <button onTouchStart={() => handleAction('MOVE_DOWN')} className="w-14 h-14 bg-white/10 rounded-full border border-white/10 flex items-center justify-center text-xl">↓</button>
                 <button onTouchStart={() => handleAction('MOVE_RIGHT')} className="w-14 h-14 bg-white/10 rounded-full border border-white/10 flex items-center justify-center text-xl">→</button>
              </div>
           </div>
        </div>
      )}

      {/* --- MENU OVERLAYS --- */}
      {gameState.status === 'MENU' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
           <div className="text-center">
              <h1 className="text-6xl md:text-[10rem] font-black italic tracking-tighter leading-none text-white drop-shadow-[0_0_30px_rgba(6,182,212,0.4)]">TET3D</h1>
              <p className="text-cyan-400 tracking-[0.5em] font-bold text-[10px] md:text-xs mt-4 mb-10 md:mb-20 uppercase opacity-60">Programmer Ngawi ~ Code RV</p>
              <button onClick={resetGame} className="bg-white text-black font-black px-12 md:px-24 py-4 md:py-6 rounded-full text-lg md:text-xl tracking-widest uppercase transition-all shadow-2xl">Start Game</button>
           </div>
        </div>
      )}

      {gameState.status === 'PAUSED' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-xl px-4">
           <div className="text-center p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] bg-[#080808] border border-white/10 w-full max-w-sm">
              <h2 className="text-white text-4xl md:text-5xl font-black mb-6 md:mb-10 italic uppercase tracking-tighter">Paused</h2>
              <div className="mb-6 md:mb-10 flex flex-wrap justify-center gap-2">
                    {TRACKS.map((_, i) => (
                        <button key={i} onClick={() => setTrackIndex(i)} className={`px-4 py-2 rounded-lg border font-mono text-[10px] ${trackIndex === i ? 'bg-cyan-500 text-black font-bold' : 'bg-white/5 border-white/10 text-white/50'}`}>T0{i+1}</button>
                    ))}
              </div>
              <div className="flex flex-col gap-3">
                  <button onClick={() => setGameState(p => ({...p, status: 'PLAYING'}))} className="bg-white text-black font-black py-4 rounded-xl uppercase tracking-widest">Resume</button>
                  <button onClick={resetGame} className="bg-white/5 text-white font-bold py-4 rounded-xl border border-white/10 uppercase text-xs">Restart</button>
                  <button onClick={() => setGameState(p => ({...p, status: 'MENU'}))} className="text-white/20 font-bold py-4 uppercase text-[9px] tracking-widest">Main Menu</button>
              </div>
           </div>
        </div>
      )}

      {/* GAME OVER */}
      {gameState.status === 'GAMEOVER' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-3xl px-6">
           <div className="text-center p-10 md:p-16 rounded-[3rem] md:rounded-[5rem] bg-[#000] border border-red-500/30 w-full max-w-md">
              <h2 className="text-red-600 text-5xl md:text-7xl font-black mb-6 md:mb-10 italic uppercase tracking-tighter">Bruh Gagal</h2>
              <div className="mb-10 md:mb-14">
                <p className="text-white text-6xl md:text-8xl font-mono font-black">{gameState.score}</p>
              </div>
              <div className="flex flex-col gap-3 px-4">
                  <button onClick={resetGame} className="bg-red-600 text-white font-black py-4 md:py-5 rounded-2xl md:rounded-3xl uppercase tracking-widest">Retry</button>
                  <button onClick={() => setGameState(p => ({...p, status: 'MENU'}))} className="text-white/40 py-4 uppercase text-[10px] tracking-widest">Exit</button>
              </div>
           </div>
        </div>
      )}

      {/* --- 3D SCENE --- */}
      <Canvas camera={{ position: [0, 0, 30], fov: 50 }}>
        <color attach="background" args={['#010101']} />
        <Stars radius={100} depth={50} count={6000} factor={6} saturation={0} fade speed={2} />
        <ambientLight intensity={0.4} />
        <pointLight position={[15, 15, 15]} intensity={2.5} color="#00f2ff" />
        <pointLight position={[-15, 10, -15]} intensity={1.5} color="#ff0044" />
        
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[COLS_PER_SIDE, ROWS, COLS_PER_SIDE]} />
          <meshStandardMaterial color="#050505" metalness={0.9} roughness={0.1} />
          <Edges scale={1} threshold={15} color="#111" />
        </mesh>

        <CameraRig side={cameraSide} isMenu={gameState.status === 'MENU'} />
        
        {gameState.board.map((row, y) => row.map((color, x) => color && <Block key={`b-${x}-${y}`} gridX={x} gridY={y} color={color} />))}

        {gameState.status === 'PLAYING' && gameState.activePiece?.shape.map((b, i) => (
            <Block key={`a-${i}`} gridX={(gameState.activePiece.x + b.x + TOTAL_COLS) % TOTAL_COLS} gridY={gameState.activePiece.y + b.y} color={gameState.activePiece.color} />
        ))}

        {gameState.status === 'PLAYING' && gameState.level <= 2 && gameState.activePiece?.shape.map((b, i) => {
            const absX = (gameState.activePiece.x + b.x + TOTAL_COLS) % TOTAL_COLS;
            const absY = ghostY + b.y;
            if (absY === gameState.activePiece.y + b.y) return null;
            return <Block key={`g-${i}`} gridX={absX} gridY={absY} color={gameState.activePiece.color} opacity={0.15} />;
        })}

        {explosions.map(exp => <Explosion key={exp.id} gridY={exp.y} />)}
      </Canvas>
    </div>
  );
}