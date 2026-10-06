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
  dropDistance?: number;
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

interface SpecialCreation {
  r: number;
  c: number;
  type: PieceType;
  special: SpecialType;
}

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
  const targetsRef = useRef(targets);
  targetsRef.current = targets;

  const [isAnimating, setIsAnimating] = useState(false);
  const [gameResult, setGameResult] = useState<'playing' | 'cleared' | 'failed'>('playing');
  const [comboToast, setComboToast] = useState<string | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);

  // 特殊ピースエフェクト用ステート
  interface ActiveLaser {
    id: number;
    r?: number;
    c?: number;
    direction: 'h' | 'v';
  }
  const [activeLasers, setActiveLasers] = useState<ActiveLaser[]>([]);
  const [rainbowTargets, setRainbowTargets] = useState<{ r: number; c: number }[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [introDismissed, setIntroDismissed] = useState<boolean>(!stage.newGimmickIntro);
  const [clearingTileIds, setClearingTileIds] = useState<Set<string>>(new Set());
  const [dropVersion, setDropVersion] = useState<number>(0);
  const isMouseDownRef = useRef<boolean>(false);

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
    targetsRef.current = map;
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
  // マッチ検出および特殊ピース生成判定:
  // - 直線5個以上 ➔ 虹 (rainbow)
  // - L字/T字/交差5個以上 ➔ 爆弾 (bomb, 周囲2マス破壊)
  // - 直線横4個 ➔ 横ロケット (rocket_h)
  // - 直線縦4個 ➔ 縦ロケット (rocket_v)
  const findMatchesAndSpecials = (b: Tile[][]): {
    matches: { r: number; c: number }[];
    specialsToCreate: SpecialCreation[];
  } => {
    const matchedCoords = new Set<string>();
    const specials: SpecialCreation[] = [];

    interface LineMatch {
      r?: number;
      c?: number;
      start: number;
      len: number;
      type: PieceType;
      dir: 'h' | 'v';
    }

    const hMatches: LineMatch[] = [];
    const vMatches: LineMatch[] = [];

    // 横方向の走査（同じ行 r 内の連続同色）
    for (let r = 0; r < BOARD_SIZE; r++) {
      let c = 0;
      while (c < BOARD_SIZE - 2) {
        if (!b[r][c].id || b[r][c].gimmick?.type === 'rock') {
          c++;
          continue;
        }
        const type = b[r][c].type;
        let matchLen = 1;
        while (
          c + matchLen < BOARD_SIZE &&
          b[r][c + matchLen].id &&
          b[r][c + matchLen].type === type &&
          b[r][c + matchLen].gimmick?.type !== 'rock'
        ) {
          matchLen++;
        }

        if (matchLen >= 3) {
          hMatches.push({ r, start: c, len: matchLen, type, dir: 'h' });
          for (let i = 0; i < matchLen; i++) {
            matchedCoords.add(`${r},${c + i}`);
          }
          c += matchLen;
        } else {
          c++;
        }
      }
    }

    // 縦方向の走査（同じ列 c 内の連続同色）
    for (let c = 0; c < BOARD_SIZE; c++) {
      let r = 0;
      while (r < BOARD_SIZE - 2) {
        if (!b[r][c].id || b[r][c].gimmick?.type === 'rock') {
          r++;
          continue;
        }
        const type = b[r][c].type;
        let matchLen = 1;
        while (
          r + matchLen < BOARD_SIZE &&
          b[r + matchLen][c].id &&
          b[r + matchLen][c].type === type &&
          b[r + matchLen][c].gimmick?.type !== 'rock'
        ) {
          matchLen++;
        }

        if (matchLen >= 3) {
          vMatches.push({ c, start: r, len: matchLen, type, dir: 'v' });
          for (let i = 0; i < matchLen; i++) {
            matchedCoords.add(`${r + i},${c}`);
          }
          r += matchLen;
        } else {
          r++;
        }
      }
    }

    const hUsed = new Set<number>();
    const vUsed = new Set<number>();

    // 優先度①: 直線5個以上 ➔ 虹 (rainbow)
    hMatches.forEach((hm, hIdx) => {
      if (hm.len >= 5) {
        const midC = hm.start + Math.floor(hm.len / 2);
        specials.push({ r: hm.r!, c: midC, type: hm.type, special: 'rainbow' });
        hUsed.add(hIdx);
      }
    });
    vMatches.forEach((vm, vIdx) => {
      if (vm.len >= 5) {
        const midR = vm.start + Math.floor(vm.len / 2);
        specials.push({ r: midR, c: vm.c!, type: vm.type, special: 'rainbow' });
        vUsed.add(vIdx);
      }
    });

    // 優先度②: L字・T字・交差（同色の横マッチと縦マッチが交差する点） ➔ 爆弾 (bomb)！
    hMatches.forEach((hm, hIdx) => {
      if (hUsed.has(hIdx)) return;
      vMatches.forEach((vm, vIdx) => {
        if (vUsed.has(vIdx)) return;
        if (hm.type !== vm.type) return;

        // 交差判定: 横マッチの行 hm.r が縦マッチの範囲内、かつ縦マッチの列 vm.c が横マッチの範囲内
        const crossR = hm.r!;
        const crossC = vm.c!;
        if (
          crossR >= vm.start && crossR < vm.start + vm.len &&
          crossC >= hm.start && crossC < hm.start + hm.len
        ) {
          // 交差点に爆弾（bomb）を生成！属性はマッチした素材を継承
          specials.push({ r: crossR, c: crossC, type: hm.type, special: 'bomb' });
          hUsed.add(hIdx);
          vUsed.add(vIdx);
        }
      });
    });

    // 優先度③: 残りの直線4個マッチ ➔ 横ロケット (rocket_h) / 縦ロケット (rocket_v)
    hMatches.forEach((hm, hIdx) => {
      if (!hUsed.has(hIdx) && hm.len === 4) {
        const midC = hm.start + 1;
        specials.push({ r: hm.r!, c: midC, type: hm.type, special: 'rocket_h' });
      }
    });
    vMatches.forEach((vm, vIdx) => {
      if (!vUsed.has(vIdx) && vm.len === 4) {
        const midR = vm.start + 1;
        specials.push({ r: midR, c: vm.c!, type: vm.type, special: 'rocket_v' });
      }
    });

    // 同一マスでの特殊ピース重複を防ぐ
    const uniqueSpecials: SpecialCreation[] = [];
    const seen = new Set<string>();
    specials.forEach((sp) => {
      const k = `${sp.r},${sp.c}`;
      if (!seen.has(k)) {
        seen.add(k);
        uniqueSpecials.push(sp);
      }
    });

    const matches = Array.from(matchedCoords).map((coord) => {
      const [r, c] = coord.split(',').map(Number);
      return { r, c };
    });

    return { matches, specialsToCreate: uniqueSpecials };
  };

  const findMatches = (b: Tile[][]): { r: number; c: number }[] => {
    return findMatchesAndSpecials(b).matches;
  };

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

  // マウスドラッグ操作（PC対応）
  const handleMouseDown = (r: number, c: number, e: React.MouseEvent) => {
    if (isAnimating || gameResult !== 'playing' || !introDismissed) return;
    const tile = board[r][c];
    if (tile.gimmick?.type === 'vine' || tile.gimmick?.type === 'rock') return;

    touchStartRef.current = { x: e.clientX, y: e.clientY, r, c };
    isMouseDownRef.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current || !touchStartRef.current || isAnimating || gameResult !== 'playing') return;

    const dx = e.clientX - touchStartRef.current.x;
    const dy = e.clientY - touchStartRef.current.y;
    const threshold = 20;

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      const { r, c } = touchStartRef.current;
      touchStartRef.current = null;
      isMouseDownRef.current = false;

      let targetR = r;
      let targetC = c;

      if (Math.abs(dx) > Math.abs(dy)) {
        targetC = dx > 0 ? c + 1 : c - 1;
      } else {
        targetR = dy > 0 ? r + 1 : r - 1;
      }

      if (targetR >= 0 && targetR < BOARD_SIZE && targetC >= 0 && targetC < BOARD_SIZE) {
        const dest = board[targetR][targetC];
        if (dest.gimmick?.type === 'vine' || dest.gimmick?.type === 'rock') return;

        sounds.playSwipe();
        swapTiles(r, c, targetR, targetC);
      }
    }
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    touchStartRef.current = null;
  };

  const handleTileClick = async (r: number, c: number) => {
    if (isAnimating || gameResult !== 'playing' || !introDismissed) return;
    const tile = board[r][c];
    if (tile.gimmick?.type === 'vine' || tile.gimmick?.type === 'rock') return;

    // A. 未選択時：タイルを選択（ロケットや虹もタップ即時発動せず、入れ替え待機）
    if (!selectedPos) {
      sounds.playSwipe();
      setSelectedPos({ r, c });
      return;
    }

    // B. 選択中のマスを再度タップ：選択解除
    if (selectedPos.r === r && selectedPos.c === c) {
      setSelectedPos(null);
      return;
    }

    // C. 別のマスをタップ：隣接ならスワップ、離れていれば選択切り替え
    const dr = Math.abs(selectedPos.r - r);
    const dc = Math.abs(selectedPos.c - c);

    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
      sounds.playSwipe();
      const prevPos = selectedPos;
      setSelectedPos(null);
      swapTiles(prevPos.r, prevPos.c, r, c);
    } else {
      sounds.playSwipe();
      setSelectedPos({ r, c });
    }
  };

  const swapTiles = async (r1: number, c1: number, r2: number, c2: number) => {
    setIsAnimating(true);

    const newBoard = board.map((row) => [...row]);
    const temp = newBoard[r1][c1];
    newBoard[r1][c1] = newBoard[r2][c2];
    newBoard[r2][c2] = temp;

    const s1 = temp.special;
    const s2 = newBoard[r1][c1].special;

    const isRocket1 = s1 === 'rocket_h' || s1 === 'rocket_v';
    const isRocket2 = s2 === 'rocket_h' || s2 === 'rocket_v';
    const isBomb1 = s1 === 'bomb';
    const isBomb2 = s2 === 'bomb';
    const isRainbow1 = s1 === 'rainbow';
    const isRainbow2 = s2 === 'rainbow';

    // A. 虹 × 虹: 盤面全消去の大爆発！
    if (isRainbow1 && isRainbow2) {
      await executeRainbowClear(newBoard, 'ALL');
      finishMove();
      return;
    }

    // B. 虹 × ロケット: そのロケットの属性素材がすべてロケットに変わり一斉起爆！
    if ((isRainbow1 && isRocket2) || (isRainbow2 && isRocket1)) {
      const rocketTile = isRainbow1 ? newBoard[r1][c1] : temp;
      await executeRainbowRocketCombo(newBoard, rocketTile.type, r2, c2);
      finishMove();
      return;
    }

    // C. 虹 × 爆弾: その爆弾の属性素材がすべて爆弾に変わり一斉大連鎖爆発！
    if ((isRainbow1 && isBomb2) || (isRainbow2 && isBomb1)) {
      const bombTile = isRainbow1 ? newBoard[r1][c1] : temp;
      await executeRainbowBombCombo(newBoard, bombTile.type, r2, c2);
      finishMove();
      return;
    }

    // D. 虹 × 通常素材: その通常素材と同色の全ピースを一掃！
    if (isRainbow1 || isRainbow2) {
      const targetType = isRainbow1 ? newBoard[r1][c1].type : temp.type;
      await executeRainbowClear(newBoard, targetType);
      finishMove();
      return;
    }

    // E. ロケット × 爆弾 (または 爆弾 × ロケット): 十字に3×3の超極太メガライン消し！
    if ((isRocket1 && isBomb2) || (isRocket2 && isBomb1)) {
      await executeRocketBombCombo(newBoard, r2, c2);
      finishMove();
      return;
    }

    // F. 爆弾 × 爆弾: 周囲3マス（7×7＝盤面全域）の特大規模大爆発！
    if (isBomb1 && isBomb2) {
      await executeMegaBombClear(newBoard, r2, c2);
      finishMove();
      return;
    }

    // G. ロケット × ロケット: 十字大爆破！
    if (isRocket1 && isRocket2) {
      await executeRocketClear(newBoard, r2, c2, 'cross');
      finishMove();
      return;
    }

    // H. ロケット/爆弾 × 通常素材、または 通常素材同士:
    // ★勝手に発射・爆発せず、同色3マッチ以上が成立した時のみスワップ＆マッチ処理を実行！
    const { matches, specialsToCreate } = findMatchesAndSpecials(newBoard);

    if (matches.length > 0) {
      setBoard(newBoard);
      await new Promise((res) => setTimeout(res, 120));
      await processMatches(newBoard, matches, 1, specialsToCreate);
      finishMove();
    } else {
      // マッチ不成立の場合は元の位置に戻す
      setBoard(board);
      setIsAnimating(false);
    }
  };

  // 目標素材の加算と即時クリア判定
  const addCollectedTargets = (collected: { [key: string]: number }): boolean => {
    const updated = { ...targetsRef.current };
    let changed = false;

    Object.entries(collected).forEach(([t, count]) => {
      if (updated[t] && count > 0) {
        updated[t] = {
          ...updated[t],
          current: Math.min(updated[t].required, updated[t].current + count),
        };
        changed = true;
      }
    });

    if (changed) {
      targetsRef.current = updated;
      setTargets(updated);
    }

    // 目標がすべて達成されたか即座にチェック！
    const allDone = Object.values(updated).every((t) => !t || t.current >= t.required);
    if (allDone) {
      setGameResult('cleared');
      sounds.playStageClear();
      triggerConfetti();
    }
    return allDone;
  };

  const finishMove = () => {
    const nextMoves = movesLeft - 1;
    setMovesLeft(nextMoves);

    setTimeout(() => {
      checkGameStatus(nextMoves);
      setIsAnimating(false);

      if (!hasPossibleMoves(board) && nextMoves > 0 && gameResult === 'playing') {
        performShuffle();
      }
    }, 350);
  };

  const checkGameStatus = (moves: number) => {
    const allDone = Object.values(targetsRef.current).every((t) => !t || t.current >= t.required);

    if (allDone) {
      setGameResult('cleared');
      sounds.playStageClear();
      triggerConfetti();
    } else if (moves <= 0) {
      setGameResult('failed');
    }
  };

  // 重力落下アニメーション共通処理（マス数に応じた落下距離とコトン微細バウンド演出）
  const dropBoardWithGravity = async (b: Tile[][]): Promise<Tile[][]> => {
    const fallenBoard: Tile[][] = b.map((row) => row.map((tile) => ({ ...tile, dropDistance: 0 })));

    let hasFalling = false;
    for (let c = 0; c < BOARD_SIZE; c++) {
      let emptyRow = BOARD_SIZE - 1;
      // 既存タイルの落下（下から上へ走査）
      for (let r = BOARD_SIZE - 1; r >= 0; r--) {
        if (fallenBoard[r][c].id !== '') {
          if (emptyRow !== r) {
            const dist = emptyRow - r;
            fallenBoard[emptyRow][c] = {
              ...fallenBoard[r][c],
              dropDistance: dist,
            };
            fallenBoard[r][c] = { id: '', type: 'wood', special: 'none', dropDistance: 0 };
            hasFalling = true;
          }
          emptyRow--;
        }
      }
      // 上部の空きマスに新ピースを生成（画面上端の枠外から等間隔で落下）
      const totalNew = emptyRow + 1;
      for (let r = emptyRow; r >= 0; r--) {
        const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
        const dist = totalNew;
        fallenBoard[r][c] = {
          id: `new-${r}-${c}-${Date.now()}-${Math.random()}`,
          type,
          special: 'none' as SpecialType,
          dropDistance: dist,
        };
        hasFalling = true;
      }
    }

    if (hasFalling) {
      setDropVersion((v) => v + 1);
      setBoard(fallenBoard);

      // 重力落下の時間（380ms）待機：重力加速度で急降下 ➔ コトンと微細バウンド
      await new Promise((res) => setTimeout(res, 380));

      // 着地のコトン音
      sounds.playDrop();

      // 静止状態にリセット
      const settledBoard = fallenBoard.map((row) =>
        row.map((tile) => ({ ...tile, dropDistance: 0 }))
      );
      setBoard(settledBoard);
      return settledBoard;
    } else {
      setBoard(fallenBoard);
      return fallenBoard;
    }
  };

  // マッチ消去＆隣接ギミック破壊処理
  const processMatches = async (
    b: Tile[][],
    matches: { r: number; c: number }[],
    currentCombo: number,
    specialsToCreate: SpecialCreation[] = []
  ) => {
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

    // 1. 消去演出フェーズ（マッチしたピースをポップ＆フェードアウト）
    const matchIds = new Set(matches.map(({ r, c }) => b[r][c].id));
    setClearingTileIds(matchIds);

    // ポップアニメーション（弾けて光る）をしっかり見せる (220ms)
    await new Promise((res) => setTimeout(res, 220));
    setClearingTileIds(new Set());

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

    // ターゲット加算 & 即時クリア判定
    addCollectedTargets(collectedCounts);

    // ★ロケット起爆判定：同色3マッチ以上に含まれるロケットを発射！
    const rocketDetonations = matches.filter(
      ({ r, c }) => b[r][c].special === 'rocket_h' || b[r][c].special === 'rocket_v'
    );

    if (rocketDetonations.length > 0) {
      sounds.playRocket();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 350);

      const detLasers: ActiveLaser[] = rocketDetonations.map((d, i) => ({
        id: Date.now() + i,
        r: b[d.r][d.c].special === 'rocket_h' ? d.r : undefined,
        c: b[d.r][d.c].special === 'rocket_v' ? d.c : undefined,
        direction: b[d.r][d.c].special === 'rocket_h' ? ('h' as const) : ('v' as const),
      }));
      setActiveLasers(detLasers);
      setTimeout(() => setActiveLasers([]), 650);

      rocketDetonations.forEach(({ r, c }) => {
        const specialType = b[r][c].special;
        if (specialType === 'rocket_h') {
          // 横ロケット：横一列を貫通消去
          for (let col = 0; col < BOARD_SIZE; col++) {
            const t = newBoard[r][col];
            if (t.id !== '') {
              collectedCounts[t.type] = (collectedCounts[t.type] || 0) + 1;
              if (t.gimmick) {
                collectedCounts[t.gimmick.type] = (collectedCounts[t.gimmick.type] || 0) + 1;
                t.gimmick = undefined;
              }
              newBoard[r][col] = { id: '', type: 'wood', special: 'none' };
            }
          }
        } else if (specialType === 'rocket_v') {
          // 縦ロケット：縦一列を貫通消去
          for (let row = 0; row < BOARD_SIZE; row++) {
            const t = newBoard[row][c];
            if (t.id !== '') {
              collectedCounts[t.type] = (collectedCounts[t.type] || 0) + 1;
              if (t.gimmick) {
                collectedCounts[t.gimmick.type] = (collectedCounts[t.gimmick.type] || 0) + 1;
                t.gimmick = undefined;
              }
              newBoard[row][c] = { id: '', type: 'wood', special: 'none' };
            }
          }
        }
      });
      addCollectedTargets(collectedCounts);
      await new Promise((res) => setTimeout(res, 250));
    }

    // ★爆弾起爆判定：同色3マッチ以上に含まれる爆弾を作動！（周囲2マス破壊）
    const bombDetonations = matches.filter(({ r, c }) => b[r][c].special === 'bomb');
    if (bombDetonations.length > 0) {
      sounds.playBomb(false);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);

      bombDetonations.forEach(({ r, c }) => {
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
              const t = newBoard[nr][nc];
              if (t.id !== '') {
                collectedCounts[t.type] = (collectedCounts[t.type] || 0) + 1;
                if (t.gimmick) {
                  collectedCounts[t.gimmick.type] = (collectedCounts[t.gimmick.type] || 0) + 1;
                  t.gimmick = undefined;
                }
                newBoard[nr][nc] = { id: '', type: 'wood', special: 'none' };
              }
            }
          }
        }
      });
      addCollectedTargets(collectedCounts);
      await new Promise((res) => setTimeout(res, 250));
    }

    // マッチした通常マスを空マス化
    matches.forEach(({ r, c }) => {
      newBoard[r][c] = { id: '', type: 'wood', special: 'none' };
    });

    // 新たな特殊ピースを生成（5個直列➔虹、L/T字➔爆弾、4個直列➔縦/横ロケット）
    specialsToCreate.forEach((spec) => {
      newBoard[spec.r][spec.c] = {
        id: `special-${Date.now()}-${Math.random()}`,
        type: spec.type,
        special: spec.special,
      };
      if (spec.special === 'rainbow') {
        sounds.playRainbow();
      } else if (spec.special === 'bomb') {
        sounds.playBomb(false);
      } else {
        sounds.playRocket();
      }
    });

    // 2. 重力落下アニメーション！
    const settledBoard = await dropBoardWithGravity(newBoard);

    // 3. 連鎖チェック（着地の余韻 100ms を挟んで次へ）
    await new Promise((res) => setTimeout(res, 100));
    const nextResult = findMatchesAndSpecials(settledBoard);
    if (nextResult.matches.length > 0) {
      await processMatches(settledBoard, nextResult.matches, currentCombo + 1, nextResult.specialsToCreate);
    }
  };

  // ロケット起爆（横、縦、または十字にビームを発射して消去）
  const executeRocketClear = async (
    b: Tile[][],
    hitR: number,
    hitC: number,
    mode: 'h' | 'v' | 'cross' = 'cross'
  ) => {
    sounds.playRocket();

    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);

    const lasers: ActiveLaser[] = [];
    if (mode === 'h' || mode === 'cross') {
      lasers.push({ id: Date.now(), r: hitR, direction: 'h' });
    }
    if (mode === 'v' || mode === 'cross') {
      lasers.push({ id: Date.now() + 1, c: hitC, direction: 'v' });
    }
    setActiveLasers(lasers);
    setTimeout(() => setActiveLasers([]), 750);

    const collectedCounts: { [key: string]: number } = {};
    const newBoard: Tile[][] = b.map((row) => row.map((tile) => ({ ...tile })));

    const targetsToClear = new Set<string>();
    if (mode === 'h' || mode === 'cross') {
      for (let c = 0; c < BOARD_SIZE; c++) {
        targetsToClear.add(`${hitR},${c}`);
      }
    }
    if (mode === 'v' || mode === 'cross') {
      for (let r = 0; r < BOARD_SIZE; r++) {
        targetsToClear.add(`${r},${hitC}`);
      }
    }

    targetsToClear.forEach((coord) => {
      const [r, c] = coord.split(',').map(Number);
      const tile = newBoard[r][c];
      if (tile.gimmick?.type === 'rock') {
        tile.gimmick = undefined;
        collectedCounts['rock'] = (collectedCounts['rock'] || 0) + 1;
        sounds.playRockBreak();
      } else if (tile.gimmick?.type === 'ice') {
        tile.gimmick = undefined;
        collectedCounts['ice'] = (collectedCounts['ice'] || 0) + 1;
        sounds.playIceBreak();
      } else if (tile.gimmick?.type === 'vine') {
        tile.gimmick = undefined;
        collectedCounts['vine'] = (collectedCounts['vine'] || 0) + 1;
        sounds.playVineCut();
      }
      collectedCounts[tile.type] = (collectedCounts[tile.type] || 0) + 1;
      newBoard[r][c] = { id: '', type: 'wood', special: 'none' };
    });

    addCollectedTargets(collectedCounts);
    await new Promise((res) => setTimeout(res, 550));

    const settledBoard = await dropBoardWithGravity(newBoard);

    await new Promise((res) => setTimeout(res, 100));
    const nextResult = findMatchesAndSpecials(settledBoard);
    if (nextResult.matches.length > 0) {
      await processMatches(settledBoard, nextResult.matches, 2, nextResult.specialsToCreate);
    }
  };

  // ロケット × 爆弾: 十字に3×3の超極太メガライン消し！
  const executeRocketBombCombo = async (
    b: Tile[][],
    hitR: number,
    hitC: number
  ) => {
    sounds.playRocket();
    sounds.playBomb(true);

    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 600);

    // 横3列 ＋ 縦3列のメガ十字レーザーを放射！
    const lasers: ActiveLaser[] = [];
    let laserId = Date.now();
    for (let dr = -1; dr <= 1; dr++) {
      const r = hitR + dr;
      if (r >= 0 && r < BOARD_SIZE) {
        lasers.push({ id: laserId++, r, direction: 'h' });
      }
    }
    for (let dc = -1; dc <= 1; dc++) {
      const c = hitC + dc;
      if (c >= 0 && c < BOARD_SIZE) {
        lasers.push({ id: laserId++, c, direction: 'v' });
      }
    }
    setActiveLasers(lasers);
    setTimeout(() => setActiveLasers([]), 800);

    const collectedCounts: { [key: string]: number } = {};
    const newBoard: Tile[][] = b.map((row) => row.map((t) => ({ ...t })));
    const targetsToClear = new Set<string>();

    // 横3列の全マス
    for (let dr = -1; dr <= 1; dr++) {
      const r = hitR + dr;
      if (r >= 0 && r < BOARD_SIZE) {
        for (let col = 0; col < BOARD_SIZE; col++) targetsToClear.add(`${r},${col}`);
      }
    }
    // 縦3列の全マス
    for (let dc = -1; dc <= 1; dc++) {
      const c = hitC + dc;
      if (c >= 0 && c < BOARD_SIZE) {
        for (let row = 0; row < BOARD_SIZE; row++) targetsToClear.add(`${row},${c}`);
      }
    }

    targetsToClear.forEach((coord) => {
      const [r, c] = coord.split(',').map(Number);
      const tile = newBoard[r][c];
      if (tile.gimmick?.type === 'rock') {
        tile.gimmick = undefined;
        collectedCounts['rock'] = (collectedCounts['rock'] || 0) + 1;
        sounds.playRockBreak();
      } else if (tile.gimmick?.type === 'ice') {
        tile.gimmick = undefined;
        collectedCounts['ice'] = (collectedCounts['ice'] || 0) + 1;
        sounds.playIceBreak();
      } else if (tile.gimmick?.type === 'vine') {
        tile.gimmick = undefined;
        collectedCounts['vine'] = (collectedCounts['vine'] || 0) + 1;
        sounds.playVineCut();
      }
      collectedCounts[tile.type] = (collectedCounts[tile.type] || 0) + 1;
      newBoard[r][c] = { id: '', type: 'wood', special: 'none' };
    });

    addCollectedTargets(collectedCounts);
    await new Promise((res) => setTimeout(res, 600));

    const settledBoard = await dropBoardWithGravity(newBoard);

    await new Promise((res) => setTimeout(res, 100));
    const nextResult = findMatchesAndSpecials(settledBoard);
    if (nextResult.matches.length > 0) {
      await processMatches(settledBoard, nextResult.matches, 2, nextResult.specialsToCreate);
    }
  };

  // 爆弾 × 爆弾: 周囲3マス（7×7＝盤面全域）の特大規模大爆発！
  const executeMegaBombClear = async (
    b: Tile[][],
    hitR: number,
    hitC: number
  ) => {
    sounds.playBomb(true);

    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 750);

    try {
      confetti({
        particleCount: 65,
        spread: 95,
        origin: { y: 0.55 },
        colors: ['#ef4444', '#f59e0b', '#fbbf24', '#ffffff'],
      });
    } catch {}

    const collectedCounts: { [key: string]: number } = {};
    const newBoard: Tile[][] = b.map((row) => row.map((t) => ({ ...t })));

    // 周囲3マス（盤面7×7全体を網羅）
    for (let dr = -3; dr <= 3; dr++) {
      for (let dc = -3; dc <= 3; dc++) {
        const r = hitR + dr;
        const c = hitC + dc;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          const tile = newBoard[r][c];
          if (tile.id !== '') {
            if (tile.gimmick?.type === 'rock') {
              tile.gimmick = undefined;
              collectedCounts['rock'] = (collectedCounts['rock'] || 0) + 1;
              sounds.playRockBreak();
            } else if (tile.gimmick?.type === 'ice') {
              tile.gimmick = undefined;
              collectedCounts['ice'] = (collectedCounts['ice'] || 0) + 1;
              sounds.playIceBreak();
            } else if (tile.gimmick?.type === 'vine') {
              tile.gimmick = undefined;
              collectedCounts['vine'] = (collectedCounts['vine'] || 0) + 1;
              sounds.playVineCut();
            }
            collectedCounts[tile.type] = (collectedCounts[tile.type] || 0) + 1;
            newBoard[r][c] = { id: '', type: 'wood', special: 'none' };
          }
        }
      }
    }

    addCollectedTargets(collectedCounts);
    await new Promise((res) => setTimeout(res, 600));

    const settledBoard = await dropBoardWithGravity(newBoard);

    await new Promise((res) => setTimeout(res, 100));
    const nextResult = findMatchesAndSpecials(settledBoard);
    if (nextResult.matches.length > 0) {
      await processMatches(settledBoard, nextResult.matches, 2, nextResult.specialsToCreate);
    }
  };

  // 虹 × 爆弾: その属性の全素材が爆弾に変わり一斉連鎖大爆発！
  const executeRainbowBombCombo = async (
    b: Tile[][],
    targetType: PieceType,
    hitR: number,
    hitC: number
  ) => {
    sounds.playRainbow();
    sounds.playBomb(true);

    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 700);

    try {
      confetti({
        particleCount: 55,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#f59e0b', '#38bdf8', '#a855f7'],
      });
    } catch {}

    const newBoard: Tile[][] = b.map((row) => row.map((t) => ({ ...t })));
    const bombList: { r: number; c: number }[] = [];

    // 起爆位置
    bombList.push({ r: hitR, c: hitC });

    // 同色の全ピースおよびレインボーを爆弾に変化！
    newBoard.forEach((row, r) => {
      row.forEach((t, c) => {
        if (t.type === targetType || t.special === 'rainbow') {
          t.special = 'bomb';
          bombList.push({ r, c });
        }
      });
    });

    setBoard(newBoard.map((row) => [...row]));
    await new Promise((res) => setTimeout(res, 320));

    // 各爆弾の周囲2マスを一斉起爆！
    const collectedCounts: { [key: string]: number } = {};
    const targetsToClear = new Set<string>();

    bombList.forEach((bm) => {
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const nr = bm.r + dr;
          const nc = bm.c + dc;
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
            targetsToClear.add(`${nr},${nc}`);
          }
        }
      }
    });

    targetsToClear.forEach((coord) => {
      const [r, c] = coord.split(',').map(Number);
      const tile = newBoard[r][c];
      if (tile.gimmick?.type === 'rock') {
        tile.gimmick = undefined;
        collectedCounts['rock'] = (collectedCounts['rock'] || 0) + 1;
      } else if (tile.gimmick?.type === 'ice') {
        tile.gimmick = undefined;
        collectedCounts['ice'] = (collectedCounts['ice'] || 0) + 1;
      } else if (tile.gimmick?.type === 'vine') {
        tile.gimmick = undefined;
        collectedCounts['vine'] = (collectedCounts['vine'] || 0) + 1;
      }
      collectedCounts[tile.type] = (collectedCounts[tile.type] || 0) + 1;
      newBoard[r][c] = { id: '', type: 'wood', special: 'none' };
    });

    addCollectedTargets(collectedCounts);
    await new Promise((res) => setTimeout(res, 650));

    const settledBoard = await dropBoardWithGravity(newBoard);

    await new Promise((res) => setTimeout(res, 100));
    const nextResult = findMatchesAndSpecials(settledBoard);
    if (nextResult.matches.length > 0) {
      await processMatches(settledBoard, nextResult.matches, 2, nextResult.specialsToCreate);
    }
  };

  // 虹 × ロケット: その属性の全素材がロケットに変わり一斉発射！
  const executeRainbowRocketCombo = async (
    b: Tile[][],
    targetType: PieceType,
    hitR: number,
    hitC: number
  ) => {
    sounds.playRainbow();
    sounds.playRocket();

    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 700);

    try {
      confetti({
        particleCount: 55,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#38bdf8', '#10b981', '#f43f5e', '#a855f7'],
      });
    } catch {}

    const newBoard: Tile[][] = b.map((row) => row.map((t) => ({ ...t })));
    const rocketList: { r: number; c: number; dir: 'h' | 'v' }[] = [];

    // 起爆位置
    rocketList.push({ r: hitR, c: hitC, dir: Math.random() < 0.5 ? 'h' : 'v' });

    // 同色の全ピースおよびレインボーをロケットに変化！
    newBoard.forEach((row, r) => {
      row.forEach((t, c) => {
        if (t.type === targetType || t.special === 'rainbow') {
          const dir: 'h' | 'v' = Math.random() < 0.5 ? 'h' : 'v';
          t.special = dir === 'h' ? 'rocket_h' : 'rocket_v';
          rocketList.push({ r, c, dir });
        }
      });
    });

    setBoard(newBoard.map((row) => [...row]));
    await new Promise((res) => setTimeout(res, 300));

    // 一斉発射！
    const lasers: ActiveLaser[] = rocketList.map((rk, idx) => ({
      id: Date.now() + idx,
      r: rk.dir === 'h' ? rk.r : undefined,
      c: rk.dir === 'v' ? rk.c : undefined,
      direction: rk.dir,
    }));
    setActiveLasers(lasers);
    setTimeout(() => setActiveLasers([]), 750);

    const targetsToClear = new Set<string>();
    rocketList.forEach((rk) => {
      if (rk.dir === 'h') {
        for (let col = 0; col < BOARD_SIZE; col++) targetsToClear.add(`${rk.r},${col}`);
      } else {
        for (let row = 0; row < BOARD_SIZE; row++) targetsToClear.add(`${row},${rk.c}`);
      }
    });

    const collectedCounts: { [key: string]: number } = {};
    targetsToClear.forEach((coord) => {
      const [r, c] = coord.split(',').map(Number);
      const tile = newBoard[r][c];
      if (tile.gimmick?.type === 'rock') {
        tile.gimmick = undefined;
        collectedCounts['rock'] = (collectedCounts['rock'] || 0) + 1;
        sounds.playRockBreak();
      } else if (tile.gimmick?.type === 'ice') {
        tile.gimmick = undefined;
        collectedCounts['ice'] = (collectedCounts['ice'] || 0) + 1;
        sounds.playIceBreak();
      } else if (tile.gimmick?.type === 'vine') {
        tile.gimmick = undefined;
        collectedCounts['vine'] = (collectedCounts['vine'] || 0) + 1;
        sounds.playVineCut();
      }
      collectedCounts[tile.type] = (collectedCounts[tile.type] || 0) + 1;
      newBoard[r][c] = { id: '', type: 'wood', special: 'none' };
    });

    addCollectedTargets(collectedCounts);
    await new Promise((res) => setTimeout(res, 600));

    const settledBoard = await dropBoardWithGravity(newBoard);

    await new Promise((res) => setTimeout(res, 100));
    const nextResult = findMatchesAndSpecials(settledBoard);
    if (nextResult.matches.length > 0) {
      await processMatches(settledBoard, nextResult.matches, 2, nextResult.specialsToCreate);
    }
  };

  // レインボー起爆（同色全消し、または全盤面消去）
  const executeRainbowClear = async (b: Tile[][], targetType: PieceType | 'ALL') => {
    sounds.playRainbow();

    const highlighted: { r: number; c: number }[] = [];
    b.forEach((row, r) => {
      row.forEach((t, c) => {
        if (targetType === 'ALL' || t.type === targetType || t.special === 'rainbow') {
          highlighted.push({ r, c });
        }
      });
    });
    setRainbowTargets(highlighted);
    setTimeout(() => setRainbowTargets([]), 850);

    try {
      confetti({
        particleCount: 45,
        spread: 75,
        origin: { y: 0.55 },
        colors: ['#38bdf8', '#fbbf24', '#f43f5e', '#a855f7', '#34d399', '#ffffff'],
        shapes: ['circle', 'star'],
        scalar: 1.0,
      });
    } catch {}
    const collectedCounts: { [key: string]: number } = {};
    const newBoard: Tile[][] = b.map((row) =>
      row.map((tile) => {
        if (targetType === 'ALL' || tile.type === targetType || tile.special === 'rainbow') {
          collectedCounts[tile.type] = (collectedCounts[tile.type] || 0) + 1;
          if (tile.gimmick) {
            collectedCounts[tile.gimmick.type] = (collectedCounts[tile.gimmick.type] || 0) + 1;
          }
          return { id: '', type: 'wood' as PieceType, special: 'none' as SpecialType };
        }
        return { ...tile };
      })
    );

    addCollectedTargets(collectedCounts);
    await new Promise((res) => setTimeout(res, 600));

    const settledBoard = await dropBoardWithGravity(newBoard);

    await new Promise((res) => setTimeout(res, 100));
    const nextResult = findMatchesAndSpecials(settledBoard);
    if (nextResult.matches.length > 0) {
      await processMatches(settledBoard, nextResult.matches, 2, nextResult.specialsToCreate);
    }
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
    <div 
      className="flex flex-col items-center justify-between min-h-screen text-white max-w-md mx-auto p-3.5 select-none relative overflow-hidden bg-cover bg-top"
      style={{ backgroundImage: 'url(/assets/puzzle_bg.jpg)' }}
    >
      {/* 画面全体の可読性・奥行きを高めるグラデーション */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/60 pointer-events-none" />
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

      {/* 上部ヘッダー（ステージ名・残り手数・目標材料を最上部に一体化配置） */}
      <div className="w-full p-2 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-amber-500/30 shadow-xl z-20 space-y-1.5">
        {/* 最上段：戻るボタン、ステージ名、操作ボタン */}
        <div className="flex items-center justify-between">
          <button
            onClick={onExit}
            className="p-1.5 text-amber-200 hover:text-white rounded-xl bg-amber-950/60 hover:bg-amber-900/80 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="text-center">
            <h2 className="text-xs sm:text-sm font-black text-amber-300 tracking-wide drop-shadow-sm">
              {stage.title}
            </h2>
            <span className="text-[9px] text-amber-200/80 font-medium">
              クリア報酬: 🪵 +{stage.woodReward} ウッド
            </span>
          </div>

          <div className="flex items-center space-x-1">
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
              className="p-1.5 text-slate-300 hover:text-white rounded-xl bg-slate-900/80 active:scale-95 transition-transform"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
            <button
              onClick={initBoard}
              title="リスタート"
              className="p-1.5 text-slate-300 hover:text-white rounded-xl bg-slate-900/80 active:scale-95 transition-transform"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ステージ名のすぐ下：残り手数 ＆ 目標材料カウンター */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-500/20">
          {/* 残り手数 */}
          <div className="flex items-center space-x-1.5 bg-amber-950/80 border border-amber-400/50 rounded-xl px-2.5 py-0.5 shadow-inner">
            <span className="text-[9px] font-bold text-amber-300 uppercase">手数</span>
            <span className="text-lg font-black text-amber-400 drop-shadow-sm">{movesLeft}</span>
          </div>

          {/* 目標素材カウンター */}
          <div className="flex-1 flex items-center justify-around bg-slate-900/85 border border-slate-700/60 rounded-xl px-2 py-0.5 shadow-inner">
            {stage.targets.map((t) => {
              const current = targets[t.type]?.current || 0;
              const isDone = current >= t.required;
              const icon =
                t.type === 'ice' ? '🧊' : t.type === 'rock' ? '🪨' : t.type === 'vine' ? '🌿' : PIECE_CONFIG[t.type]?.icon || '🪵';
              const label =
                t.type === 'ice' ? '氷' : t.type === 'rock' ? '岩' : t.type === 'vine' ? 'ツタ' : PIECE_CONFIG[t.type]?.label || '素材';

              return (
                <div key={t.type} className="flex items-center space-x-1">
                  <span className="text-lg drop-shadow-sm">{icon}</span>
                  <div className="text-left leading-tight">
                    <span className="text-[9px] text-amber-200/70 font-bold block">{label}</span>
                    <span className={`text-[11px] font-black ${isDone ? "text-emerald-400" : "text-white"}`}>

                      {current}/{t.required} {isDone && '✓'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ビーバーたちがしっかり見える中央オープンスペース（可変） */}
      <div className="flex-1 w-full min-h-[16px] pointer-events-none" />

      {/* 画面下部：パズル盤面＆下部説明 */}
      <div className="w-full flex flex-col items-center space-y-1.5 z-10 pb-1">
        {/* コンボポップアップ */}
        {comboToast && (
        <div className="bg-gradient-to-r from-amber-500 to-rose-500 text-white font-black text-xs px-4 py-1.5 rounded-full shadow-xl animate-bounce-subtle">
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
      <div onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative p-2.5 bg-amber-950/85 rounded-3xl border-2 border-amber-600/50 shadow-[0_12px_36px_rgba(0,0,0,0.6)] backdrop-blur-md touch-none z-10 overflow-hidden ${isShaking ? "animate-board-shake" : ""}`}>
        {/* レーザー光線オーバーレイ */}
        {activeLasers.map((laser) => {
          if (laser.direction === "h" && laser.r !== undefined) {
            const topPercent = ((laser.r + 0.5) / BOARD_SIZE) * 100;
            return (
              <div
                key={`laser-${laser.id}`}
                style={{ top: `${topPercent}%` }}
                className="absolute left-1 right-1 -translate-y-1/2 h-5 bg-gradient-to-r from-amber-500 via-yellow-200 to-amber-500 rounded-full blur-[1px] shadow-[0_0_24px_rgba(251,191,36,0.95)] animate-laser-h z-30 pointer-events-none"
              >
                <div className="w-full h-full bg-white/90 rounded-full blur-[0.5px]" />
              </div>
            );
          }
          if (laser.direction === "v" && laser.c !== undefined) {
            const leftPercent = ((laser.c + 0.5) / BOARD_SIZE) * 100;
            return (
              <div
                key={`laser-${laser.id}`}
                style={{ left: `${leftPercent}%` }}
                className="absolute top-1 bottom-1 -translate-x-1/2 w-5 bg-gradient-to-b from-amber-500 via-yellow-200 to-amber-500 rounded-full blur-[1px] shadow-[0_0_24px_rgba(251,191,36,0.95)] animate-laser-v z-30 pointer-events-none"
              >
                <div className="w-full h-full bg-white/90 rounded-full blur-[0.5px]" />
              </div>
            );
          }
          return null;
        })}
        <div className="grid grid-cols-7 gap-1.5">
          {board.map((row, r) =>
            row.map((tile, c) => {
              if (!tile.id) {
                return (
                  <div
                    key={`empty-${r}-${c}`}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-950/40 border border-amber-900/30"
                  />
                );
              }

              const isSelected = selectedPos?.r === r && selectedPos?.c === c;
              const isClearing = clearingTileIds.has(tile.id);
              const dropDist = tile.dropDistance || 0;
              const isDropping = dropDist > 0;
              const config = PIECE_CONFIG[tile.type] || PIECE_CONFIG.wood;
              const gimmick = tile.gimmick;
              const isRocket = tile.special === 'rocket_h' || tile.special === 'rocket_v';
              const isBomb = tile.special === 'bomb';
              const isRainbowGlow = rainbowTargets.some((rt) => rt.r === r && rt.c === c);

              // ロケットの色分け装飾
              const rocketTheme = {
                wood: { ring: 'ring-amber-500/70 bg-amber-950/50', icon: '🪵', label: '丸太ロケット' },
                water: { ring: 'ring-cyan-400/70 bg-cyan-950/50', icon: '💧', label: '水流ロケット' },
                twig: { ring: 'ring-emerald-400/70 bg-emerald-950/50', icon: '🌿', label: '若葉ロケット' },
                acorn: { ring: 'ring-orange-400/70 bg-orange-950/50', icon: '🌰', label: 'どんぐりロケット' },
                stone: { ring: 'ring-slate-400/70 bg-slate-850/50', icon: '🪨', label: '岩石ロケット' },
              }[tile.type] || { ring: 'ring-amber-500/70 bg-amber-950/50', icon: '🪵', label: 'ロケット' };

              return (
                <div
                  key={`${tile.id}-${isDropping ? dropVersion : '0'}`}
                  onTouchStart={(e) => handleTouchStart(r, c, e)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={(e) => handleMouseDown(r, c, e)}
                  onClick={() => handleTileClick(r, c)}
                  style={{
                    ...(isDropping ? ({ '--drop-offset': `-${dropDist * 115}%` } as React.CSSProperties) : {}),
                  }}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-2xl font-bold cursor-pointer select-none transform active:scale-95 relative overflow-hidden ${
                    isDropping ? '' : 'transition-all duration-150'
                  } ${
                    isClearing
                      ? 'animate-piece-pop z-20'
                      : isDropping
                      ? 'animate-piece-drop z-10'
                      : isSelected
                      ? 'bg-amber-400/40 ring-4 ring-amber-400 scale-105 z-10'
                      : isRainbowGlow
                      ? 'animate-rainbow-glow ring-2 ring-purple-400 bg-purple-950/60 z-20'
                      : (isRocket || isBomb)
                      ? `ring-2 ${rocketTheme.ring} shadow-lg shadow-amber-500/20`
                      : gimmick?.type === 'rock'
                      ? 'bg-slate-800 border-2 border-slate-600 shadow-inner'
                      : 'bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 shadow-inner'
                  }`}
                >
                  {/* メインピース */}
                  {gimmick?.type === 'rock' ? (
                    <span className="text-2xl drop-shadow-md">🪨</span>
                  ) : tile.special === 'rainbow' ? (
                    <div className="relative flex items-center justify-center">
                      <span className="animate-spin-slow text-2xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">🌈</span>
                    </div>
                  ) : isRocket ? (
                    <div className="relative flex items-center justify-center w-full h-full">
                      <span
                        className={`text-2xl filter drop-shadow-md animate-pulse-slow transition-transform ${
                          tile.special === 'rocket_h' ? 'rotate-90' : 'rotate-0'
                        }`}
                      >
                        🚀
                      </span>
                      {/* 向きバッジ（横 ↔ / 縦 ↕） */}
                      <span className="absolute top-0.5 left-0.5 text-[9px] font-black bg-slate-950/85 border border-slate-700/80 rounded px-0.5 py-0 leading-none text-amber-300">
                        {tile.special === 'rocket_h' ? '↔' : '↕'}
                      </span>
                      {/* 属性素材バッジ（🪵, 💧, 🌿, 🌰, 🪨） */}
                      <span className="absolute bottom-0 right-0 text-[10px] bg-slate-950/90 border border-slate-700/80 rounded-full px-0.5 py-0 shadow-xs leading-none">
                        {rocketTheme.icon}
                      </span>
                    </div>
                  ) : isBomb ? (
                    <div className="relative flex items-center justify-center w-full h-full">
                      <span className="text-2xl filter drop-shadow-md animate-pulse">
                        💣
                      </span>
                      {/* 周囲2マス破壊バッジ */}
                      <span className="absolute top-0.5 left-0.5 text-[9px] font-black bg-slate-950/85 border border-slate-700/80 rounded px-0.5 py-0 leading-none text-rose-400">
                        💥
                      </span>
                      {/* 属性素材バッジ（🪵, 💧, 🌿, 🌰, 🪨） */}
                      <span className="absolute bottom-0 right-0 text-[10px] bg-slate-950/90 border border-slate-700/80 rounded-full px-0.5 py-0 shadow-xs leading-none">
                        {rocketTheme.icon}
                      </span>
                    </div>
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
        <div className="text-center text-[11px] text-amber-100 font-medium bg-slate-950/80 border border-amber-500/20 px-3 py-1 rounded-full backdrop-blur-md shadow-sm">
          {stage.newGimmickIntro ? stage.newGimmickIntro.description : '同じ素材を3つ揃えよう！4個でロケット🚀、L字で爆弾💣、5個で虹🌈'}
        </div>
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
                <span className="text-2xl">🦫✨</span>
                <div className="text-xs font-black text-cyan-300">次のエリアを開拓！</div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              手に入れた木材や素材を使って、新たな開拓地を復興しよう！
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
