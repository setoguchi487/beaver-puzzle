import React, { useState, useEffect, useRef } from 'react';
import type { PieceType, SpecialType, PuzzleStage, TileGimmick, TileUnderlay, BoosterItemType, PlayerBoosters } from '../../types';
import { PIECE_CONFIG } from '../../data/masterData';
import { BUDDY_SKILLS, type BuddySkill } from '../../data/buddySkills';
import { sounds } from '../../utils/soundEffects';
import { getAssetUrl } from '../../utils/assetPath';
import confetti from 'canvas-confetti';
import { RefreshCw, X, ArrowLeft, Trophy, Volume2, VolumeX, Star, Sparkles } from 'lucide-react';
import { calculateStageStars, getStarWoodBonus, getStarThresholds } from '../../utils/stageEvaluation';
import { DevStageSelector } from '../common/DevStageSelector';

interface Tile {
  id: string;
  type: PieceType;
  special: SpecialType;
  gimmick?: TileGimmick;
  underlay?: TileUnderlay;
  dropDistance?: number;
  disabled?: boolean;
}

interface Match3BoardProps {
  stage: PuzzleStage;
  onStageClear: (rewardWood: number, unfogAreaIds: string[], stars?: number, remainingMoves?: number) => void;
  onExit: () => void;
  currentStageId?: number;
  selectedBuddyId?: string;
  onSelectStage?: (stageId: number) => void;
  onAddWood?: (amount: number) => void;
  onSetWood?: (amount: number) => void;
  onUnlockAllAreas?: () => void;
  onResetAreas?: () => void;
  onResetAll?: () => void;
}

const DEFAULT_BOARD_SIZE = 7;
const DEFAULT_PIECE_TYPES: PieceType[] = ['wood', 'twig', 'water', 'acorn', 'stone'];

const DEFAULT_BOOSTERS: PlayerBoosters = {
  hammer: 2,
  saw: 2,
  tail: 2,
  clock: 2,
};

export interface PreBoosters {
  startRocket: number;
  startBomb: number;
  extraMoves: number;
}

const DEFAULT_PRE_BOOSTERS: PreBoosters = {
  startRocket: 2,
  startBomb: 2,
  extraMoves: 2,
};

const loadPreBoosters = (): PreBoosters => {
  try {
    const saved = localStorage.getItem('beaver_puzzle_pre_boosters');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        startRocket: typeof parsed.startRocket === 'number' ? parsed.startRocket : DEFAULT_PRE_BOOSTERS.startRocket,
        startBomb: typeof parsed.startBomb === 'number' ? parsed.startBomb : DEFAULT_PRE_BOOSTERS.startBomb,
        extraMoves: typeof parsed.extraMoves === 'number' ? parsed.extraMoves : DEFAULT_PRE_BOOSTERS.extraMoves,
      };
    }
  } catch (e) {
    console.error('Failed to load pre-boosters:', e);
  }
  return { ...DEFAULT_PRE_BOOSTERS };
};

const loadWinStreak = (): number => {
  try {
    const saved = localStorage.getItem('beaver_puzzle_win_streak');
    return saved ? Math.max(0, Number(saved)) : 0;
  } catch {
    return 0;
  }
};

const loadBoosters = (): PlayerBoosters => {
  try {
    const saved = localStorage.getItem('beaver_puzzle_boosters');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        hammer: typeof parsed.hammer === 'number' ? parsed.hammer : DEFAULT_BOOSTERS.hammer,
        saw: typeof parsed.saw === 'number' ? parsed.saw : DEFAULT_BOOSTERS.saw,
        tail: typeof parsed.tail === 'number' ? parsed.tail : DEFAULT_BOOSTERS.tail,
        clock: typeof parsed.clock === 'number' ? parsed.clock : DEFAULT_BOOSTERS.clock,
      };
    }
  } catch (e) {
    console.error('Failed to load boosters:', e);
  }
  return { ...DEFAULT_BOOSTERS };
};

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
  selectedBuddyId = 'mallard_duck',
  onSelectStage,
  onAddWood,
  onSetWood,
  onUnlockAllAreas,
  onResetAreas,
  onResetAll,
}) => {
  const numRows = stage.boardRows || DEFAULT_BOARD_SIZE;
  const numCols = stage.boardCols || DEFAULT_BOARD_SIZE;
  const gravityDir = stage.gravityDirection || 'down';
  const activePieceTypes =
    stage.allowedPieceTypes && stage.allowedPieceTypes.length >= 3
      ? stage.allowedPieceTypes
      : DEFAULT_PIECE_TYPES;
  const disabledSet = new Set((stage.disabledTiles || []).map((t) => `${t.r},${t.c}`));

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

  // 相棒スキル関連ステート
  const buddySkill: BuddySkill | undefined = BUDDY_SKILLS[selectedBuddyId];
  const [buddyCutIn, setBuddyCutIn] = useState<string | null>(null);
  const swanTriggeredRef = useRef(false);
  const onStartTriggeredRef = useRef(false);

  // 全15エリアの美麗ステージ背景画像 & エリア情報マッピング（全100ステージ対応）
  const getStageBackgroundInfo = (sId: number) => {
    if (sId <= 7) return { bg: getAssetUrl('/assets/shallows_stage_5.jpg'), areaName: 'はじまりのせせらぎ', icon: '🦆' };
    if (sId <= 14) return { bg: getAssetUrl('/assets/dam_stage_5.jpg'), areaName: '小枝ダムの浅瀬', icon: '🐟' };
    if (sId <= 21) return { bg: getAssetUrl('/assets/lodge_stage_5.jpg'), areaName: '木漏れ日のロッジ', icon: '🐿️' };
    if (sId <= 28) return { bg: getAssetUrl('/assets/pier_stage_5.jpg'), areaName: '釣りテラス＆桟橋', icon: '🐦' };
    if (sId <= 35) return { bg: getAssetUrl('/assets/mill_stage_5.jpg'), areaName: '古い水車小屋', icon: '🦉' };
    if (sId <= 42) return { bg: getAssetUrl('/assets/garden_stage_5.jpg'), areaName: 'ホタルの花園', icon: '🦌' };
    if (sId <= 49) return { bg: getAssetUrl('/assets/camp_stage_5.jpg'), areaName: 'せせらぎキャンプ場', icon: '🦝' };
    if (sId <= 56) return { bg: getAssetUrl('/assets/workshop_stage_5.jpg'), areaName: '木工ビーバー工房', icon: '🦔' };
    if (sId <= 63) return { bg: getAssetUrl('/assets/bridge_stage_5.jpg'), areaName: '太鼓橋の渓谷', icon: '🐒' };
    if (sId <= 70) return { bg: getAssetUrl('/assets/spring_stage_5.jpg'), areaName: '水晶の湧水池', icon: '🦢' };
    if (sId <= 77) return { bg: getAssetUrl('/assets/orchard_stage_5.jpg'), areaName: 'ベリーの果樹園', icon: '🦡' };
    if (sId <= 84) return { bg: getAssetUrl('/assets/waterfall_stage_5.jpg'), areaName: '霧立つ大滝', icon: '🦅' };
    if (sId <= 91) return { bg: getAssetUrl('/assets/stargaze_stage_5.jpg'), areaName: '森の星見台', icon: '🐿️' };
    if (sId <= 97) return { bg: getAssetUrl('/assets/sacred_stage_5.jpg'), areaName: '守り神の神木', icon: '🦊' };
    return { bg: getAssetUrl('/assets/paradise_stage_5.jpg'), areaName: 'ビーバーの桃源郷', icon: '🐻' };
  };

  // 開始時相棒スキル（フクロウ+2手、クマ+3手など）
  useEffect(() => {
    if (onStartTriggeredRef.current || !buddySkill) return;
    onStartTriggeredRef.current = true;

    if (buddySkill.creatureId === 'owl') {
      setMovesLeft((prev) => prev + 2);
      setBuddyCutIn('🦉 森の知恵袋フクロウの先見！手数が+2手増加！');
      sounds.playRainbow();
      setTimeout(() => setBuddyCutIn(null), 2500);
    } else if (buddySkill.creatureId === 'bear_family') {
      setMovesLeft((prev) => prev + 3);
      setBuddyCutIn('🐻 やさしいクマさんの剛力！手数が+3手増加！');
      sounds.playRainbow();
      setTimeout(() => setBuddyCutIn(null), 2500);
    }
  }, [buddySkill]);

  // ピンチ時スキル（白鳥: 残り2手以下で一度だけ+3手）
  useEffect(() => {
    if (movesLeft <= 2 && buddySkill?.creatureId === 'swan' && !swanTriggeredRef.current && gameResult === 'playing') {
      swanTriggeredRef.current = true;
      setMovesLeft((prev) => prev + 3);
      setBuddyCutIn('🦢 優美なコハクチョウの祈り！手数が+3手回復！✨');
      sounds.playRainbow();
      setTimeout(() => setBuddyCutIn(null), 2600);
    }
  }, [movesLeft, buddySkill, gameResult]);
  const [comboToast, setComboToast] = useState<string | null>(null);
  const [boosters, setBoosters] = useState<PlayerBoosters>(loadBoosters);
  const [winStreak, setWinStreak] = useState<number>(loadWinStreak);
  const [preBoosters, setPreBoosters] = useState<PreBoosters>(loadPreBoosters);
  const [selectedPreBoosters, setSelectedPreBoosters] = useState<{
    startRocket: boolean;
    startBomb: boolean;
    extraMoves: boolean;
  }>({ startRocket: false, startBomb: false, extraMoves: false });
  const [showStartModal, setShowStartModal] = useState<boolean>(true);
  const [dragOffset, setDragOffset] = useState<{
    r: number;
    c: number;
    dx: number;
    dy: number;
    targetR: number;
    targetC: number;
  } | null>(null);
  const [activeBooster, setActiveBooster] = useState<BoosterItemType | null>(null);

  // 開発者モードや外部変更イベントによるアイテム同期
  useEffect(() => {
    const handleBoostersUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<PlayerBoosters>;
      if (customEvent.detail) {
        setBoosters(customEvent.detail);
      } else {
        setBoosters(loadBoosters());
      }
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'beaver_puzzle_boosters') {
        setBoosters(loadBoosters());
      }
    };

    window.addEventListener('beaver-boosters-updated', handleBoostersUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('beaver-boosters-updated', handleBoostersUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const useBoosterCount = (type: BoosterItemType) => {
    setBoosters((prev) => {
      const next = { ...prev, [type]: Math.max(0, prev[type] - 1) };
      try {
        localStorage.setItem('beaver_puzzle_boosters', JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save boosters:', e);
      }
      return next;
    });
  };
  const [isShuffling, setIsShuffling] = useState(false);

  // 特殊ピースエフェクト用ステート
  interface ActiveLaser {
    id: number;
    r?: number;
    c?: number;
    direction: 'h' | 'v';
  }
  interface ActiveShockwave {
    id: number;
    r: number;
    c: number;
  }
  const [activeLasers, setActiveLasers] = useState<ActiveLaser[]>([]);
  const [activeShockwaves, setActiveShockwaves] = useState<ActiveShockwave[]>([]);

  const triggerLaserEffect = (r?: number, c?: number, direction: 'h' | 'v' = 'h') => {
    const laserId = Date.now() + Math.random();
    setActiveLasers((prev) => [...prev, { id: laserId, r, c, direction }]);
    setTimeout(() => {
      setActiveLasers((prev) => prev.filter((l) => l.id !== laserId));
    }, 650);
  };

  const triggerBombEffect = (r: number, c: number) => {
    const shockwaveId = Date.now() + Math.random();
    setActiveShockwaves((prev) => [...prev, { id: shockwaveId, r, c }]);
    setTimeout(() => {
      setActiveShockwaves((prev) => prev.filter((s) => s.id !== shockwaveId));
    }, 550);
  };
  const [rainbowTargets, setRainbowTargets] = useState<{ r: number; c: number }[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [introDismissed, setIntroDismissed] = useState<boolean>(!stage.newGimmickIntro);
  const [clearingTileIds, setClearingTileIds] = useState<Set<string>>(new Set());
  const [dropVersion, setDropVersion] = useState<number>(0);
  const isMouseDownRef = useRef<boolean>(false);
  const vinesClearedThisTurnRef = useRef<number>(0);

  // ★ヒント案内・コンボコール・ボーナスタイム用ステート
  const [hintTiles, setHintTiles] = useState<{ r: number; c: number }[] | null>(null);
  const [comboCall, setComboCall] = useState<{ id: number; text: string; color: string; combo: number } | null>(null);
  const [isBonusTime, setIsBonusTime] = useState<boolean>(false);
  const [finalClearedMovesLeft, setFinalClearedMovesLeft] = useState<number>(movesLeft);
  const isBonusTimeRef = useRef<boolean>(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerComboCall = (combo: number) => {
    let text = "";
    let color = "";
    if (combo === 2) {
      text = "Nice! 🪵";
      color = "from-amber-400 to-yellow-500 border-amber-300 text-amber-950";
    } else if (combo === 3) {
      text = "Great! ✨";
      color = "from-cyan-400 to-blue-500 border-cyan-300 text-slate-950";
    } else if (combo === 4) {
      text = "Amazing! 🚀";
      color = "from-purple-400 to-pink-500 border-purple-300 text-white";
    } else if (combo >= 5) {
      text = `BEAVER BLAST! 🦫💥 x${combo}`;
      color = "from-amber-400 via-rose-500 to-yellow-300 border-yellow-200 text-slate-950 font-black";
    }

    if (text) {
      const id = Date.now();
      setComboCall({ id, text, color, combo });
      setTimeout(() => {
        setComboCall((prev) => (prev?.id === id ? null : prev));
      }, 950);
    }
  };

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
        if (g.r >= 0 && g.r < numRows && g.c >= 0 && g.c < numCols) {
          newBoard[g.r][g.c].gimmick = { type: g.type, hp: g.hp, reward: (g as any).reward };
        }
      });
    }

    // ステージ初期下地（泥んこ）の適用
    if (stage.initialUnderlays) {
      stage.initialUnderlays.forEach((u) => {
        if (u.r >= 0 && u.r < numRows && u.c >= 0 && u.c < numCols) {
          newBoard[u.r][u.c].underlay = { type: u.type, hp: u.hp };
        }
      });
    }

    setBoard(newBoard);
    setMovesLeft(stage.maxMoves);
    setGameResult('playing');
    setSelectedPos(null);
    setComboToast(null);
  };

  // ★ステージ開始時のプレブースター消費＆連勝ボーナス初期配備
  const handleStartStage = () => {
    // 1. プレブースターの消費
    const updatedPre = { ...preBoosters };
    if (selectedPreBoosters.startRocket && updatedPre.startRocket > 0) updatedPre.startRocket--;
    if (selectedPreBoosters.startBomb && updatedPre.startBomb > 0) updatedPre.startBomb--;
    if (selectedPreBoosters.extraMoves && updatedPre.extraMoves > 0) updatedPre.extraMoves--;
    setPreBoosters(updatedPre);
    localStorage.setItem('beaver_puzzle_pre_boosters', JSON.stringify(updatedPre));

    // 2. 手数+3ボーナス
    const initialMoves = selectedPreBoosters.extraMoves ? stage.maxMoves + 3 : stage.maxMoves;
    setMovesLeft(initialMoves);

    // 3. 連勝ボーナス ＆ プレブースターの初期特殊ピース配置
    let bonusRockets = 0;
    let bonusBombs = 0;
    if (winStreak === 1) bonusRockets += 1;
    else if (winStreak === 2) { bonusRockets += 1; bonusBombs += 1; }
    else if (winStreak >= 3) { bonusRockets += 2; bonusBombs += 1; }

    if (selectedPreBoosters.startRocket) bonusRockets += 1;
    if (selectedPreBoosters.startBomb) bonusBombs += 1;

    if (bonusRockets > 0 || bonusBombs > 0) {
      setBoard((prev) => {
        const next = prev.map((row) => row.map((t) => ({ ...t })));
        const candidates: { r: number; c: number }[] = [];
        next.forEach((row, r) => {
          row.forEach((t, c) => {
            if (t.id !== '' && !t.disabled && !t.gimmick && t.special === 'none') {
              candidates.push({ r, c });
            }
          });
        });
        // シャッフル
        for (let i = candidates.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }
        let idx = 0;
        for (let i = 0; i < bonusRockets && idx < candidates.length; i++, idx++) {
          const { r, c } = candidates[idx];
          next[r][c].special = Math.random() < 0.5 ? 'rocket_h' : 'rocket_v';
        }
        for (let i = 0; i < bonusBombs && idx < candidates.length; i++, idx++) {
          const { r, c } = candidates[idx];
          next[r][c].special = 'bomb';
        }
        return next;
      });
      sounds.playRocket();
    }

    setShowStartModal(false);

    const map: { [key: string]: { required: number; current: number } } = {};
    stage.targets.forEach((t) => {
      map[t.type] = { required: t.required, current: 0 };
    });
    targetsRef.current = map;
    setTargets(map);
  };

  const generateValidBoard = (): Tile[][] => {
    const newBoard: Tile[][] = [];
    for (let r = 0; r < numRows; r++) {
      newBoard[r] = [];
      for (let c = 0; c < numCols; c++) {
        if (disabledSet.has(`${r},${c}`)) {
          newBoard[r][c] = {
            id: `disabled-${r}-${c}`,
            type: 'wood',
            special: 'none',
            disabled: true,
          };
          continue;
        }

        let type: PieceType;
        do {
          type = activePieceTypes[Math.floor(Math.random() * activePieceTypes.length)];
        } while (
          (r >= 2 && newBoard[r - 1]?.[c]?.type === type && newBoard[r - 2]?.[c]?.type === type) ||
          (c >= 2 && newBoard[r]?.[c - 1]?.type === type && newBoard[r]?.[c - 2]?.type === type)
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

    // 横方向の走査
    for (let r = 0; r < numRows; r++) {
      let c = 0;
      while (c < numCols - 2) {
        if (!b[r] || !b[r][c] || !b[r][c].id || b[r][c].disabled || b[r][c].gimmick?.type === 'rock') {
          c++;
          continue;
        }
        const type = b[r][c].type;
        let matchLen = 1;
        while (
          c + matchLen < numCols &&
          b[r][c + matchLen] &&
          b[r][c + matchLen].id &&
          !b[r][c + matchLen].disabled &&
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

    // 縦方向の走査
    for (let c = 0; c < numCols; c++) {
      let r = 0;
      while (r < numRows - 2) {
        if (!b[r] || !b[r][c] || !b[r][c].id || b[r][c].disabled || b[r][c].gimmick?.type === 'rock') {
          r++;
          continue;
        }
        const type = b[r][c].type;
        let matchLen = 1;
        while (
          r + matchLen < numRows &&
          b[r + matchLen] &&
          b[r + matchLen][c] &&
          b[r + matchLen][c].id &&
          !b[r + matchLen][c].disabled &&
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

    // 優先度②: L字・T字・交差 ➔ 爆弾 (bomb)！
    hMatches.forEach((hm, hIdx) => {
      if (hUsed.has(hIdx)) return;
      vMatches.forEach((vm, vIdx) => {
        if (vUsed.has(vIdx)) return;
        if (hm.type !== vm.type) return;

        const crossR = hm.r!;
        const crossC = vm.c!;
        if (
          crossR >= vm.start && crossR < vm.start + vm.len &&
          crossC >= hm.start && crossC < hm.start + hm.len
        ) {
          specials.push({ r: crossR, c: crossC, type: hm.type, special: 'bomb' });
          hUsed.add(hIdx);
          vUsed.add(vIdx);
        }
      });
    });

    // 優先度③: 残りの直線4個マッチ ➔ 横ロケット / 縦ロケット
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
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        // ツタや岩は動かせない
        if (b[r][c].gimmick?.type === 'vine' || b[r][c].gimmick?.type === 'rock') continue;

        if (c < numCols - 1 && b[r][c + 1].gimmick?.type !== 'vine' && b[r][c + 1].gimmick?.type !== 'rock') {
          const testBoard = b.map((row) => [...row]);
          const temp = testBoard[r][c];
          testBoard[r][c] = testBoard[r][c + 1];
          testBoard[r][c + 1] = temp;
          if (findMatches(testBoard).length > 0) return true;
        }
        if (r < numRows - 1 && b[r + 1][c].gimmick?.type !== 'vine' && b[r + 1][c].gimmick?.type !== 'rock') {
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

  // 有効な動かせる手を1組探索（アイドリング時のヒント案内用）
  const findAValidMove = (b: Tile[][]): { r1: number; c1: number; r2: number; c2: number } | null => {
    // 1. 特殊ピース同士の組み合わせを優先チェック
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        if (b[r][c].disabled || b[r][c].gimmick?.type === "vine" || b[r][c].gimmick?.type === "rock") continue;
        const s1 = b[r][c].special;
        const isSpec1 = s1 !== "none";

        if (c < numCols - 1 && !b[r][c + 1].disabled && b[r][c + 1].gimmick?.type !== "vine" && b[r][c + 1].gimmick?.type !== "rock") {
          const s2 = b[r][c + 1].special;
          if ((isSpec1 && s2 !== "none") || s1 === "rainbow" || s2 === "rainbow") {
            return { r1: r, c1: c, r2: r, c2: c + 1 };
          }
        }
        if (r < numRows - 1 && !b[r + 1][c].disabled && b[r + 1][c].gimmick?.type !== "vine" && b[r + 1][c].gimmick?.type !== "rock") {
          const s2 = b[r + 1][c].special;
          if ((isSpec1 && s2 !== "none") || s1 === "rainbow" || s2 === "rainbow") {
            return { r1: r, c1: c, r2: r + 1, c2: c };
          }
        }
      }
    }

    // 2. 通常マッチの組み合わせチェック
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        if (b[r][c].disabled || b[r][c].gimmick?.type === "vine" || b[r][c].gimmick?.type === "rock") continue;

        if (c < numCols - 1 && !b[r][c + 1].disabled && b[r][c + 1].gimmick?.type !== "vine" && b[r][c + 1].gimmick?.type !== "rock") {
          const testBoard = b.map((row) => [...row]);
          const temp = testBoard[r][c];
          testBoard[r][c] = testBoard[r][c + 1];
          testBoard[r][c + 1] = temp;
          if (findMatches(testBoard).length > 0) return { r1: r, c1: c, r2: r, c2: c + 1 };
        }
        if (r < numRows - 1 && !b[r + 1][c].disabled && b[r + 1][c].gimmick?.type !== "vine" && b[r + 1][c].gimmick?.type !== "rock") {
          const testBoard = b.map((row) => [...row]);
          const temp = testBoard[r][c];
          testBoard[r][c] = testBoard[r + 1][c];
          testBoard[r + 1][c] = temp;
          if (findMatches(testBoard).length > 0) return { r1: r, c1: c, r2: r + 1, c2: c };
        }
      }
    }
    return null;
  };

  // アイドリングヒントタイマー（3.8秒放置で動かせるペアをぷるぷる揺らしてアシスト）
  useEffect(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setHintTiles(null);

    if (!isAnimating && gameResult === "playing" && introDismissed && !selectedPos && !activeBooster && !isBonusTime) {
      idleTimerRef.current = setTimeout(() => {
        const move = findAValidMove(board);
        if (move) {
          setHintTiles([{ r: move.r1, c: move.c1 }, { r: move.r2, c: move.c2 }]);
        }
      }, 3800);
    }

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [board, isAnimating, gameResult, introDismissed, selectedPos, activeBooster, isBonusTime]);

  // 自動シャッフル
  const performShuffle = () => {
    setIsShuffling(true);
    setTimeout(() => {
      let shuffled: Tile[][];
      do {
        shuffled = generateValidBoard();
      } while (!hasPossibleMoves(shuffled));

      // 既存のギミックは引き継ぐ
      for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
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
    setHintTiles(null);
    if (isAnimating || gameResult !== 'playing' || !introDismissed) return;
    const tile = board[r][c];
    // ツタや岩はスワイプ不可
    if (tile.gimmick?.type === 'vine' || tile.gimmick?.type === 'rock' || tile.gimmick?.type === 'chest' || tile.gimmick?.type === 'boulder') return;

    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, r, c };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isAnimating || gameResult !== 'playing') return;

    const touch = e.touches[0];
    const rawDx = touch.clientX - touchStartRef.current.x;
    const rawDy = touch.clientY - touchStartRef.current.y;
    const { r, c } = touchStartRef.current;

    const isHorizontal = Math.abs(rawDx) >= Math.abs(rawDy);
    let targetR = r;
    let targetC = c;

    if (isHorizontal) {
      targetC = rawDx > 0 ? c + 1 : c - 1;
    } else {
      targetR = rawDy > 0 ? r + 1 : r - 1;
    }

    if (
      targetR < 0 || targetR >= numRows ||
      targetC < 0 || targetC >= numCols ||
      board[targetR][targetC].disabled ||
      board[targetR][targetC].gimmick?.type === 'vine' ||
      board[targetR][targetC].gimmick?.type === 'rock'
    ) {
      setDragOffset(null);
      return;
    }

    const maxOffset = 46;
    let clampedDx = 0;
    let clampedDy = 0;

    if (isHorizontal) {
      clampedDx = Math.max(-maxOffset, Math.min(maxOffset, rawDx));
    } else {
      clampedDy = Math.max(-maxOffset, Math.min(maxOffset, rawDy));
    }

    setDragOffset({ r, c, dx: clampedDx, dy: clampedDy, targetR, targetC });
  };

  const handleTouchEnd = () => {
    if (dragOffset) {
      const threshold = 22;
      const { r, c, dx, dy, targetR, targetC } = dragOffset;
      setDragOffset(null);
      touchStartRef.current = null;

      if (Math.abs(dx) >= threshold || Math.abs(dy) >= threshold) {
        sounds.playSwipe();
        swapTiles(r, c, targetR, targetC);
      }
    } else {
      touchStartRef.current = null;
    }
  };

  // マウスドラッグ操作（PC対応）
  const handleMouseDown = (r: number, c: number, e: React.MouseEvent) => {
    setHintTiles(null);
    if (isAnimating || gameResult !== 'playing' || !introDismissed) return;
    const tile = board[r][c];
    if (tile.gimmick?.type === 'vine' || tile.gimmick?.type === 'rock') return;

    touchStartRef.current = { x: e.clientX, y: e.clientY, r, c };
    isMouseDownRef.current = true;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDownRef.current || !touchStartRef.current || isAnimating || gameResult !== 'playing') return;

    const rawDx = e.clientX - touchStartRef.current.x;
    const rawDy = e.clientY - touchStartRef.current.y;
    const { r, c } = touchStartRef.current;

    const isHorizontal = Math.abs(rawDx) >= Math.abs(rawDy);
    let targetR = r;
    let targetC = c;

    if (isHorizontal) {
      targetC = rawDx > 0 ? c + 1 : c - 1;
    } else {
      targetR = rawDy > 0 ? r + 1 : r - 1;
    }

    if (
      targetR < 0 || targetR >= numRows ||
      targetC < 0 || targetC >= numCols ||
      board[targetR][targetC].disabled ||
      board[targetR][targetC].gimmick?.type === 'vine' ||
      board[targetR][targetC].gimmick?.type === 'rock'
    ) {
      setDragOffset(null);
      return;
    }

    const maxOffset = 46;
    let clampedDx = 0;
    let clampedDy = 0;

    if (isHorizontal) {
      clampedDx = Math.max(-maxOffset, Math.min(maxOffset, rawDx));
    } else {
      clampedDy = Math.max(-maxOffset, Math.min(maxOffset, rawDy));
    }

    setDragOffset({ r, c, dx: clampedDx, dy: clampedDy, targetR, targetC });
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    handleTouchEnd();
  };

  // 所持木材ポイントの参照・消費ヘルパー（アイテムクラフトや復活に使用）
  const getStoredWood = (): number => {
    try {
      const saved = localStorage.getItem('beaver_puzzle_state_v1_wood');
      return saved ? Number(saved) : 60;
    } catch {
      return 60;
    }
  };

  const spendWood = (cost: number): boolean => {
    const current = getStoredWood();
    if (current < cost) return false;
    const next = current - cost;
    try {
      localStorage.setItem('beaver_puzzle_state_v1_wood', String(next));
    } catch {}
    if (onAddWood) onAddWood(-cost);
    return true;
  };

  // ゲームオーバー時に手数を+5回復して延長再開
  const handleContinueWithClock = () => {
    if (boosters.clock > 0) {
      useBoosterCount('clock');
    } else {
      const ok = spendWood(50);
      if (!ok) {
        setComboToast('木材が足りません（必要: 50ウッド）🪵');
        setTimeout(() => setComboToast(null), 1500);
        return;
      }
    }
    sounds.playClock();
    setMovesLeft(5);
    setGameResult('playing');
    setComboToast('+5手延長！ゲーム再開！⏱️');
    setTimeout(() => setComboToast(null), 1500);
  };

  // お助けアイテムボタン押下ハンドラ
  const handleBoosterClick = (type: BoosterItemType) => {
    if (isAnimating || gameResult !== 'playing' || !introDismissed) return;

    // 残数0のとき：木材50で即時クラフト補充可能！
    if (boosters[type] <= 0) {
      const currentWood = getStoredWood();
      const itemName = type === 'hammer' ? '🔨木づち' : type === 'saw' ? '🪚ノコギリ' : type === 'tail' ? '🦫しっぽビンタ' : '⏱️ぜんまい時計';
      if (currentWood >= 50) {
        if (window.confirm(`${itemName}の残数が0です。\n木材 50 ウッドを消費して1個クラフトしますか？（所持: ${currentWood}ウッド）`)) {
          spendWood(50);
          setBoosters((prev) => {
            const next = { ...prev, [type]: prev[type] + 1 };
            try {
              localStorage.setItem('beaver_puzzle_boosters', JSON.stringify(next));
            } catch {}
            return next;
          });
          sounds.playStageClear();
          setComboToast(`${itemName}をクラフトしました！🪵✨`);
          setTimeout(() => setComboToast(null), 1500);
        }
      } else {
        setComboToast(`${itemName}が0個です（木材50でクラフト可）`);
        setTimeout(() => setComboToast(null), 1500);
      }
      return;
    }

    // ⏱️ ぜんまい時計：即時発動で手数を+5回復！
    if (type === 'clock') {
      useBoosterCount('clock');
      sounds.playClock();
      setMovesLeft((prev) => prev + 5);
      setComboToast('手数を +5 回復！⏱️');
      setTimeout(() => setComboToast(null), 1500);
      return;
    }

    // 照準系アイテム（木づち・ノコギリ・しっぽビンタ）

    if (activeBooster === type) {
      // 再タップでキャンセル
      setActiveBooster(null);
    } else {
      setActiveBooster(type);
      setSelectedPos(null);
      sounds.playSwipe();
    }
  };

  // 照準系お助けアイテムの発動処理（手数は消費しない！）
  const executeBooster = async (booster: BoosterItemType, targetR: number, targetC: number) => {
    setIsAnimating(true);
    useBoosterCount(booster);

    const collectedCounts: { [key: string]: number } = {};
    const newBoard: Tile[][] = board.map((row) => row.map((tile) => ({ ...tile })));

    if (booster === 'hammer') {
      // 🔨 木づち：狙った1マスを叩き割る！
      sounds.playHammer();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 250);

      const tile = newBoard[targetR][targetC];
      if (tile.underlay?.type === 'mud') {
        tile.underlay = undefined;
        collectedCounts['mud'] = (collectedCounts['mud'] || 0) + 1;
        sounds.playMudSplash();
      }
      if (tile.gimmick) {
        if (tile.gimmick.type === 'rock') {
          collectedCounts['rock'] = (collectedCounts['rock'] || 0) + 1;
          sounds.playRockBreak();
        } else if (tile.gimmick.type === 'ice') {
          collectedCounts['ice'] = (collectedCounts['ice'] || 0) + 1;
          sounds.playIceBreak();
        } else if (tile.gimmick.type === 'vine') {
          collectedCounts['vine'] = (collectedCounts['vine'] || 0) + 1;
          sounds.playVineCut();
          vinesClearedThisTurnRef.current += 1;
        } else if (tile.gimmick.type === 'boulder') {
          collectedCounts['boulder'] = (collectedCounts['boulder'] || 0) + 1;
          sounds.playRockBreak();
        } else if (tile.gimmick.type === 'chest') {
          collectedCounts['chest'] = (collectedCounts['chest'] || 0) + 1;
          sounds.playChestOpen();
          const reward = tile.gimmick.reward || 'bomb';
          tile.special = reward;
        }
        tile.gimmick = undefined;
      }
      if (tile.id !== '') {
        collectedCounts[tile.type] = (collectedCounts[tile.type] || 0) + 1;
        newBoard[targetR][targetC] = { id: '', type: 'wood', special: 'none' };
      }
    } else if (booster === 'saw') {
      // 🪚 ノコギリ：選択した横1列を一刀両断！
      sounds.playSaw();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 350);

      const laserId = Date.now();
      setActiveLasers([{ id: laserId, r: targetR, direction: 'h' }]);
      setTimeout(() => setActiveLasers([]), 650);

      for (let c = 0; c < numCols; c++) {
        const tile = newBoard[targetR][c];
        if (tile.disabled) continue;
        if (tile.underlay?.type === 'mud') {
          tile.underlay = undefined;
          collectedCounts['mud'] = (collectedCounts['mud'] || 0) + 1;
          sounds.playMudSplash();
        }
        if (tile.gimmick) {
          if (tile.gimmick.type === 'rock') {
            collectedCounts['rock'] = (collectedCounts['rock'] || 0) + 1;
            sounds.playRockBreak();
          } else if (tile.gimmick.type === 'ice') {
            collectedCounts['ice'] = (collectedCounts['ice'] || 0) + 1;
            sounds.playIceBreak();
          } else if (tile.gimmick.type === 'vine') {
            collectedCounts['vine'] = (collectedCounts['vine'] || 0) + 1;
            sounds.playVineCut();
            vinesClearedThisTurnRef.current += 1;
          } else if (tile.gimmick.type === 'boulder') {
            collectedCounts['boulder'] = (collectedCounts['boulder'] || 0) + 1;
            sounds.playRockBreak();
          } else if (tile.gimmick.type === 'chest') {
            collectedCounts['chest'] = (collectedCounts['chest'] || 0) + 1;
            sounds.playChestOpen();
            const reward = tile.gimmick.reward || 'rocket_h';
            tile.special = reward;
          }
          tile.gimmick = undefined;
        }
        if (tile.id !== '') {
          collectedCounts[tile.type] = (collectedCounts[tile.type] || 0) + 1;
          newBoard[targetR][c] = { id: '', type: 'wood', special: 'none' };
        }
      }
    } else if (booster === 'tail') {
      // 🦫 しっぽビンタ：周囲3×3マスを一撃粉砕！
      sounds.playTailSlap();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 450);

      try {
        confetti({
          particleCount: 35,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#854d0e', '#ca8a04', '#eab308', '#ffffff'],
        });
      } catch {}

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const r = targetR + dr;
          const c = targetC + dc;
          if (r >= 0 && r < numRows && c >= 0 && c < numCols) {
            const tile = newBoard[r][c];
            if (tile.disabled) continue;
            if (tile.underlay?.type === 'mud') {
              tile.underlay = undefined;
              collectedCounts['mud'] = (collectedCounts['mud'] || 0) + 1;
              sounds.playMudSplash();
            }
            if (tile.gimmick) {
              if (tile.gimmick.type === 'rock') {
                collectedCounts['rock'] = (collectedCounts['rock'] || 0) + 1;
                sounds.playRockBreak();
              } else if (tile.gimmick.type === 'ice') {
                collectedCounts['ice'] = (collectedCounts['ice'] || 0) + 1;
                sounds.playIceBreak();
              } else if (tile.gimmick.type === 'vine') {
                collectedCounts['vine'] = (collectedCounts['vine'] || 0) + 1;
                sounds.playVineCut();
                vinesClearedThisTurnRef.current += 1;
              } else if (tile.gimmick.type === 'boulder') {
                collectedCounts['boulder'] = (collectedCounts['boulder'] || 0) + 1;
                sounds.playRockBreak();
              } else if (tile.gimmick.type === 'chest') {
                collectedCounts['chest'] = (collectedCounts['chest'] || 0) + 1;
                sounds.playChestOpen();
                const reward = tile.gimmick.reward || 'bomb';
                tile.special = reward;
              }
              tile.gimmick = undefined;
            }
            if (tile.id !== '') {
              collectedCounts[tile.type] = (collectedCounts[tile.type] || 0) + 1;
              newBoard[r][c] = { id: '', type: 'wood', special: 'none' };
            }
          }
        }
      }
    }

    addCollectedTargets(collectedCounts);
    await new Promise((res) => setTimeout(res, 400));

    const settledBoard = await dropBoardWithGravity(newBoard);

    await new Promise((res) => setTimeout(res, 100));
    const nextResult = findMatchesAndSpecials(settledBoard);
    if (nextResult.matches.length > 0) {
      await processMatches(settledBoard, nextResult.matches, 1, nextResult.specialsToCreate);
    }

    // アイテム使用時は手数を消費せず、クリア状態のみチェック
    checkGameStatus(movesLeft);
    setIsAnimating(false);
  };

  const handleTileClick = async (r: number, c: number) => {
    setHintTiles(null);
    if (isAnimating || gameResult !== 'playing' || !introDismissed) return;
    const tile = board[r][c];
    if (tile.disabled) return;

    // ★お助けアイテム照準発動モード
    if (activeBooster) {
      const booster = activeBooster;
      setActiveBooster(null);
      await executeBooster(booster, r, c);
      return;
    }

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

  // 侵食ツタの増殖処理（ターン中にツタが1つも消去されなかった場合に隣接1マス侵食）
  const growVineIfPossible = (currentBoard: Tile[][]): Tile[][] => {
    const vineCoords: { r: number; c: number }[] = [];
    currentBoard.forEach((row, r) => {
      row.forEach((t, c) => {
        if (t.gimmick?.type === 'vine') {
          vineCoords.push({ r, c });
        }
      });
    });

    if (vineCoords.length === 0) return currentBoard;

    const candidateCoords: { r: number; c: number }[] = [];
    const dirs = [
      { dr: -1, dc: 0 },
      { dr: 1, dc: 0 },
      { dr: 0, dc: -1 },
      { dr: 0, dc: 1 },
    ];

    vineCoords.forEach(({ r, c }) => {
      dirs.forEach(({ dr, dc }) => {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < numRows && nc >= 0 && nc < numCols) {
          const target = currentBoard[nr][nc];
          if (!target.disabled && !target.gimmick && target.id !== '') {
            if (!candidateCoords.some((p) => p.r === nr && p.c === nc)) {
              candidateCoords.push({ r: nr, c: nc });
            }
          }
        }
      });
    });

    if (candidateCoords.length > 0) {
      const chosen = candidateCoords[Math.floor(Math.random() * candidateCoords.length)];
      const updated = currentBoard.map((row) => row.map((t) => ({ ...t })));
      updated[chosen.r][chosen.c].gimmick = { type: 'vine', hp: 1 };
      sounds.playVineGrow();
      setComboToast('ツタが侵食した！🌿');
      setTimeout(() => setComboToast(null), 1500);
      return updated;
    }
    return currentBoard;
  };

  const finishMove = () => {
    const nextMoves = movesLeft - 1;
    setMovesLeft(nextMoves);

    // ★侵食ツタのターン終了時チェック
    if (stage.creepingVine && vinesClearedThisTurnRef.current === 0) {
      setBoard((prevBoard) => growVineIfPossible(prevBoard));
    }
    // ターン終了時にツタ消去カウントをリセット
    vinesClearedThisTurnRef.current = 0;

    setTimeout(() => {
      checkGameStatus(nextMoves);
      setIsAnimating(false);

      if (!hasPossibleMoves(board) && nextMoves > 0 && gameResult === 'playing') {
        performShuffle();
      }
    }, 350);
  };

  // ★クリア後ボーナスタイム（余り手数がロケット・爆弾に変換され、全画面一斉連鎖大爆発！）
  const executeBonusTime = async (initialMoves: number) => {
    isBonusTimeRef.current = true;
    setIsBonusTime(true);
    setFinalClearedMovesLeft(initialMoves);
    setIsAnimating(true);

    try {
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.35 },
        colors: ["#f59e0b", "#10b981", "#3b82f6", "#ec4899", "#ffffff"],
      });
    } catch {}

    await new Promise((res) => setTimeout(res, 600));

    let currentMoves = initialMoves;
    let currentBoard = board.map((row) => row.map((t) => ({ ...t })));
    const createdSpecials: { r: number; c: number; special: SpecialType }[] = [];

    // 1手ずつ減らしながら通常ピースをロケット・爆弾に変換！
    while (currentMoves > 0) {
      currentMoves--;
      setMovesLeft(currentMoves);

      const candidates: { r: number; c: number }[] = [];
      for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
          const t = currentBoard[r][c];
          if (t.id !== "" && !t.disabled && !t.gimmick && t.special === "none") {
            candidates.push({ r, c });
          }
        }
      }

      if (candidates.length > 0) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        const newSpecial: SpecialType =
          Math.random() < 0.5 ? (Math.random() < 0.5 ? "rocket_h" : "rocket_v") : "bomb";
        currentBoard[pick.r][pick.c] = {
          ...currentBoard[pick.r][pick.c],
          special: newSpecial,
        };
        createdSpecials.push({ r: pick.r, c: pick.c, special: newSpecial });
        setBoard(currentBoard.map((row) => [...row]));
        sounds.playWoodMatch(1);
        await new Promise((res) => setTimeout(res, 120));
      } else {
        await new Promise((res) => setTimeout(res, 60));
      }
    }

    await new Promise((res) => setTimeout(res, 400));

    // 全ボーナス特殊ピースを一斉起爆＆大連鎖！！
    if (createdSpecials.length > 0) {
      const collectedCounts: { [key: string]: number } = {};
      currentBoard = await detonateSpecialsWithChainReaction(currentBoard, createdSpecials, collectedCounts);
      addCollectedTargets(collectedCounts);
      await new Promise((res) => setTimeout(res, 400));
      currentBoard = await dropBoardWithGravity(currentBoard);
      await new Promise((res) => setTimeout(res, 400));
    }

    // 満を持してクリアモーダルへ！
    setIsBonusTime(false);
    setGameResult("cleared");
    sounds.playStageClear();
    try {
      confetti({
        particleCount: 75,
        spread: 100,
        origin: { y: 0.45 },
        colors: ["#fbbf24", "#f59e0b", "#38bdf8", "#a855f7"],
      });
    } catch {}
    setIsAnimating(false);
  };

  const checkGameStatus = async (moves: number) => {
    const allDone = Object.values(targetsRef.current).every((t) => !t || t.current >= t.required);

    if (allDone) {
      if (moves > 0 && !isBonusTimeRef.current) {
        await executeBonusTime(moves);
      } else {
        setFinalClearedMovesLeft(moves);
        setGameResult("cleared");
        sounds.playStageClear();
        triggerConfetti();
      }
    } else if (moves <= 0) {
      setGameResult("failed");
    }
  };

  // 重力落下 / 浮力反転アニメーション共通処理
  const dropBoardWithGravity = async (b: Tile[][]): Promise<Tile[][]> => {
    // マスの下地（泥んこ）はピース落下・補充に関わらず座標に固定保持する
    const originalUnderlays: (TileUnderlay | undefined)[][] = b.map((row) =>
      row.map((tile) => (tile.underlay ? { ...tile.underlay } : undefined))
    );
    const fallenBoard: Tile[][] = b.map((row) => row.map((tile) => ({ ...tile, dropDistance: 0 })));
    let hasFalling = false;

    if (gravityDir === 'up') {
      // ★浮力反転（下から上へ浮かび上がる！）
      for (let c = 0; c < numCols; c++) {
        let emptyRow = 0;
        for (let r = 0; r < numRows; r++) {
          if (fallenBoard[r][c].disabled) {
            emptyRow = r + 1;
            continue;
          }
          if (fallenBoard[r][c].id !== '') {
            if (emptyRow !== r) {
              const dist = r - emptyRow;
              fallenBoard[emptyRow][c] = {
                ...fallenBoard[r][c],
                dropDistance: dist,
              };
              fallenBoard[r][c] = { id: '', type: 'wood', special: 'none', dropDistance: 0 };
              hasFalling = true;
            }
            emptyRow++;
          }
        }
        const totalNew = numRows - emptyRow;
        for (let r = emptyRow; r < numRows; r++) {
          if (fallenBoard[r][c].disabled) continue;
          const type = activePieceTypes[Math.floor(Math.random() * activePieceTypes.length)];
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
    } else {
      // ★通常落下（上から下へ落下）
      for (let c = 0; c < numCols; c++) {
        let emptyRow = numRows - 1;
        for (let r = numRows - 1; r >= 0; r--) {
          if (fallenBoard[r][c].disabled) {
            emptyRow = r - 1;
            continue;
          }
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
        const totalNew = emptyRow + 1;
        for (let r = emptyRow; r >= 0; r--) {
          if (fallenBoard[r][c].disabled) continue;
          const type = activePieceTypes[Math.floor(Math.random() * activePieceTypes.length)];
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
    }

    if (hasFalling) {
      setDropVersion((v) => v + 1);
      setBoard(fallenBoard);

      await new Promise((res) => setTimeout(res, 380));
      sounds.playDrop();

      const settledBoard = fallenBoard.map((row, r) =>
        row.map((tile, c) => ({
          ...tile,
          underlay: originalUnderlays[r][c],
          dropDistance: 0,
        }))
      );
      setBoard(settledBoard);
      return settledBoard;
    } else {
      for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
          fallenBoard[r][c].underlay = originalUnderlays[r][c];
        }
      }
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

    let newBoard = b.map((row) => row.map((tile) => ({ ...tile })));
    const collectedCounts: { [key: string]: number } = {};

    matches.forEach(({ r, c }) => {
      const type = b[r][c].type;
      collectedCounts[type] = (collectedCounts[type] || 0) + 1;

      // もしマッチしたタイル自身にツタが絡まっていたらツタ解除！
      if (newBoard[r][c].gimmick?.type === 'vine') {
        newBoard[r][c].gimmick = undefined;
        sounds.playVineCut();
        collectedCounts['vine'] = (collectedCounts['vine'] || 0) + 1;
        vinesClearedThisTurnRef.current += 1;
      }

      // マスの下地（泥んこ）消去
      if (newBoard[r][c].underlay?.type === 'mud') {
        newBoard[r][c].underlay!.hp -= 1;
        if (newBoard[r][c].underlay!.hp <= 0) {
          newBoard[r][c].underlay = undefined;
          collectedCounts['mud'] = (collectedCounts['mud'] || 0) + 1;
          sounds.playMudSplash();
        }
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
        if (nr >= 0 && nr < numRows && nc >= 0 && nc < numCols) {
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
              } else if (g.type === 'boulder') {
                // 🗿 ダムの巨石（HP3〜1）
                g.hp -= 1;
                sounds.playRockBreak();
                if (g.hp <= 0) {
                  targetTile.gimmick = undefined;
                  targetTile.id = '';
                  collectedCounts['boulder'] = (collectedCounts['boulder'] || 0) + 1;
                }
              } else if (g.type === 'chest') {
                // 📦 木工のからくり宝箱（HP3〜1）
                g.hp -= 1;
                if (g.hp <= 0) {
                  targetTile.gimmick = undefined;
                  collectedCounts['chest'] = (collectedCounts['chest'] || 0) + 1;
                  sounds.playChestOpen();
                  // 宝箱オープン！中からロケットまたは爆弾が飛び出すボーナス！
                  const reward = g.reward || (Math.random() < 0.5 ? 'rocket_h' : 'bomb');
                  targetTile.special = reward;
                } else {
                  sounds.playChestHit();
                }
              }
            }
          }
        }
      });
    });

    // ターゲット加算 & 即時クリア判定
    addCollectedTargets(collectedCounts);

    // ★特殊ピース（ロケット・爆弾）の起爆 ＆ 誘爆連鎖！
    const initialSpecials = matches
      .filter(
        ({ r, c }) =>
          b[r][c].special === 'rocket_h' ||
          b[r][c].special === 'rocket_v' ||
          b[r][c].special === 'bomb'
      )
      .map(({ r, c }) => ({ r, c, special: b[r][c].special }));

    if (initialSpecials.length > 0) {
      newBoard = await detonateSpecialsWithChainReaction(newBoard, initialSpecials, collectedCounts);
      addCollectedTargets(collectedCounts);
      await new Promise((res) => setTimeout(res, 200));
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
      triggerComboCall(currentCombo + 1);
      await processMatches(settledBoard, nextResult.matches, currentCombo + 1, nextResult.specialsToCreate);
    }
  };

  // タイルおよびギミック・下地（泥んこ）の汎用破壊・素材回収ヘルパー
  const destroyTileAt = (
    b: Tile[][],
    r: number,
    c: number,
    collectedCounts: { [key: string]: number }
  ) => {
    const tile = b[r][c];
    if (tile.disabled) return;

    // 下地（泥んこ）消去
    if (tile.underlay?.type === 'mud') {
      tile.underlay = undefined;
      collectedCounts['mud'] = (collectedCounts['mud'] || 0) + 1;
      sounds.playMudSplash();
    }

    // ギミック破壊
    if (tile.gimmick) {
      if (tile.gimmick.type === 'rock') {
        collectedCounts['rock'] = (collectedCounts['rock'] || 0) + 1;
        sounds.playRockBreak();
      } else if (tile.gimmick.type === 'ice') {
        collectedCounts['ice'] = (collectedCounts['ice'] || 0) + 1;
        sounds.playIceBreak();
      } else if (tile.gimmick.type === 'vine') {
        collectedCounts['vine'] = (collectedCounts['vine'] || 0) + 1;
        sounds.playVineCut();
        vinesClearedThisTurnRef.current += 1;
      } else if (tile.gimmick.type === 'boulder') {
        collectedCounts['boulder'] = (collectedCounts['boulder'] || 0) + 1;
        sounds.playRockBreak();
      } else if (tile.gimmick.type === 'chest') {
        collectedCounts['chest'] = (collectedCounts['chest'] || 0) + 1;
        sounds.playChestOpen();
        const reward = tile.gimmick.reward || (Math.random() < 0.5 ? 'rocket_h' : 'bomb');
        tile.special = reward;
      }
      tile.gimmick = undefined;
    }

    if (tile.id !== '') {
      collectedCounts[tile.type] = (collectedCounts[tile.type] || 0) + 1;
      if (tile.special === 'none') {
        b[r][c] = { id: '', type: 'wood', special: 'none', underlay: tile.underlay };
      }
    }
  };

  // ★連鎖起爆エンジン（ロケットや爆弾の爆風・ビームが他のロケットや爆弾に触れた時、連鎖して起爆！）
  const detonateSpecialsWithChainReaction = async (
    targetBoard: Tile[][],
    initialSpecials: { r: number; c: number; special: SpecialType }[],
    collectedCounts: { [key: string]: number }
  ): Promise<Tile[][]> => {
    let b = targetBoard.map((row) => row.map((t) => ({ ...t })));
    const queue: { r: number; c: number; special: SpecialType }[] = [...initialSpecials];
    const queuedSet = new Set<string>(initialSpecials.map((s) => `${s.r},${s.c}`));
    const detonatedSet = new Set<string>();

    while (queue.length > 0) {
      const item = queue.shift()!;
      const key = `${item.r},${item.c}`;
      if (detonatedSet.has(key)) continue;
      detonatedSet.add(key);

      const { r, c, special } = item;
      const hitCoords: { r: number; c: number }[] = [];

      if (special === "rocket_h") {
        sounds.playRocket();
        triggerLaserEffect(r, undefined, "h");
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 300);
        for (let col = 0; col < numCols; col++) {
          hitCoords.push({ r, c: col });
        }
      } else if (special === "rocket_v") {
        sounds.playRocket();
        triggerLaserEffect(undefined, c, "v");
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 300);
        for (let row = 0; row < numRows; row++) {
          hitCoords.push({ r: row, c });
        }
      } else if (special === "bomb") {
        sounds.playBomb(false);
        triggerBombEffect(r, c);
        try {
          confetti({
            particleCount: 25,
            spread: 75,
            origin: { x: (c + 0.5) / numCols, y: 0.35 + ((r + 0.5) / numRows) * 0.35 },
            colors: ["#f59e0b", "#fbbf24", "#ef4444", "#ffffff"],
          });
        } catch {}
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 450);
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < numRows && nc >= 0 && nc < numCols) {
              hitCoords.push({ r: nr, c: nc });
            }
          }
        }
      }

      for (const coord of hitCoords) {
        const targetTile = b[coord.r][coord.c];
        const targetKey = `${coord.r},${coord.c}`;

        if (
          !queuedSet.has(targetKey) &&
          (targetTile.special === "rocket_h" ||
           targetTile.special === "rocket_v" ||
           targetTile.special === "bomb")
        ) {
          queuedSet.add(targetKey);
          queue.push({ r: coord.r, c: coord.c, special: targetTile.special });
        }

        destroyTileAt(b, coord.r, coord.c, collectedCounts);
        b[coord.r][coord.c] = { id: "", type: "wood", special: "none" };
      }

      if (queue.length > 0) {
        setBoard(b.map((row) => [...row]));
        await new Promise((res) => setTimeout(res, 200));
      }
    }

    return b;
  };

  // ロケット起爆（横、縦、または十字にビームを発射して消去、誘爆連鎖対応）
  const executeRocketClear = async (
    b: Tile[][],
    hitR: number,
    hitC: number,
    mode: "h" | "v" | "cross" = "cross"
  ) => {
    const specialsToTrigger: { r: number; c: number; special: SpecialType }[] = [];
    if (mode === "h" || mode === "cross") {
      specialsToTrigger.push({ r: hitR, c: hitC, special: "rocket_h" });
    }
    if (mode === "v" || mode === "cross") {
      specialsToTrigger.push({ r: hitR, c: hitC, special: "rocket_v" });
    }

    const collectedCounts: { [key: string]: number } = {};
    const newBoard = await detonateSpecialsWithChainReaction(b, specialsToTrigger, collectedCounts);
    addCollectedTargets(collectedCounts);
    await new Promise((res) => setTimeout(res, 450));

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
      if (r >= 0 && r < numRows) {
        lasers.push({ id: laserId++, r, direction: 'h' });
      }
    }
    for (let dc = -1; dc <= 1; dc++) {
      const c = hitC + dc;
      if (c >= 0 && c < numCols) {
        lasers.push({ id: laserId++, c, direction: 'v' });
      }
    }
    setActiveLasers(lasers);
    setTimeout(() => setActiveLasers([]), 800);

    const collectedCounts: { [key: string]: number } = {};
    let newBoard: Tile[][] = b.map((row) => row.map((t) => ({ ...t })));
    const targetsToClear = new Set<string>();

    // 横3列の全マス
    for (let dr = -1; dr <= 1; dr++) {
      const r = hitR + dr;
      if (r >= 0 && r < numRows) {
        for (let col = 0; col < numCols; col++) targetsToClear.add(`${r},${col}`);
      }
    }
    // 縦3列の全マス
    for (let dc = -1; dc <= 1; dc++) {
      const c = hitC + dc;
      if (c >= 0 && c < numCols) {
        for (let row = 0; row < numRows; row++) targetsToClear.add(`${row},${c}`);
      }
    }

    const secondarySpecials: { r: number; c: number; special: SpecialType }[] = [];
    targetsToClear.forEach((coord) => {
      const [r, c] = coord.split(',').map(Number);
      const t = newBoard[r][c];
      if (t.special === 'rocket_h' || t.special === 'rocket_v' || t.special === 'bomb') {
        secondarySpecials.push({ r, c, special: t.special });
      }
      destroyTileAt(newBoard, r, c, collectedCounts);
      newBoard[r][c] = { id: '', type: 'wood', special: 'none' };
    });

    addCollectedTargets(collectedCounts);
    await new Promise((res) => setTimeout(res, 450));

    // メガ十字レーザーに巻き込まれた他の特殊ピースも連鎖起爆！
    if (secondarySpecials.length > 0) {
      newBoard = await detonateSpecialsWithChainReaction(newBoard, secondarySpecials, collectedCounts);
      addCollectedTargets(collectedCounts);
    }

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
    let newBoard: Tile[][] = b.map((row) => row.map((t) => ({ ...t })));

    const secondarySpecials: { r: number; c: number; special: SpecialType }[] = [];
    // 周囲3マス（盤面7×7全体を網羅）
    for (let dr = -3; dr <= 3; dr++) {
      for (let dc = -3; dc <= 3; dc++) {
        const r = hitR + dr;
        const c = hitC + dc;
        if (r >= 0 && r < numRows && c >= 0 && c < numCols) {
          const tile = newBoard[r][c];
          if (tile.id !== '') {
            if (tile.special === 'rocket_h' || tile.special === 'rocket_v' || tile.special === 'bomb') {
              secondarySpecials.push({ r, c, special: tile.special });
            }
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
    await new Promise((res) => setTimeout(res, 450));

    // メガ爆弾に巻き込まれた他の特殊ピースも連鎖起爆！
    if (secondarySpecials.length > 0) {
      newBoard = await detonateSpecialsWithChainReaction(newBoard, secondarySpecials, collectedCounts);
      addCollectedTargets(collectedCounts);
    }

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

    let newBoard: Tile[][] = b.map((row) => row.map((t) => ({ ...t })));
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
          if (nr >= 0 && nr < numRows && nc >= 0 && nc < numCols) {
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

    let newBoard: Tile[][] = b.map((row) => row.map((t) => ({ ...t })));
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
        for (let col = 0; col < numCols; col++) targetsToClear.add(`${rk.r},${col}`);
      } else {
        for (let row = 0; row < numRows; row++) targetsToClear.add(`${row},${rk.c}`);
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
      className="flex flex-col items-center justify-between min-h-screen text-white max-w-md mx-auto px-3.5 pb-[max(env(safe-area-inset-bottom,0px),14px)] pt-[max(env(safe-area-inset-top,0px),16px)] select-none relative overflow-hidden bg-cover bg-top"
      style={{ backgroundImage: `url("${getStageBackgroundInfo(stage.id).bg}")` }}
    >
      {/* 画面全体の可読性・奥行きを高めるグラデーション */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/60 pointer-events-none" />
      {/* ステージ開始前モーダル（目標確認・連勝ボーナス・プレブースター持ち込み） */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-gradient-to-b from-amber-950/95 via-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-5 shadow-2xl text-center space-y-4">
            {/* ヘッダー */}
            <div>
              <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                {getStageBackgroundInfo(stage.id).icon} {getStageBackgroundInfo(stage.id).areaName}
              </span>
              <h3 className="text-xl font-black text-white mt-1.5 flex items-center justify-center space-x-2">
                <span>ステージ {stage.id}</span>
                {winStreak > 0 && (
                  <span className="text-xs bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                    🔥 {winStreak}連勝中
                  </span>
                )}
              </h3>
            </div>

            {/* 目標ターゲット一覧 */}
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-amber-500/20">
              <span className="text-[10px] text-slate-400 font-bold block mb-2">クリア目標 (手数: {stage.maxMoves}手)</span>
              <div className="flex items-center justify-center space-x-3">
                {stage.targets.map((tgt) => {
                  const pieceCfg = (PIECE_CONFIG as any)[tgt.type];
                  return (
                    <div key={tgt.type} className="flex flex-col items-center bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700/60 shadow-inner">
                      <span className="text-2xl drop-shadow-sm">{pieceCfg ? pieceCfg.icon : '🎯'}</span>
                      <span className="text-xs font-black text-amber-200 mt-0.5">x{tgt.required}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 連勝ボーナス枠 */}
            {winStreak > 0 && (
              <div className="bg-gradient-to-r from-orange-950/60 to-amber-950/60 p-2.5 rounded-2xl border border-orange-500/40 text-left flex items-center space-x-2.5">
                <span className="text-2xl drop-shadow-sm">🔥</span>
                <div className="flex-1 text-[11px]">
                  <div className="font-black text-amber-300">連勝ボーナス発動中！</div>
                  <div className="text-slate-300 text-[10px]">
                    開始時に {winStreak === 1 ? '🚀 ロケットx1' : winStreak === 2 ? '🚀 ロケットx1 + 💣 爆弾x1' : '🚀 ロケットx2 + 💣 爆弾x1'} を初期配備！
                  </div>
                </div>
              </div>
            )}

            {/* プレブースター持ち込み選択 */}
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] text-slate-400 font-bold block px-1">アイテムを持ち込む</span>
              <div className="grid grid-cols-3 gap-2">
                {/* 初期ロケット */}
                <button
                  type="button"
                  onClick={() => {
                    if (preBoosters.startRocket > 0) {
                      setSelectedPreBoosters((prev) => ({ ...prev, startRocket: !prev.startRocket }));
                    }
                  }}
                  disabled={preBoosters.startRocket <= 0}
                  className={`p-2 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                    selectedPreBoosters.startRocket
                      ? 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-400 shadow-md shadow-amber-500/20'
                      : preBoosters.startRocket > 0
                      ? 'bg-slate-900/80 border-slate-700/80 hover:bg-slate-800'
                      : 'bg-slate-950/40 border-slate-800 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <img src={getAssetUrl("/assets/piece_rocket.png")} alt="初期ロケット" className="w-8 h-8 object-contain drop-shadow-sm" />
                  <span className="text-[10px] font-bold text-slate-200 mt-0.5">初期ロケット</span>
                  <span className="text-[9px] font-black text-amber-300 bg-slate-950/80 px-1.5 py-0.2 rounded-full mt-1 border border-slate-700">
                    所持: {preBoosters.startRocket}
                  </span>
                </button>

                {/* 初期爆弾 */}
                <button
                  type="button"
                  onClick={() => {
                    if (preBoosters.startBomb > 0) {
                      setSelectedPreBoosters((prev) => ({ ...prev, startBomb: !prev.startBomb }));
                    }
                  }}
                  disabled={preBoosters.startBomb <= 0}
                  className={`p-2 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                    selectedPreBoosters.startBomb
                      ? 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-400 shadow-md shadow-amber-500/20'
                      : preBoosters.startBomb > 0
                      ? 'bg-slate-900/80 border-slate-700/80 hover:bg-slate-800'
                      : 'bg-slate-950/40 border-slate-800 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <img src={getAssetUrl("/assets/piece_bomb.png")} alt="初期爆弾" className="w-8 h-8 object-contain drop-shadow-sm" />
                  <span className="text-[10px] font-bold text-slate-200 mt-0.5">初期爆弾</span>
                  <span className="text-[9px] font-black text-amber-300 bg-slate-950/80 px-1.5 py-0.2 rounded-full mt-1 border border-slate-700">
                    所持: {preBoosters.startBomb}
                  </span>
                </button>

                {/* 手数+3 */}
                <button
                  type="button"
                  onClick={() => {
                    if (preBoosters.extraMoves > 0) {
                      setSelectedPreBoosters((prev) => ({ ...prev, extraMoves: !prev.extraMoves }));
                    }
                  }}
                  disabled={preBoosters.extraMoves <= 0}
                  className={`p-2 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                    selectedPreBoosters.extraMoves
                      ? 'bg-cyan-500/25 border-cyan-400 ring-2 ring-cyan-400 shadow-md shadow-cyan-500/20'
                      : preBoosters.extraMoves > 0
                      ? 'bg-slate-900/80 border-slate-700/80 hover:bg-slate-800'
                      : 'bg-slate-950/40 border-slate-800 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <img src={getAssetUrl("/assets/booster_extra_moves.png")} alt="手数+3手" className="w-8 h-8 object-contain drop-shadow-sm" />
                  <span className="text-[10px] font-bold text-slate-200 mt-0.5">手数 +3手</span>
                  <span className="text-[9px] font-black text-cyan-300 bg-slate-950/80 px-1.5 py-0.2 rounded-full mt-1 border border-slate-700">
                    所持: {preBoosters.extraMoves}
                  </span>
                </button>
              </div>
            </div>

            {/* ボタン群 */}
            <div className="pt-2 flex items-center space-x-2">
              <button
                type="button"
                onClick={onExit}
                className="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
              >
                戻る
              </button>
              <button
                type="button"
                onClick={handleStartStage}
                className="flex-1 py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-amber-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-500/30 active:scale-98 transition-transform cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>スタート！</span>
                <span>🎮</span>
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* 相棒スキル発動カットインアニメーション */}
      {buddyCutIn && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-60 bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 text-slate-950 px-4 py-2 rounded-2xl shadow-2xl font-black text-xs flex items-center space-x-2.5 animate-bounce-subtle ring-2 ring-white drop-shadow-lg whitespace-nowrap">
          {buddySkill?.creatureImage && (
            <img
              src={getAssetUrl(buddySkill.creatureImage)}
              alt={buddySkill.creatureName}
              className="w-7 h-7 object-contain drop-shadow"
            />
          )}
          <Sparkles className="w-4 h-4 fill-current text-slate-950 shrink-0" />
          <span>{buddyCutIn}</span>
        </div>
      )}

      {/* 上部ヘッダー（ステージ名・残り手数・目標材料を最上部に一体化配置） */}
      <div className="w-full p-2 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-amber-500/30 shadow-xl z-20 space-y-1.5">
        {/* 相棒バディ情報バナー */}
        {buddySkill && (
          <div className="flex items-center justify-between px-2.5 py-1 bg-slate-900/90 rounded-xl border border-amber-500/25 text-[10px]">
            <div className="flex items-center space-x-1.5">
              <span className="text-sm leading-none">{buddySkill.creatureIcon}</span>
              <span className="font-black text-amber-200">{buddySkill.creatureName}</span>
              <span className="text-slate-400 font-medium">({buddySkill.name})</span>
            </div>
            <span className={`px-1.5 py-0.2 rounded-md font-bold text-[9px] border ${buddySkill.badgeColor}`}>
              {buddySkill.shortDesc}
            </span>
          </div>
        )}
        {/* 最上段：戻るボタン、ステージ名、操作ボタン */}
        <div className="flex items-center justify-between">
          <button
            onClick={onExit}
            className="p-1.5 text-amber-200 hover:text-white rounded-xl bg-amber-950/60 hover:bg-amber-900/80 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="text-center">
            <div className="inline-flex items-center space-x-1 px-2 py-0.2 rounded-full bg-slate-900/80 border border-emerald-400/40 text-[9px] text-emerald-300 font-bold mb-0.5">
              <span>{getStageBackgroundInfo(stage.id).icon}</span>
              <span>{getStageBackgroundInfo(stage.id).areaName}</span>
            </div>
            <div className="flex items-center justify-center space-x-1.5">
              <h2 className="text-xs sm:text-sm font-black text-amber-300 tracking-wide drop-shadow-sm">
                {stage.title}
              </h2>
              {winStreak > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.2 bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-[9px] rounded-full shadow-sm animate-pulse">
                  🔥 x{winStreak}
                </span>
              )}
            </div>
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
                onSetWood={onSetWood}
                onUnlockAllAreas={onUnlockAllAreas}
                onResetAreas={onResetAreas}
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
                t.type === 'ice' ? '🧊' :
                t.type === 'rock' ? '🪨' :
                t.type === 'vine' ? '🌿' :
                t.type === 'mud' ? '🟫' :
                t.type === 'chest' ? '📦' :
                t.type === 'boulder' ? '🗿' :
                PIECE_CONFIG[t.type]?.icon || '🪵';
              const label =
                t.type === 'ice' ? '氷' :
                t.type === 'rock' ? '岩' :
                t.type === 'vine' ? 'ツタ' :
                t.type === 'mud' ? '泥んこ' :
                t.type === 'chest' ? '宝箱' :
                t.type === 'boulder' ? '巨石' :
                PIECE_CONFIG[t.type]?.label || '素材';

              const gimmickImg =
                t.type === 'ice' ? getAssetUrl('/assets/gimmick_ice.png') :
                t.type === 'rock' ? getAssetUrl('/assets/gimmick_rock.png') :
                t.type === 'vine' ? getAssetUrl('/assets/gimmick_vine.png') :
                t.type === 'mud' ? getAssetUrl('/assets/gimmick_mud.png') :
                t.type === 'chest' ? getAssetUrl('/assets/gimmick_chest.png') :
                t.type === 'boulder' ? getAssetUrl('/assets/gimmick_rock.png') :
                null;
              const targetImg = gimmickImg || PIECE_CONFIG[t.type]?.image;
              return (
                <div key={t.type} className="flex items-center space-x-1">
                  {targetImg ? (
                    <img src={targetImg} alt={label} className="w-5 h-5 object-contain drop-shadow-sm" />
                  ) : (
                    <span className="text-lg drop-shadow-sm">{icon}</span>
                  )}
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
        {/* コンボ演出コールバナー */}
        {comboCall && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none animate-combo-call">
            <div className={`px-5 py-2.5 rounded-2xl bg-gradient-to-r ${comboCall.color} border-2 shadow-[0_12px_36px_rgba(0,0,0,0.8)] text-center whitespace-nowrap`}>
              <span className="text-xl sm:text-2xl font-black tracking-wider drop-shadow-md">
                {comboCall.text}
              </span>
            </div>
          </div>
        )}

        {/* ボーナスタイム中バナー */}
        {isBonusTime && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-bonus-pulse whitespace-nowrap">
            <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 text-slate-950 font-black text-xs sm:text-sm tracking-widest shadow-[0_0_24px_rgba(251,191,36,0.95)] border-2 border-yellow-100 flex items-center space-x-1.5">
              <span>🎉</span>
              <span>BONUS FEVER TIME!!</span>
              <span>🚀💣</span>
            </div>
          </div>
        )}

        {/* 爆弾ショックウェーブリング演出 */}
        {activeShockwaves.map((sw) => {
          const topPercent = ((sw.r + 0.5) / numRows) * 100;
          const leftPercent = ((sw.c + 0.5) / numCols) * 100;
          return (
            <div
              key={`shockwave-${sw.id}`}
              style={{ top: `${topPercent}%`, left: `${leftPercent}%` }}
              className="absolute w-28 h-28 rounded-full border-4 border-amber-400 bg-orange-500/25 animate-shockwave z-30 pointer-events-none"
            />
          );
        })}

        {/* レーザー光線 ＆ ロケット疾走演出 */}
        {activeLasers.map((laser) => {
          if (laser.direction === "h" && laser.r !== undefined) {
            const topPercent = ((laser.r + 0.5) / numRows) * 100;
            return (
              <div
                key={`laser-${laser.id}`}
                style={{ top: `${topPercent}%` }}
                className="absolute left-1 right-1 -translate-y-1/2 h-6 flex items-center justify-center z-30 pointer-events-none overflow-hidden"
              >
                {/* 閃光ビーム本体 */}
                <div className="w-full h-4 bg-gradient-to-r from-amber-500 via-yellow-100 to-amber-500 rounded-full blur-[1px] shadow-[0_0_24px_rgba(251,191,36,0.95)] animate-laser-h">
                  <div className="w-full h-full bg-white/95 rounded-full blur-[0.5px]" />
                </div>
                {/* 左右へ疾走するロケットスプライト */}
                <img
                  src={getAssetUrl("/assets/piece_rocket.png")}
                  alt="ロケット"
                  className="absolute w-8 h-8 object-contain rotate-90 animate-rocket-dash-h-right drop-shadow-[0_0_10px_rgba(251,191,36,1)]"
                />
                <img
                  src={getAssetUrl("/assets/piece_rocket.png")}
                  alt="ロケット"
                  className="absolute w-8 h-8 object-contain -rotate-90 animate-rocket-dash-h-left drop-shadow-[0_0_10px_rgba(251,191,36,1)]"
                />
              </div>
            );
          }
          if (laser.direction === "v" && laser.c !== undefined) {
            const leftPercent = ((laser.c + 0.5) / numCols) * 100;
            return (
              <div
                key={`laser-${laser.id}`}
                style={{ left: `${leftPercent}%` }}
                className="absolute top-1 bottom-1 -translate-x-1/2 w-6 flex items-center justify-center z-30 pointer-events-none overflow-hidden"
              >
                <div className="w-4 h-full bg-gradient-to-b from-amber-500 via-yellow-100 to-amber-500 rounded-full blur-[1px] shadow-[0_0_24px_rgba(251,191,36,0.95)] animate-laser-v">
                  <div className="w-full h-full bg-white/95 rounded-full blur-[0.5px]" />
                </div>
                {/* 上下へ疾走するロケットスプライト */}
                <img
                  src={getAssetUrl("/assets/piece_rocket.png")}
                  alt="ロケット"
                  className="absolute w-8 h-8 object-contain rotate-180 animate-rocket-dash-v-down drop-shadow-[0_0_10px_rgba(251,191,36,1)]"
                />
                <img
                  src={getAssetUrl("/assets/piece_rocket.png")}
                  alt="ロケット"
                  className="absolute w-8 h-8 object-contain rotate-0 animate-rocket-dash-v-up drop-shadow-[0_0_10px_rgba(251,191,36,1)]"
                />
              </div>
            );
          }
          return null;
        })}
        <div
          className="grid gap-1.5 justify-center items-center"
          style={{
            gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))`,
          }}
        >
          {board.map((row, r) =>
            row.map((tile, c) => {
              const cellSizeClass =
                numCols <= 6
                  ? 'w-12 h-12 sm:w-14 sm:h-14 text-2xl'
                  : numCols === 7
                  ? 'w-11 h-11 sm:w-12 sm:h-12 text-2xl'
                  : numCols === 8
                  ? 'w-9 h-9 sm:w-10 sm:h-10 text-xl'
                  : 'w-8 h-8 sm:w-9 sm:h-9 text-lg';

              if (tile.disabled) {
                return (
                  <div
                    key={`disabled-${r}-${c}`}
                    className={`${cellSizeClass} pointer-events-none opacity-0`}
                  />
                );
              }

              if (!tile.id) {
                return (
                  <div
                    key={`empty-${r}-${c}`}
                    className={`${cellSizeClass} rounded-xl bg-amber-950/40 border border-amber-900/30`}
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
              const isHinted = !isClearing && !isDropping && (hintTiles?.some((h) => h.r === r && h.c === c) || false);

              // ロケットの色分け装飾
              const rocketTheme = {
                wood: { ring: 'ring-amber-500/70 bg-amber-950/50', icon: '🪵', label: '丸太' },
                water: { ring: 'ring-cyan-400/70 bg-cyan-950/50', icon: '💧', label: '水流' },
                twig: { ring: 'ring-emerald-400/70 bg-emerald-950/50', icon: '🌿', label: '若葉' },
                acorn: { ring: 'ring-orange-400/70 bg-orange-950/50', icon: '🌰', label: 'どんぐり' },
                stone: { ring: 'ring-slate-400/70 bg-slate-850/50', icon: '🪨', label: '岩石' },
                berry: { ring: 'ring-rose-500/70 bg-rose-950/50', icon: '🍓', label: '野イチゴ' },
                mushroom: { ring: 'ring-purple-500/70 bg-purple-950/50', icon: '🍄', label: 'キノコ' },
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
                    ...(isDropping
                      ? ({
                          '--drop-offset': gravityDir === 'up' ? `${dropDist * 115}%` : `-${dropDist * 115}%`,
                        } as React.CSSProperties)
                      : {}),
                    ...(dragOffset?.r === r && dragOffset?.c === c
                      ? { transform: `translate3d(${dragOffset.dx}px, ${dragOffset.dy}px, 0) scale(1.08)`, zIndex: 35 }
                      : dragOffset?.targetR === r && dragOffset?.targetC === c
                      ? { transform: `translate3d(${-dragOffset.dx}px, ${-dragOffset.dy}px, 0) scale(0.96)`, zIndex: 25 }
                      : {}),
                  }}
                  className={`${cellSizeClass} rounded-xl flex items-center justify-center font-bold ${
                    activeBooster ? 'cursor-crosshair ring-1 ring-amber-300/40 hover:ring-2 hover:ring-amber-300 hover:brightness-125' : 'cursor-pointer'
                  } select-none transform active:scale-95 relative overflow-hidden ${
                    isDropping ? '' : 'transition-all duration-150'
                  } ${
                    isClearing
                      ? 'animate-piece-pop z-20'
                      : isDropping
                      ? (gravityDir === 'up' ? 'animate-piece-float-up z-10' : 'animate-piece-drop z-10')
                      : isSelected
                      ? 'bg-amber-400/40 ring-4 ring-amber-400 scale-105 z-10'
                      : isRainbowGlow
                      ? 'animate-rainbow-glow ring-2 ring-purple-400 bg-purple-950/60 z-20'
                      : isHinted
                      ? 'animate-hint-wiggle ring-2 ring-amber-300 ring-offset-1 z-20'
                      : (isRocket || isBomb)
                      ? `ring-2 ${rocketTheme.ring} shadow-lg shadow-amber-500/20`
                      : gimmick?.type === 'rock'
                      ? 'bg-slate-800 border-2 border-slate-600 shadow-inner'
                      : 'bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 shadow-inner'
                  }`}
                >
                  {/* メインピース */}
                  {gimmick?.type === "rock" ? (
                    <div className="relative w-full h-full p-1 flex items-center justify-center">
                      <img
                        src={getAssetUrl("/assets/gimmick_rock.png")}
                        alt="岩"
                        className="w-full h-full object-contain filter drop-shadow-md select-none pointer-events-none"
                      />
                    </div>
                  ) : tile.special === "rainbow" ? (
                    <div className="relative flex items-center justify-center w-full h-full p-1">
                      <img
                        src={getAssetUrl("/assets/piece_rainbow.png")}
                        alt="虹オーブ"
                        className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.85)] animate-spin-slow"
                      />
                    </div>
                  ) : isRocket ? (
                    <div className="relative flex items-center justify-center w-full h-full p-1">
                      <img
                        src={getAssetUrl("/assets/piece_rocket.png")}
                        alt="ロケット"
                        className={`w-full h-full object-contain filter drop-shadow-md animate-pulse-slow transition-transform ${tile.special === "rocket_h" ? "rotate-90" : "rotate-0"}`}
                      />
                      {/* 向きバッジ（横 ↔ / 縦 ↕） */}
                      <span className="absolute top-0.5 left-0.5 text-[9px] font-black bg-slate-950/85 border border-slate-700/80 rounded px-0.5 py-0 leading-none text-amber-300">
                        {tile.special === "rocket_h" ? "↔" : "↕"}
                      </span>
                      {/* 属性素材バッジ */}
                      <span className="absolute bottom-0 right-0 text-[10px] bg-slate-950/90 border border-slate-700/80 rounded-full px-0.5 py-0 shadow-xs leading-none">
                        {rocketTheme.icon}
                      </span>
                    </div>
                  ) : isBomb ? (
                    <div className="relative flex items-center justify-center w-full h-full p-1">
                      <img
                        src={getAssetUrl("/assets/piece_bomb.png")}
                        alt="樽爆弾"
                        className="w-full h-full object-contain filter drop-shadow-md animate-pulse"
                      />
                      {/* 周囲2マス破壊バッジ */}
                      <span className="absolute top-0.5 left-0.5 text-[9px] font-black bg-slate-950/85 border border-slate-700/80 rounded px-0.5 py-0 leading-none text-rose-400">
                        💥
                      </span>
                      {/* 属性素材バッジ */}
                      <span className="absolute bottom-0 right-0 text-[10px] bg-slate-950/90 border border-slate-700/80 rounded-full px-0.5 py-0 shadow-xs leading-none">
                        {rocketTheme.icon}
                      </span>
                    </div>
                  ) : config.image ? (
                    <img
                      src={config.image}
                      alt={config.label}
                      className="w-full h-full object-contain p-1 filter drop-shadow-sm select-none pointer-events-none transform transition-transform hover:scale-105"
                    />
                  ) : (
                    <span className="drop-shadow-sm select-none">{config.icon}</span>
                  )}

                  {/* 下地ギミック：泥んこレイヤー */}
                  {tile.underlay?.type === 'mud' && (
                    <div className="absolute inset-0 rounded-xl pointer-events-none z-0 overflow-hidden">
                      <img
                        src={getAssetUrl("/assets/gimmick_mud.png")}
                        alt="泥"
                        className={`w-full h-full object-cover transition-opacity ${tile.underlay.hp >= 2 ? 'opacity-95' : 'opacity-65'}`}
                      />
                      <span className="absolute bottom-0.5 right-0.5 text-[8px] font-black text-amber-200 bg-amber-950/90 px-1 rounded-sm leading-none border border-amber-600/70 shadow-xs">
                        泥{tile.underlay.hp}
                      </span>
                    </div>
                  )}

                  {/* ギミック① 氷ブロックオーバーレイ */}
                  {gimmick?.type === 'ice' && (
                    <div className="absolute inset-0 rounded-xl pointer-events-none z-20 overflow-hidden flex items-center justify-center">
                      <img
                        src={getAssetUrl("/assets/gimmick_ice.png")}
                        alt="氷"
                        className={`w-full h-full object-contain filter drop-shadow-md transition-opacity ${gimmick.hp === 1 ? 'opacity-70' : 'opacity-95'}`}
                      />
                      {gimmick.hp === 1 && (
                        <span className="absolute text-[10px] text-white font-black drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] bg-cyan-950/70 px-1 py-0.2 rounded border border-cyan-300/60">
                          ⚡️ヒビ
                        </span>
                      )}
                    </div>
                  )}

                  {/* ギミック③ ツタオーバーレイ */}
                  {gimmick?.type === 'vine' && (
                    <div className="absolute inset-0 rounded-xl pointer-events-none z-20 overflow-hidden flex items-center justify-center">
                      <img
                        src={getAssetUrl("/assets/gimmick_vine.png")}
                        alt="ツタ"
                        className="w-full h-full object-contain filter drop-shadow-md"
                      />
                    </div>
                  )}

                  {/* ギミック④ 木工のからくり宝箱 */}
                  {gimmick?.type === 'chest' && (
                    <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center shadow-lg z-20 p-0.5">
                      <img
                        src={getAssetUrl("/assets/gimmick_chest.png")}
                        alt="宝箱"
                        className="w-full h-full object-contain filter drop-shadow-md select-none animate-bounce-subtle"
                      />
                      <div className="absolute bottom-1 flex gap-0.5 bg-slate-950/70 px-1 py-0.5 rounded-full border border-amber-500/40">
                        {[1, 2, 3].map((hpIndex) => (
                          <div
                            key={hpIndex}
                            className={`w-1.5 h-1.5 rounded-full ${
                              hpIndex <= (gimmick.hp || 1)
                                ? 'bg-amber-300 shadow-[0_0_4px_rgba(251,191,36,0.9)]'
                                : 'bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ギミック⑤ ダムの巨石 */}
                  {gimmick?.type === 'boulder' && (
                    <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center shadow-inner z-20 p-0.5">
                      <img
                        src={getAssetUrl("/assets/gimmick_rock.png")}
                        alt="巨石"
                        className="w-full h-full object-contain filter drop-shadow-lg select-none"
                      />
                      <div className="absolute bottom-1 flex gap-0.5 bg-slate-950/70 px-1 py-0.5 rounded-full border border-slate-600/40">
                        {[1, 2, 3].map((hpIndex) => (
                          <div
                            key={hpIndex}
                            className={`w-1.5 h-1.5 rounded-full ${
                              hpIndex <= (gimmick.hp || 1) ? 'bg-slate-200' : 'bg-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

        {/* お助けアイテム照準中インジケーター */}
        {activeBooster && (
          <div className="w-full flex items-center justify-between bg-amber-500/20 border border-amber-400/60 px-3 py-1.5 rounded-2xl text-amber-200 text-xs shadow-lg shadow-amber-500/10 backdrop-blur-md animate-pulse">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {activeBooster === 'hammer' ? '🔨' : activeBooster === 'saw' ? '🪚' : '🦫'}
              </span>
              <span className="font-black text-amber-200 text-xs">
                {activeBooster === 'hammer'
                  ? '木づち：壊したいマスをタップ！'
                  : activeBooster === 'saw'
                  ? 'ノコギリ：消したい行をタップ！'
                  : 'しっぽビンタ：中心マスをタップ！'}
              </span>
            </div>
            <button
              onClick={() => setActiveBooster(null)}
              className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-[11px] font-black transition-colors border border-slate-700 active:scale-95 shadow-xs"
            >
              キャンセル ✕
            </button>
          </div>
        )}

        {/* お助けアイテムトレイ */}
        <div className="w-full bg-slate-950/85 border border-amber-500/30 rounded-2xl p-2 backdrop-blur-md shadow-xl flex items-center justify-around gap-2">
          {/* 🔨 木づち */}
          <button
            onClick={() => handleBoosterClick('hammer')}
            disabled={boosters.hammer <= 0 || isAnimating || gameResult !== 'playing'}
            title="選択した1マスを叩き割る（手数は減りません）"
            className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
              activeBooster === 'hammer'
                ? 'bg-amber-500/30 border-2 border-amber-400 scale-105 shadow-[0_0_14px_rgba(251,191,36,0.6)] animate-pulse'
                : 'bg-slate-900/90 border border-slate-700/80 hover:border-amber-400/50 hover:bg-slate-850'
            } ${boosters.hammer <= 0 ? 'opacity-35 grayscale cursor-not-allowed' : 'active:scale-95 cursor-pointer'}`}
          >
            <img src={getAssetUrl("/assets/booster_hammer.png")} alt="木づち" className="w-7 h-7 object-contain drop-shadow-sm select-none" />
            <span className="text-[10px] font-black text-amber-100 mt-0.5">木づち</span>
            <span className="absolute -top-1.5 -right-1 min-w-[19px] h-[19px] bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center px-1 shadow-sm border border-amber-300">
              {boosters.hammer}
            </span>
          </button>

          {/* 🪚 ノコギリ */}
          <button
            onClick={() => handleBoosterClick('saw')}
            disabled={boosters.saw <= 0 || isAnimating || gameResult !== 'playing'}
            title="選択した横1列を一刀両断（手数は減りません）"
            className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
              activeBooster === 'saw'
                ? 'bg-amber-500/30 border-2 border-amber-400 scale-105 shadow-[0_0_14px_rgba(251,191,36,0.6)] animate-pulse'
                : 'bg-slate-900/90 border border-slate-700/80 hover:border-amber-400/50 hover:bg-slate-850'
            } ${boosters.saw <= 0 ? 'opacity-35 grayscale cursor-not-allowed' : 'active:scale-95 cursor-pointer'}`}
          >
            <img src={getAssetUrl("/assets/booster_saw.png")} alt="ノコギリ" className="w-7 h-7 object-contain drop-shadow-sm select-none" />
            <span className="text-[10px] font-black text-amber-100 mt-0.5">ノコギリ</span>
            <span className="absolute -top-1.5 -right-1 min-w-[19px] h-[19px] bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center px-1 shadow-sm border border-amber-300">
              {boosters.saw}
            </span>
          </button>

          {/* 🦫 しっぽビンタ */}
          <button
            onClick={() => handleBoosterClick('tail')}
            disabled={boosters.tail <= 0 || isAnimating || gameResult !== 'playing'}
            title="周囲3×3マスを一撃粉砕（手数は減りません）"
            className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
              activeBooster === 'tail'
                ? 'bg-amber-500/30 border-2 border-amber-400 scale-105 shadow-[0_0_14px_rgba(251,191,36,0.6)] animate-pulse'
                : 'bg-slate-900/90 border border-slate-700/80 hover:border-amber-400/50 hover:bg-slate-850'
            } ${boosters.tail <= 0 ? 'opacity-35 grayscale cursor-not-allowed' : 'active:scale-95 cursor-pointer'}`}
          >
            <img src={getAssetUrl("/assets/booster_tail.png")} alt="しっぽ" className="w-7 h-7 object-contain drop-shadow-sm select-none" />
            <span className="text-[10px] font-black text-amber-100 mt-0.5">しっぽ</span>
            <span className="absolute -top-1.5 -right-1 min-w-[19px] h-[19px] bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center px-1 shadow-sm border border-amber-300">
              {boosters.tail}
            </span>
          </button>

          {/* ⏱️ ぜんまい時計 */}
          <button
            onClick={() => handleBoosterClick('clock')}
            disabled={boosters.clock <= 0 || isAnimating || gameResult !== 'playing'}
            title="手数をその場で+5回復（タップ即時発動）"
            className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all bg-slate-900/90 border border-slate-700/80 hover:border-cyan-400/50 hover:bg-slate-850 ${
              boosters.clock <= 0 ? 'opacity-35 grayscale cursor-not-allowed' : 'active:scale-95 cursor-pointer'
            }`}
          >
            <img src={getAssetUrl("/assets/booster_clock.png")} alt="+5手時計" className="w-7 h-7 object-contain drop-shadow-sm select-none" />
            <span className="text-[10px] font-black text-cyan-200 mt-0.5">+5手</span>
            <span className="absolute -top-1.5 -right-1 min-w-[19px] h-[19px] bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center px-1 shadow-sm border border-cyan-200">
              {boosters.clock}
            </span>
          </button>
        </div>

        {/* 下部ひとこと説明 */}
        <div className="text-center text-[11px] text-amber-100 font-medium bg-slate-950/80 border border-amber-500/20 px-3 py-1 rounded-full backdrop-blur-md shadow-sm">
          {stage.newGimmickIntro ? stage.newGimmickIntro.description : '同じ素材を3つ揃えよう！4個でロケット🚀、L字で爆弾💣、5個で虹🌈'}
        </div>
      </div>

      {/* ステージクリアモーダル（★1〜3評価システム搭載） */}
      {gameResult === 'cleared' && (() => {
        const earnedStars = calculateStageStars(stage.maxMoves, finalClearedMovesLeft);
        const bonusWood = getStarWoodBonus(earnedStars);
        const totalReward = stage.woodReward + bonusWood;
        const { star3MinMoves, star2MinMoves } = getStarThresholds(stage.maxMoves);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-gradient-to-b from-amber-950/90 via-slate-900 to-slate-950 border-2 border-amber-400 rounded-3xl p-6 shadow-2xl text-center space-y-4">
              {/* トロフィー & 星アニメーション */}
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="inline-flex p-3 bg-amber-500 text-amber-950 rounded-3xl shadow-lg animate-bounce-subtle">
                  <Trophy className="w-8 h-8" />
                </div>

                {/* ★1〜3 スター表示 */}
                <div className="flex items-center justify-center space-x-2 pt-1">
                  {[1, 2, 3].map((starNum) => {
                    const isEarned = starNum <= earnedStars;
                    return (
                      <div
                        key={starNum}
                        className={`transition-all duration-300 transform ${
                          isEarned
                            ? 'text-yellow-400 scale-110 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]'
                            : 'text-slate-600 scale-95'
                        }`}
                        style={{
                          animation: isEarned ? `popIn 0.4s ease-out ${starNum * 0.15}s both` : 'none',
                        }}
                      >
                        <Star
                          className={`w-9 h-9 ${
                            isEarned ? 'fill-yellow-400 text-yellow-300' : 'text-slate-600'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest bg-amber-500/20 px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>
                    {earnedStars === 3
                      ? '★★★ PERFECT CLEAR!'
                      : earnedStars === 2
                      ? '★★☆ GREAT CLEAR!'
                      : '★☆☆ STAGE CLEAR!'}
                  </span>
                </span>
                <h3 className="text-xl font-black text-white mt-1.5">
                  {earnedStars === 3 ? '完璧な手腕！超絶クリア！🎉' : 'パズル大成功！🎉'}
                </h3>
                <div className="text-xs text-amber-200/90 mt-1 font-bold">
                  残り手数: <span className="text-amber-400 text-sm font-black">{movesLeft}</span>手
                  <span className="text-[10px] text-slate-400 ml-1.5 font-normal">
                    (★3条件: {star3MinMoves}手以上 / ★2: {star2MinMoves}手以上)
                  </span>
                </div>
              </div>

              {/* 獲得報酬（基本＋星ボーナス） */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>ステージ基本報酬:</span>
                  <span className="text-amber-300 font-black">+{stage.woodReward} 🪵</span>
                </div>
                {bonusWood > 0 && (
                  <div className="flex items-center justify-between text-xs font-bold text-yellow-300">
                    <span className="flex items-center space-x-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{earnedStars === 3 ? '★3 パーフェクトボーナス:' : '★2 グッドボーナス:'}</span>
                    </span>
                    <span className="font-black">+{bonusWood} 🪵</span>
                  </div>
                )}
                <div className="pt-1 border-t border-amber-500/20 flex items-center justify-between text-sm font-black text-white">
                  <span>合計獲得木材:</span>
                  <span className="text-amber-400 text-base font-black">+{totalReward} 🪵</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                手に入れた木材を使って、新たな開拓地を復興させよう！
              </p>

              <button
                onClick={() => {
                  const nextStreak = winStreak + 1;
                  setWinStreak(nextStreak);
                  localStorage.setItem('beaver_puzzle_win_streak', String(nextStreak));
                  onStageClear(totalReward, stage.unfogAreaIds, earnedStars, finalClearedMovesLeft);
                }}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-amber-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-500/30 active:scale-98 transition-transform cursor-pointer"
              >
                開拓マップへ進む！ 🚀
              </button>
            </div>
          </div>
        );
      })()}

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
              あと少し！ぜんまい時計で手数を増やして続行するか、再挑戦しよう！
            </p>

            {/* ⏱️ 時計で延長復活ボタン */}
            <button
              onClick={handleContinueWithClock}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-cyan-500/25 active:scale-98 transition-transform flex items-center justify-center space-x-2 cursor-pointer border border-cyan-400/50"
            >
              <span>⏱️ 手数を +5 回復して再開！</span>
              <span className="text-[10px] bg-slate-950/60 px-2 py-0.5 rounded-full text-cyan-200">
                {boosters.clock > 0 ? '所持時計 1個消費' : '50 ウッド消費'}
              </span>
            </button>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setWinStreak(0);
                  localStorage.setItem('beaver_puzzle_win_streak', '0');
                  onExit();
                }}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                マップへ戻る
              </button>
              <button
                onClick={() => {
                  setWinStreak(0);
                  localStorage.setItem('beaver_puzzle_win_streak', '0');
                  initBoard();
                  setShowStartModal(true);
                }}
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
