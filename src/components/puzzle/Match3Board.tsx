import React, { useState, useEffect } from 'react';
import type { PieceType, SpecialType, PuzzleStage } from '../../types';
import { PIECE_CONFIG } from '../../data/masterData';
import confetti from 'canvas-confetti';
import { RefreshCw, X, ArrowLeft, Trophy } from 'lucide-react';

interface Tile {
  id: string;
  type: PieceType;
  special: SpecialType;
}

interface Match3BoardProps {
  stage: PuzzleStage;
  onStageClear: (rewardWood: number, unfogAreaIds: string[]) => void;
  onExit: () => void;
}

const BOARD_SIZE = 7;
const PIECE_TYPES: PieceType[] = ['wood', 'twig', 'water', 'acorn', 'stone'];

export const Match3Board: React.FC<Match3BoardProps> = ({
  stage,
  onStageClear,
  onExit,
}) => {
  const [board, setBoard] = useState<Tile[][]>([]);
  const [selectedPos, setSelectedPos] = useState<{ r: number; c: number } | null>(null);
  const [movesLeft, setMovesLeft] = useState<number>(stage.maxMoves);
  const [targets, setTargets] = useState<{ [key in PieceType]?: { required: number; current: number } }>(() => {
    const map: { [key in PieceType]?: { required: number; current: number } } = {};
    stage.targets.forEach((t) => {
      map[t.type] = { required: t.required, current: 0 };
    });
    return map;
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [gameResult, setGameResult] = useState<'playing' | 'cleared' | 'failed'>('playing');

  // 初期盤面生成（3連が最初から発生しないように生成）
  useEffect(() => {
    initBoard();
  }, [stage]);

  const initBoard = () => {
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
    setBoard(newBoard);
    setMovesLeft(stage.maxMoves);
    setGameResult('playing');
    setSelectedPos(null);
  };

  // タップ処理
  const handleTileClick = (r: number, c: number) => {
    if (isAnimating || gameResult !== 'playing') return;

    if (!selectedPos) {
      setSelectedPos({ r, c });
    } else {
      // 隣接判定
      const dr = Math.abs(selectedPos.r - r);
      const dc = Math.abs(selectedPos.c - c);

      if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        // 隣接しているのでスワップ試行
        swapTiles(selectedPos.r, selectedPos.c, r, c);
        setSelectedPos(null);
      } else {
        // 離れたマスをタップしたら再選択
        setSelectedPos({ r, c });
      }
    }
  };

  // タイルのスワップとマッチ検証
  const swapTiles = async (r1: number, c1: number, r2: number, c2: number) => {
    setIsAnimating(true);

    const newBoard = board.map((row) => [...row]);
    const temp = newBoard[r1][c1];
    newBoard[r1][c1] = newBoard[r2][c2];
    newBoard[r2][c2] = temp;

    // レインボーどんぐり特殊処理
    if (temp.special === 'rainbow' || newBoard[r1][c1].special === 'rainbow') {
      const targetType = temp.special === 'rainbow' ? newBoard[r1][c1].type : temp.type;
      await executeRainbowClear(newBoard, targetType);
      finishMove();
      return;
    }

    const matches = findMatches(newBoard);

    if (matches.length > 0) {
      setBoard(newBoard);
      await processMatches(newBoard, matches);
      finishMove();
    } else {
      // マッチしなければ元に戻す（バウンスバック）
      setBoard(board);
      setIsAnimating(false);
    }
  };

  const finishMove = () => {
    const nextMoves = movesLeft - 1;
    setMovesLeft(nextMoves);

    // 勝利判定
    setTimeout(() => {
      checkGameStatus(nextMoves);
      setIsAnimating(false);
    }, 400);
  };

  const checkGameStatus = (moves: number) => {
    // 全ターゲットが達成されたか？
    let allDone = true;
    Object.values(targets).forEach((t) => {
      if (t && t.current < t.required) {
        allDone = false;
      }
    });

    if (allDone) {
      setGameResult('cleared');
      triggerConfetti();
    } else if (moves <= 0) {
      setGameResult('failed');
    }
  };

  // マッチの検出
  const findMatches = (b: Tile[][]): { r: number; c: number }[] => {
    const matchedCoords = new Set<string>();

    // 横チェック
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE - 2; c++) {
        const type = b[r][c].type;
        if (type === b[r][c + 1].type && type === b[r][c + 2].type) {
          let endC = c + 2;
          while (endC + 1 < BOARD_SIZE && b[r][endC + 1].type === type) {
            endC++;
          }
          for (let i = c; i <= endC; i++) {
            matchedCoords.add(`${r},${i}`);
          }
        }
      }
    }

    // 縦チェック
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (let r = 0; r < BOARD_SIZE - 2; r++) {
        const type = b[r][c].type;
        if (type === b[r + 1][c].type && type === b[r + 2][c].type) {
          let endR = r + 2;
          while (endR + 1 < BOARD_SIZE && b[endR + 1][c].type === type) {
            endR++;
          }
          for (let i = r; i <= endR; i++) {
            matchedCoords.add(`${i},${c}`);
          }
        }
      }
    }

    return Array.from(matchedCoords).map((coord) => {
      const [r, c] = coord.split(',').map(Number);
      return { r, c };
    });
  };

  // マッチの消去と重力落下処理
  const processMatches = async (b: Tile[][], matches: { r: number; c: number }[]) => {
    const collectedCounts: { [key in PieceType]?: number } = {};

    matches.forEach(({ r, c }) => {
      const type = b[r][c].type;
      collectedCounts[type] = (collectedCounts[type] || 0) + 1;
    });

    // ターゲット加算
    setTargets((prev) => {
      const updated = { ...prev };
      Object.entries(collectedCounts).forEach(([t, count]) => {
        const pType = t as PieceType;
        if (updated[pType]) {
          updated[pType] = {
            ...updated[pType]!,
            current: Math.min(updated[pType]!.required, updated[pType]!.current + count),
          };
        }
      });
      return updated;
    });

    // 消去と特殊ピース生成判定（4つならロケット、5つならレインボー）
    const newBoard = b.map((row) => [...row]);
    const matchCount = matches.length;

    matches.forEach(({ r, c }, idx) => {
      if (idx === 0 && matchCount >= 5) {
        newBoard[r][c] = { id: `special-${Date.now()}`, type: 'acorn', special: 'rainbow' };
      } else if (idx === 0 && matchCount === 4) {
        newBoard[r][c] = { id: `special-${Date.now()}`, type: newBoard[r][c].type, special: 'rocket_h' };
      } else {
        newBoard[r][c] = { id: '', type: 'wood', special: 'none' }; // 空マス
      }
    });

    // 重力落下
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
      // 上から補充
      for (let r = emptyRow; r >= 0; r--) {
        const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
        newBoard[r][c] = {
          id: `new-${r}-${c}-${Date.now()}-${Math.random()}`,
          type,
          special: 'none',
        };
      }
    }

    setBoard(newBoard);

    // 連鎖チェック
    await new Promise((res) => setTimeout(res, 250));
    const nextMatches = findMatches(newBoard);
    if (nextMatches.length > 0) {
      await processMatches(newBoard, nextMatches);
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
          ...updated[targetType]!,
          current: Math.min(updated[targetType]!.required, updated[targetType]!.current + count),
        };
      }
      return updated;
    });

    // 落下補充
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

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-slate-900 text-white max-w-md mx-auto p-4 select-none">
      {/* 上部ヘッダー（ステージ名、戻る、リセット） */}
      <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800">
        <button
          onClick={onExit}
          className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h2 className="text-sm font-black text-amber-400 tracking-wide">
            {stage.title}
          </h2>
          <span className="text-[10px] text-slate-400">
            報酬: 🪵 +{stage.woodReward} ウッド
          </span>
        </div>

        <button
          onClick={initBoard}
          title="リスタート"
          className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 active:scale-95 transition-transform"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* 目標素材カウンター＆残り手数 */}
      <div className="w-full grid grid-cols-3 gap-2 my-2.5">
        {/* 残り手数 */}
        <div className="p-2.5 bg-gradient-to-b from-amber-500/20 to-amber-600/10 border border-amber-500/40 rounded-2xl text-center">
          <div className="text-[9px] font-bold text-amber-300 uppercase">残り手数</div>
          <div className="text-2xl font-black text-amber-400">{movesLeft}</div>
        </div>

        {/* ターゲット目標（最大2〜3個） */}
        <div className="col-span-2 flex items-center justify-around p-2 bg-slate-800/80 border border-slate-700 rounded-2xl">
          {stage.targets.map((t) => {
            const current = targets[t.type]?.current || 0;
            const isDone = current >= t.required;
            const config = PIECE_CONFIG[t.type];

            return (
              <div key={t.type} className="flex items-center space-x-1.5">
                <span className="text-2xl">{config.icon}</span>
                <div className="text-left">
                  <div className="text-[10px] text-slate-400">{config.label}</div>
                  <div className={`text-xs font-black ${isDone ? 'text-emerald-400' : 'text-white'}`}>
                    {current} / {t.required} {isDone && '✓'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* パズル盤面 (7x7) */}
      <div className="relative p-2.5 bg-slate-800/90 rounded-3xl border-2 border-slate-700/80 shadow-2xl backdrop-blur-md">
        <div className="grid grid-cols-7 gap-1.5">
          {board.map((row, r) =>
            row.map((tile, c) => {
              const isSelected = selectedPos?.r === r && selectedPos?.c === c;
              const config = PIECE_CONFIG[tile.type] || PIECE_CONFIG.wood;

              return (
                <div
                  key={tile.id || `${r}-${c}`}
                  onClick={() => handleTileClick(r, c)}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-2xl font-bold cursor-pointer transition-all duration-150 transform active:scale-90 ${
                    isSelected
                      ? 'bg-amber-400/40 ring-4 ring-amber-400 scale-105 z-10'
                      : 'bg-slate-700/60 hover:bg-slate-700 border border-slate-600/50 shadow-inner'
                  }`}
                >
                  {tile.special === 'rainbow' ? (
                    <span className="animate-spin-slow">🌈</span>
                  ) : tile.special === 'rocket_h' ? (
                    <span>🚀</span>
                  ) : (
                    <span className="drop-shadow-sm select-none">{config.icon}</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 下部ひとこと説明 */}
      <div className="text-center text-[11px] text-slate-400 my-2">
        隣り合う素材をタップして入れ替え、3つ以上揃えて消そう！🪵
      </div>

      {/* ステージクリアモーダル */}
      {gameResult === 'cleared' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-gradient-to-b from-amber-900/90 via-slate-900 to-slate-950 border-2 border-amber-400 rounded-3xl p-6 shadow-2xl text-center space-y-4">
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
              集めた木材を使って、霧が晴れた新エリアを開拓しよう！
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

      {/* ゲームオーバー（失敗）モーダル */}
      {gameResult === 'failed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
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
