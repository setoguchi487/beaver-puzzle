import React, { useState, useEffect, useRef } from 'react';
import type { PieceType, SpecialType, PuzzleStage, TileGimmick } from '../../types';
import { PIECE_CONFIG } from '../../data/masterData';
import { sounds } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';
import { RefreshCw, X, ArrowLeft, Trophy, Volume2, VolumeX } from 'lucide-react';
import { DevStageSelector } from '../common/DevStageSelector';

interface Tile {
  id: string;
  type: PieceType;
  special: SpecialType;
  gimmick?: TileGimmick;
}

interface Match3BoardProps {
  stage: PuzzleStage;
  onStageClear: (rewardWood: number, unfogAreaIds: string[]) => void;
  onExit: () => void;
  currentStageId?: number;
  onSelectStage?: (stageId: number) => void;
  onAddWood?: (amount: number) => void;
  onUnlockAllAreas?: () => void;
  onResetAll?: () => void;
}

const BOARD_SIZE = 7;
const PIECE_TYPES: PieceType[] = ['wood', 'twig', 'water', 'acorn', 'stone'];

export const Match3Board: React.FC<Match3BoardProps> = ({
  stage,
  onStageClear,
  onExit,
  currentStageId,
  onSelectStage,
  onAddWood,
  onUnlockAllAreas,
  onResetAll,
}) => {
  const [board, setBoard] = useState<Tile[][]>([]);
  const [selectedPos, setSelectedPos] = useState<{ r: number; c: number } | null>(null);
  const [movesLeft, setMovesLeft] = useState<number>(stage.maxMoves);
  const [targets, setTargets] = useState<{ [key: string]: { required: number; current: number } }>(() => {
    const map: { [key: string]: { required: number; current: number } } = {};
    stage.targets.forEach((t) => {
      map[t.type] = { required: t.required, current: 0 };
    });
    return map;
  });

  const [isAnimating, setIsAnimating] = useState(false);
  const [gameResult, setGameResult] = useState<'playing' | 'cleared' | 'failed'>('playing');
  const [comboToast, setComboToast] = useState<string | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [introDismissed, setIntroDismissed] = useState<boolean>(!stage.newGimmickIntro);

  const touchStartRef = useRef<{ x: number; y: number; r: number; c: number } | null>(null);

  useEffect(() => {
    initBoard();
    setIntroDismissed(!stage.newGimmickIntro);
  }, [stage]);

  const initBoard = () => {
    let newBoard: Tile[][];
    let attempts = 0;
    do {
      newBoard = generateValidBoard();
      attempts++;
    } while (!hasPossibleMoves(newBoard) && attempts < 10);

    // ステージ初期ギミックの適用
    if (stage.initialGimmicks) {
      stage.initialGimmicks.forEach((g) => {
        if (g.r >= 0 && g.r < BOARD_SIZE && g.c >= 0 && g.c < BOARD_SIZE) {
          newBoard[g.r][g.c].gimmick = { type: g.type, hp: g.hp };
        }
      });
    }

    setBoard(newBoard);
    setMovesLeft(stage.maxMoves);
    setGameResult('playing');
    setSelectedPos(null);
    setComboToast(null);

    const map: { [key: string]: { required: number; current: number } } = {};
    stage.targets.forEach((t) => {
      map[t.type] = { required: t.required, current: 0 };
    });
    setTargets(map);
  };

  const generateValidBoard = (): Tile[][] => {
    const newBoard: Tile[][] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      newBoard[r] = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        let type: PieceType;
        do {
          type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
        } while (
          (r >= 2 && newBoard[r - 1][c].type === type && newBoard[r - 2][c].type === type) ||
          (c >= 2 && newBoard[r][c - 1].type === type && newBoard[r][c - 2].type === type)
        );
        newBoard[r][c] = {
          id: `tile-${r}-${c}-${Date.now()}-${Math.random()}`,
          type,
          special: 'none',
        };
      }
    }
    return newBoard;
  };

  // 有効な動かせる手があるか
  const hasPossibleMoves = (b: Tile[][]): boolean => {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        // ツタや岩は動かせない
        if (b[r][c].gimmick?.type === 'vine' || b[r][c].gimmick?.type === 'rock') continue;

        if (c < BOARD_SIZE - 1 && b[r][c + 1].gimmick?.type !== 'vine' && b[r][c + 1].gimmick?.type !== 'rock') {
          const testBoard = b.map((row) => [...row]);
          const temp = testBoard[r][c];
          testBoard[r][c] = testBoard[r][c + 1];
          testBoard[r][c + 1] = temp;
          if (findMatches(testBoard).length > 0) return true;
        }
        if (r < BOARD_SIZE - 1 && b[r + 1][c].gimmick?.type !== 'vine' && b[r + 1][c].gimmick?.type !== 'rock') {
          const testBoard = b.map((row) => [...row]);
          const temp = testBoard[r][c];
          testBoard[r][c] = testBoard[r + 1][c];
          testBoard[r + 1][c] = temp;
          if (findMatches(testBoard).length > 0) return true;
        }
      }
    }
    return false;
  };

  // 自動シャッフル
  const performShuffle = () => {
    setIsShuffling(true);
    setTimeout(() => {
      let shuffled: Tile[][];
      do {
        shuffled = generateValidBoard();
      } while (!hasPossibleMoves(shuffled));

      // 既存のギミックは引き継ぐ
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (board[r][c].gimmick) {
            shuffled[r][c].gimmick = board[r][c].gimmick;
          }
        }
      }

      setBoard(shuffled);
      setIsShuffling(false);
    }, 800);
  };

  // スワイプ検出
  const handleTouchStart = (r: number, c: number, e: React.TouchEvent) => {
    if (isAnimating || gameResult !== 'playing' || !introDismissed) return;
    const tile = board[r][c];
    // ツタや岩はスワイプ不可
    if (tile.gimmick?.type === 'vine' || tile.gimmick?.type === 'rock') return;

    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, r, c };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isAnimating || gameResult !== 'playing') return;

    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const threshold = 25;

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      const { r, c } = touchStartRef.current;
      touchStartRef.current = null;

      let targetR = r;
      let targetC = c;

      if (Math.abs(dx) > Math.abs(dy)) {
        targetC = dx > 0 ? c + 1 : c - 1;
      } else {
        targetR = dy > 0 ? r + 1 : r - 1;
      }

      if (targetR >= 0 && targetR < BOARD_SIZE && targetC >= 0 && targetC < BOARD_SIZE) {
        const dest = board[targetR][targetC];
        // 移動先がツタや岩ならスワイプ無効
        if (dest.gimmick?.type === 'vine' || dest.gimmick?.type === 'rock') return;

        sounds.playSwipe();
        swapTiles(r, c, targetR, targetC);
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  const handleTileClick = (r: number, c: number) => {
    if (isAnimating || gameResult !== 'playing' || !introDismissed) return;
    const tile = board[r][c];
    if (tile.gimmick?.type === 'vine' || tile.gimmick?.type === 'rock') return;

    if (!selectedPos) {
      sounds.playSwipe();
      setSelectedPos({ r, c });
    } else {
      const dr = Math.abs(selectedPos.r - r);
      const dc = Math.abs(selectedPos.c - c);

      if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        sounds.playSwipe();
        swapTiles(selectedPos.r, selectedPos.c, r, c);
        setSelectedPos(null);
      } else {
        sounds.playSwipe();
        setSelectedPos({ r, c });
      }
    }
  };

  const swapTiles = async (r1: number, c1: number, r2: number, c2: number) => {
    setIsAnimating(true);

    const newBoard = board.map((row) => [...row]);
    const temp = newBoard[r1][c1];
    newBoard[r1][c1] = newBoard[r2][c2];
    newBoard[r2][c2] = temp;

    if (temp.special === 'rainbow' || newBoard[r1][c1].special === 'rainbow') {
      sounds.playRainbow();
      const targetType = temp.special === 'rainbow' ? newBoard[r1][c1].type : temp.type;
      await executeRainbowClear(newBoard, targetType);
      finishMove();
      return;
    }

    const matches = findMatches(newBoard);

    if (matches.length > 0) {
      setBoard(newBoard);
      await processMatches(newBoard, matches, 1);
      finishMove();
    } else {
      setBoard(board);
      setIsAnimating(false);
    }
  };

  const finishMove = () => {
    const nextMoves = movesLeft - 1;
    setMovesLeft(nextMoves);

    setTimeout(() => {
      checkGameStatus(nextMoves);
      setIsAnimating(false);

      if (!hasPossibleMoves(board) && nextMoves > 0) {
        performShuffle();
      }
    }, 400);
  };

  const checkGameStatus = (moves: number) => {
    let allDone = true;
    Object.values(targets).forEach((t) => {
      if (t && t.current < t.required) {
        allDone = false;
      }
    });

    if (allDone) {
      setGameResult('cleared');
      sounds.playStageClear();
      triggerConfetti();
    } else if (moves <= 0) {
      setGameResult('failed');
    }
  };

  const findMatches = (b: Tile[][]): { r: number; c: number }[] => {
    const matchedCoords = new Set<string>();

    // 横
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE - 2; c++) {
        // 岩はマッチに含めない
        if (b[r][c].gimmick?.type === 'rock' || b[r][c + 1].gimmick?.type === 'rock' || b[r][c + 2].gimmick?.type === 'rock') continue;

        const type = b[r][c].type;
        if (type === b[r][c + 1].type && type === b[r][c + 2].type) {
          let endC = c + 2;
          while (endC + 1 < BOARD_SIZE && b[r][endC + 1].type === type && b[r][endC + 1].gimmick?.type !== 'rock') endC++;
          for (let i = c; i <= endC; i++) matchedCoords.add(`${r},${i}`);
        }
      }
    }

    // 縦
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (let r = 0; r < BOARD_SIZE - 2; r++) {
        if (b[r][c].gimmick?.type === 'rock' || b[r + 1][c].gimmick?.type === 'rock' || b[r + 2][c].gimmick?.type === 'rock') continue;

        const type = b[r][c].type;
        if (type === b[r + 1][c].type && type === b[r + 2][c].type) {
          let endR = r + 2;
          while (endR + 1 < BOARD_SIZE && b[endR + 1][c].type === type && b[endR + 1][c].gimmick?.type !== 'rock') endR++;
          for (let i = r; i <= endR; i++) matchedCoords.add(`${i},${c}`);
        }
      }
    }

    return Array.from(matchedCoords).map((coord) => {
      const [r, c] = coord.split(',').map(Number);
      return { r, c };
    });
  };

  // マッチ消去＆隣接ギミック破壊処理
  const processMatches = async (b: Tile[][], matches: { r: number; c: number }[], currentCombo: number) => {
    if (currentCombo >= 2) {
      const messages = ['Good! ✨', 'Great! 🪵', 'Awesome! 👑', 'Unbelievable!! 🔥'];
      const msg = messages[Math.min(messages.length - 1, currentCombo - 2)];
      setComboToast(`${msg} (${currentCombo} Combo!)`);
      setTimeout(() => setComboToast(null), 1000);
    }

    const hasWater = matches.some(({ r, c }) => b[r][c].type === 'water');
    if (hasWater) {
      sounds.playWaterMatch();
    } else {
      sounds.playWoodMatch(currentCombo);
    }

    const newBoard = b.map((row) => [...row]);
    const collectedCounts: { [key: string]: number } = {};

    matches.forEach(({ r, c }) => {
      const type = b[r][c].type;
      collectedCounts[type] = (collectedCounts[type] || 0) + 1;

      // もしマッチしたタイル自身にツタが絡まっていたらツタ解除！
      if (newBoard[r][c].gimmick?.type === 'vine') {
        newBoard[r][c].gimmick = undefined;
        sounds.playVineCut();
        collectedCounts['vine'] = (collectedCounts['vine'] || 0) + 1;
      }
    });

    // 隣接マスのギミック（氷・岩）破壊判定
    const adjacentDirs = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 },
    ];

    const damagedGimmicks = new Set<string>();

    matches.forEach(({ r, c }) => {
      adjacentDirs.forEach(({ dr, dc }) => {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
          const key = `${nr},${nc}`;
          if (!damagedGimmicks.has(key)) {
            damagedGimmicks.add(key);
            const targetTile = newBoard[nr][nc];

            if (targetTile.gimmick) {
              const g = targetTile.gimmick;
              if (g.type === 'ice') {
                g.hp -= 1;
                if (g.hp <= 0) {
                  targetTile.gimmick = undefined; // 氷完全破壊！
                  sounds.playIceBreak();
                  collectedCounts['ice'] = (collectedCounts['ice'] || 0) + 1;
                } else {
                  sounds.playIceCrack();
                }
              } else if (g.type === 'rock') {
                g.hp -= 1;
                if (g.hp <= 0) {
                  targetTile.gimmick = undefined; // 岩完全粉砕！
                  targetTile.id = ''; // 空マスにして落下させる
                  sounds.playRockBreak();
                  collectedCounts['rock'] = (collectedCounts['rock'] || 0) + 1;
                } else {
                  sounds.playRockBreak();
                }
              }
            }
          }
        }
      });
    });

    // ターゲット加算
    setTargets((prev) => {
      const updated = { ...prev };
      Object.entries(collectedCounts).forEach(([t, count]) => {
        if (updated[t]) {
          updated[t] = {
            ...updated[t],
            current: Math.min(updated[t].required, updated[t].current + count),
          };
        }
      });
      return updated;
    });

    // 消去と特殊ピース生成
    const matchCount = matches.length;
    matches.forEach(({ r, c }, idx) => {
      if (idx === 0 && matchCount >= 5) {
        newBoard[r][c] = { id: `special-${Date.now()}`, type: 'acorn', special: 'rainbow' };
        sounds.playRainbow();
      } else if (idx === 0 && matchCount === 4) {
        newBoard[r][c] = { id: `special-${Date.now()}`, type: newBoard[r][c].type, special: 'rocket_h' };
        sounds.playRocket();
      } else {
        newBoard[r][c] = { id: '', type: 'wood', special: 'none' };
      }
    });

    // 重力落下（岩は固定で落ちない）
    for (let c = 0; c < BOARD_SIZE; c++) {
      let emptyRow = BOARD_SIZE - 1;
      for (let r = BOARD_SIZE - 1; r >= 0; r--) {
        if (newBoard[r][c].id !== '') {
          if (emptyRow !== r) {
            newBoard[emptyRow][c] = newBoard[r][c];
            newBoard[r][c] = { id: '', type: 'wood', special: 'none' };
          }
          emptyRow--;
        }
      }
      for (let r = emptyRow; r >= 0; r--) {
        const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
        newBoard[r][c] = {
          id: `new-${r}-${c}-${Date.now()}-${Math.random()}`,
          type,
          special: 'none' as SpecialType,
        };
      }
    }

    setBoard(newBoard);

    await new Promise((res) => setTimeout(res, 240));
    const nextMatches = findMatches(newBoard);
    if (nextMatches.length > 0) {
      await processMatches(newBoard, nextMatches, currentCombo + 1);
    }
  };

  const executeRainbowClear = async (b: Tile[][], targetType: PieceType) => {
    let count = 0;
    const newBoard: Tile[][] = b.map((row) =>
      row.map((tile) => {
        if (tile.type === targetType || tile.special === 'rainbow') {
          count++;
          return { id: '', type: 'wood' as PieceType, special: 'none' as SpecialType };
        }
        return tile;
      })
    );

    setTargets((prev) => {
      const updated = { ...prev };
      if (updated[targetType]) {
        updated[targetType] = {
          ...updated[targetType],
          current: Math.min(updated[targetType].required, updated[targetType].current + count),
        };
      }
      return updated;
    });

    for (let c = 0; c < BOARD_SIZE; c++) {
      let emptyRow = BOARD_SIZE - 1;
      for (let r = BOARD_SIZE - 1; r >= 0; r--) {
        if (newBoard[r][c].id !== '') {
          if (emptyRow !== r) {
            newBoard[emptyRow][c] = newBoard[r][c];
            newBoard[r][c] = { id: '', type: 'wood' as PieceType, special: 'none' as SpecialType };
          }
          emptyRow--;
        }
      }
      for (let r = emptyRow; r >= 0; r--) {
        const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
        newBoard[r][c] = {
          id: `new-rb-${r}-${c}-${Date.now()}`,
          type,
          special: 'none' as SpecialType,
        };
      }
    }
    setBoard(newBoard);
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#EC4899'],
      });
    } catch {
      // ignore
    }
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-slate-950 text-white max-w-md mx-auto p-4 select-none relative">
      {/* 新ギミック紹介ポップアップ */}
      {!introDismissed && stage.newGimmickIntro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-cyan-400 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <span className="text-6xl inline-block drop-shadow-md animate-bounce-subtle">
              {stage.newGimmickIntro.icon}
            </span>
            <div>
              <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-950 px-2.5 py-0.5 rounded-full border border-cyan-500/40">
                NEW GIMMICK!
              </span>
              <h3 className="text-lg font-black text-white mt-1.5">
                {stage.newGimmickIntro.title}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/80 p-3 rounded-2xl border border-slate-700">
              {stage.newGimmickIntro.description}
            </p>
            <button
              onClick={() => setIntroDismissed(true)}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs rounded-xl shadow-md active:scale-98 transition-transform"
            >
              挑戦する！ 🎮
            </button>
          </div>
        </div>
      )}

      {/* 上部ヘッダー */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800">
        <button
          onClick={onExit}
          className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-900 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-sm font-black text-amber-400 tracking-wide">
            {stage.title}
          </h2>
          <span className="text-[10px] text-slate-400">
            クリア報酬: 🪵 +{stage.woodReward} ウッド
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          {onSelectStage && onAddWood && onUnlockAllAreas && (
            <DevStageSelector
              currentStageId={currentStageId || stage.id}
              onSelectStage={onSelectStage}
              onAddWood={onAddWood}
              onUnlockAllAreas={onUnlockAllAreas}
              onResetAll={onResetAll}
            />
          )}
          <button
            onClick={handleToggleMute}
            title={isMuted ? 'ミュート解除' : 'ミュート'}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-900 active:scale-95 transition-transform"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={initBoard}
            title="リスタート"
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-900 active:scale-95 transition-transform"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 目標素材カウンター＆残り手数 */}
      <div className="w-full grid grid-cols-3 gap-2 my-2.5">
        <div className="p-2.5 bg-gradient-to-b from-amber-500/20 to-amber-600/10 border border-amber-500/40 rounded-2xl text-center">
          <div className="text-[9px] font-bold text-amber-300 uppercase">残り手数</div>
          <div className="text-2xl font-black text-amber-400">{movesLeft}</div>
        </div>

        <div className="col-span-2 flex items-center justify-around p-2 bg-slate-900/90 border border-slate-800 rounded-2xl">
          {stage.targets.map((t) => {
            const current = targets[t.type]?.current || 0;
            const isDone = current >= t.required;
            const icon =
              t.type === 'ice' ? '🧊' : t.type === 'rock' ? '🪨' : t.type === 'vine' ? '🌿' : PIECE_CONFIG[t.type]?.icon || '🪵';
            const label =
              t.type === 'ice' ? '氷' : t.type === 'rock' ? '岩' : t.type === 'vine' ? 'ツタ' : PIECE_CONFIG[t.type]?.label || '素材';

            return (
              <div key={t.type} className="flex items-center space-x-1.5">
                <span className="text-2xl">{icon}</span>
                <div className="text-left">
                  <div className="text-[10px] text-slate-400">{label}</div>
                  <div className={`text-xs font-black ${isDone ? 'text-emerald-400' : 'text-white'}`}>
                    {current} / {t.required} {isDone && '✓'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* コンボポップアップ */}
      {comboToast && (
        <div className="absolute top-28 z-40 bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black text-xs px-4 py-1.5 rounded-full shadow-xl animate-bounce-subtle">
          {comboToast}
        </div>
      )}

      {/* シャッフル中 */}
      {isShuffling && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-slate-900 border border-amber-400 px-4 py-2 rounded-2xl text-amber-300 font-black text-xs animate-pulse">
            手詰まり検知！盤面をシャッフル中…🔀
          </div>
        </div>
      )}

      {/* パズル盤面 (7x7) */}
      <div className="relative p-2.5 bg-slate-900/90 rounded-3xl border-2 border-slate-800 shadow-2xl backdrop-blur-md touch-none">
        <div className="grid grid-cols-7 gap-1.5">
          {board.map((row, r) =>
            row.map((tile, c) => {
              const isSelected = selectedPos?.r === r && selectedPos?.c === c;
              const config = PIECE_CONFIG[tile.type] || PIECE_CONFIG.wood;
              const gimmick = tile.gimmick;

              return (
                <div
                  key={tile.id || `${r}-${c}`}
                  onTouchStart={(e) => handleTouchStart(r, c, e)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => handleTileClick(r, c)}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-2xl font-bold cursor-pointer transition-all duration-150 transform active:scale-95 relative overflow-hidden ${
                    isSelected
                      ? 'bg-amber-400/40 ring-4 ring-amber-400 scale-105 z-10'
                      : gimmick?.type === 'rock'
                      ? 'bg-slate-800 border-2 border-slate-600 shadow-inner'
                      : 'bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 shadow-inner'
                  }`}
                >
                  {/* メインピース */}
                  {gimmick?.type === 'rock' ? (
                    <span className="text-2xl drop-shadow-md">🪨</span>
                  ) : tile.special === 'rainbow' ? (
                    <span className="animate-spin-slow">🌈</span>
                  ) : tile.special === 'rocket_h' ? (
                    <span>🚀</span>
                  ) : (
                    <span className="drop-shadow-sm select-none">{config.icon}</span>
                  )}

                  {/* ギミック① 氷ブロックオーバーレイ */}
                  {gimmick?.type === 'ice' && (
                    <div className="absolute inset-0 bg-cyan-400/35 backdrop-blur-2xs border-2 border-cyan-300/80 rounded-xl flex items-center justify-center pointer-events-none">
                      {gimmick.hp === 1 ? (
                        <span className="text-xs text-white drop-shadow-sm font-black">⚡️ヒビ</span>
                      ) : (
                        <span className="text-sm opacity-80">🧊</span>
                      )}
                    </div>
                  )}

                  {/* ギミック③ ツタオーバーレイ */}
                  {gimmick?.type === 'vine' && (
                    <div className="absolute inset-0 border-2 border-dashed border-emerald-500 bg-emerald-950/30 rounded-xl flex items-center justify-center pointer-events-none">
                      <span className="text-xs text-emerald-300 drop-shadow-sm font-black absolute bottom-0 right-0 p-0.5">🌿</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 下部ひとこと説明 */}
      <div className="text-center text-[11px] text-slate-400 my-2">
        {stage.newGimmickIntro ? stage.newGimmickIntro.description : '指でスワイプして入れ替え！同じ素材を3つ揃えよう🪵'}
      </div>

      {/* ステージクリアモーダル */}
      {gameResult === 'cleared' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-gradient-to-b from-amber-950/90 via-slate-900 to-slate-950 border-2 border-amber-400 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="inline-flex p-3 bg-amber-500 text-amber-950 rounded-3xl animate-bounce-subtle">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest bg-amber-500/20 px-2.5 py-0.5 rounded-full">
                STAGE CLEAR!
              </span>
              <h3 className="text-xl font-black text-white mt-2">
                パズル大成功！🎉
              </h3>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-around">
              <div className="text-center">
                <span className="text-2xl">🪵</span>
                <div className="text-xs font-black text-amber-300">+{stage.woodReward} ウッド</div>
              </div>
              <div className="text-center">
                <span className="text-2xl">🌫️➡️✨</span>
                <div className="text-xs font-black text-cyan-300">新しい霧が晴れた！</div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              手に入れた木材を使って、霧が晴れたエリアを開拓しよう！
            </p>

            <button
              onClick={() => onStageClear(stage.woodReward, stage.unfogAreaIds)}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-amber-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-500/30 active:scale-98 transition-transform"
            >
              開拓マップへ進む！ 🚀
            </button>
          </div>
        </div>
      )}

      {/* ゲームオーバーモーダル */}
      {gameResult === 'failed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="inline-flex p-3 bg-rose-500/20 text-rose-500 rounded-3xl">
              <X className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-black text-white">
              手数が足りなくなりました…
            </h3>
            <p className="text-xs text-slate-400">
              あと少し！もう一度チャレンジして木材を手に入れよう！
            </p>

            <div className="flex space-x-2">
              <button
                onClick={onExit}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                マップへ戻る
              </button>
              <button
                onClick={initBoard}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-xs rounded-xl shadow-md"
              >
                もう一回挑戦！
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
