import type { PuzzleStage, PieceType, GimmickType } from '../types';

/**
 * 今日の日付文字列（YYYY-MM-DD）を取得
 */
export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export interface DailyReward {
  wood: number;
  boosters: {
    hammer?: number;
    saw?: number;
    tail?: number;
    clock?: number;
  };
}

/**
 * 曜日別デイリーテーマ定義
 */
const DAILY_THEMES = [
  // 0: 日曜日
  {
    dayName: '日曜日',
    themeTitle: '百花繚乱！全色コンボ大祝祭 👑',
    description: '日曜日は全素材が登場！盤面いっぱいの爽快大連鎖を決めよう！',
    allowedPieceTypes: ['wood', 'twig', 'water', 'acorn', 'stone', 'berry', 'mushroom'] as PieceType[],
    gravityDirection: 'down' as const,
    maxMoves: 22,
    targets: [
      { type: 'wood', required: 20, current: 0 },
      { type: 'water', required: 20, current: 0 },
      { type: 'berry', required: 15, current: 0 },
    ],
    woodReward: 1500,
    boosters: { hammer: 2, clock: 2 },
  },
  // 1: 月曜日
  {
    dayName: '月曜日',
    themeTitle: 'せせらぎ急流！水滴＆ロケット連鎖 💧🚀',
    description: '週の始まりは水滴集め！一列消しで一気に木材を流し込もう！',
    allowedPieceTypes: ['water', 'wood', 'twig', 'acorn'] as PieceType[],
    gravityDirection: 'down' as const,
    maxMoves: 18,
    targets: [
      { type: 'water', required: 25, current: 0 },
      { type: 'wood', required: 15, current: 0 },
    ],
    woodReward: 1000,
    boosters: { hammer: 1, saw: 1 },
  },
  // 2: 火曜日
  {
    dayName: '火曜日',
    themeTitle: '秋の味覚！完熟野イチゴ摘み 🍓🌰',
    description: '美味しい野イチゴとドングリが実ったよ！赤と茶色のピースを揃えよう！',
    allowedPieceTypes: ['berry', 'acorn', 'wood', 'water'] as PieceType[],
    gravityDirection: 'down' as const,
    maxMoves: 18,
    targets: [
      { type: 'berry', required: 24, current: 0 },
      { type: 'acorn', required: 18, current: 0 },
    ],
    woodReward: 1100,
    boosters: { tail: 2 },
  },
  // 3: 水曜日
  {
    dayName: '水曜日',
    themeTitle: '水底の秘境！浮力反転＆宝箱ハント ⬆️📦',
    description: 'ドロップが下から上に浮かび上がる！水底に沈んだ宝箱を開放しよう！',
    allowedPieceTypes: ['water', 'stone', 'wood', 'berry'] as PieceType[],
    gravityDirection: 'up' as const,
    maxMoves: 20,
    targets: [
      { type: 'chest', required: 3, current: 0 },
      { type: 'water', required: 20, current: 0 },
    ],
    initialGimmicks: [
      { r: 2, c: 2, type: 'chest' as GimmickType, hp: 3, reward: 'rocket_h' as any },
      { r: 2, c: 4, type: 'chest' as GimmickType, hp: 3, reward: 'rocket_v' as any },
      { r: 4, c: 3, type: 'chest' as GimmickType, hp: 3, reward: 'bomb' as any },
    ],
    woodReward: 1200,
    boosters: { clock: 2, hammer: 1 },
  },
  // 4: 木曜日
  {
    dayName: '木曜日',
    themeTitle: '巨樹の深緑！ツタ浄化＆キノコ狩り 🍄🌿',
    description: '増殖するツタを払いのけながら、紫色の美味しいキノコを収穫しよう！',
    allowedPieceTypes: ['mushroom', 'twig', 'wood', 'acorn'] as PieceType[],
    gravityDirection: 'down' as const,
    creepingVine: true,
    maxMoves: 20,
    targets: [
      { type: 'mushroom', required: 22, current: 0 },
      { type: 'vine', required: 6, current: 0 },
    ],
    initialGimmicks: [
      { r: 0, c: 0, type: 'vine' as GimmickType, hp: 1 },
      { r: 0, c: 6, type: 'vine' as GimmickType, hp: 1 },
      { r: 6, c: 0, type: 'vine' as GimmickType, hp: 1 },
      { r: 6, c: 6, type: 'vine' as GimmickType, hp: 1 },
    ],
    woodReward: 1200,
    boosters: { saw: 2 },
  },
  // 5: 金曜日
  {
    dayName: '金曜日',
    themeTitle: '難所の土木工事！頑丈な岩盤砕き 🪨🔨',
    description: '硬い岩を木づちと爆弾で粉砕！週末に向けて川の流れを整えよう！',
    allowedPieceTypes: ['stone', 'wood', 'twig', 'water'] as PieceType[],
    gravityDirection: 'down' as const,
    maxMoves: 20,
    targets: [
      { type: 'rock', required: 6, current: 0 },
      { type: 'stone', required: 18, current: 0 },
    ],
    initialGimmicks: [
      { r: 3, c: 2, type: 'rock' as GimmickType, hp: 2 },
      { r: 3, c: 4, type: 'rock' as GimmickType, hp: 2 },
      { r: 2, c: 3, type: 'rock' as GimmickType, hp: 2 },
      { r: 4, c: 3, type: 'rock' as GimmickType, hp: 2 },
    ],
    woodReward: 1300,
    boosters: { hammer: 2, tail: 1 },
  },
  // 6: 土曜日
  {
    dayName: '土曜日',
    themeTitle: '川床大掃除！泥んこ浄化大作戦 泥✨',
    description: '川底に溜まった泥んこを消去してピカピカに！休日前の大清掃！',
    allowedPieceTypes: ['wood', 'water', 'berry', 'twig'] as PieceType[],
    gravityDirection: 'down' as const,
    maxMoves: 20,
    targets: [
      { type: 'mud', required: 8, current: 0 },
      { type: 'wood', required: 20, current: 0 },
    ],
    initialUnderlays: [
      { r: 2, c: 2, type: 'mud', hp: 2 }, { r: 2, c: 4, type: 'mud', hp: 2 },
      { r: 4, c: 2, type: 'mud', hp: 2 }, { r: 4, c: 4, type: 'mud', hp: 2 },
      { r: 3, c: 3, type: 'mud', hp: 2 },
    ],
    woodReward: 1400,
    boosters: { hammer: 1, saw: 1, tail: 1, clock: 1 },
  },
];

/**
 * 指定日付（省略時は今日）のデイリーステージオブジェクトを生成
 */
export const getDailyPuzzleStage = (dateStr: string = getTodayDateString()): PuzzleStage => {
  const dateObj = new Date(dateStr);
  const dayOfWeek = isNaN(dateObj.getDay()) ? 0 : dateObj.getDay();
  const theme = DAILY_THEMES[dayOfWeek];

  return {
    id: 9999, // 特別なデイリー専用ステージID
    title: `日替わり: ${theme.themeTitle}`,
    description: `${theme.dayName}限定のお題パズル！${theme.description}`,
    maxMoves: theme.maxMoves,
    boardRows: 7,
    boardCols: 7,
    gravityDirection: theme.gravityDirection,
    allowedPieceTypes: theme.allowedPieceTypes,
    targets: theme.targets.map((t) => ({ ...t, current: 0 })),
    woodReward: theme.woodReward,
    unfogAreaIds: [],
    initialGimmicks: theme.initialGimmicks,
    initialUnderlays: (theme as any).initialUnderlays,
    creepingVine: theme.creepingVine,
  };
};

/**
 * 今日のデイリー報酬情報を取得
 */
export const getDailyRewardInfo = (dateStr: string = getTodayDateString()): DailyReward => {
  const dateObj = new Date(dateStr);
  const dayOfWeek = isNaN(dateObj.getDay()) ? 0 : dateObj.getDay();
  const theme = DAILY_THEMES[dayOfWeek];
  return {
    wood: theme.woodReward,
    boosters: theme.boosters,
  };
};

/**
 * 今日のデイリーパズルがクリア済みかどうかを判定
 */
export const isDailyClearedToday = (): boolean => {
  try {
    const saved = localStorage.getItem('beaver_daily_cleared_date');
    return saved === getTodayDateString();
  } catch {
    return false;
  }
};

/**
 * 今日のデイリーパズルをクリア済みにマーク
 */
export const markDailyClearedToday = (): void => {
  try {
    localStorage.setItem('beaver_daily_cleared_date', getTodayDateString());
  } catch (e) {
    console.error(e);
  }
};
