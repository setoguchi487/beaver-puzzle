export type PieceType = 'wood' | 'twig' | 'water' | 'acorn' | 'stone';

export type SpecialType = 'none' | 'rocket_h' | 'rocket_v' | 'bomb' | 'rainbow';

export interface PuzzleTile {
  id: string;
  type: PieceType;
  special: SpecialType;
  isMatched?: boolean;
}

export interface StageTarget {
  type: PieceType;
  required: number;
  current: number;
}

export interface PuzzleStage {
  id: number;
  title: string;
  maxMoves: number;
  targets: StageTarget[];
  woodReward: number;
  unfogAreaIds: string[]; // このステージをクリアすると霧が晴れるエリア
  description: string;
}

export interface AreaTask {
  id: string;
  title: string;
  woodCost: number;
  isCompleted: boolean;
  icon: string;
  visualLabel: string;
}

export interface AreaBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Creature {
  id: string;
  name: string;
  icon: string;
  rarity: 'common' | 'rare' | 'super_rare' | 'legendary';
  description: string;
  comment: string;
}

export interface FrontierArea {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: 'locked_fog' | 'cleared_fog' | 'completed';
  requiredBadges: number;
  unlockStageId?: number; // 特定ステージクリアで霧が晴れる
  badge: AreaBadge;
  creature: Creature;
  tasks: AreaTask[];
  themeColor: string;
  bgGradient: string;
}

export interface GameState {
  woodPoints: number;
  clearedStageIds: number[];
  unfoggedAreaIds: string[];
  completedAreaIds: string[];
  badges: string[];
  unlockedCreatures: string[];
  taskCompletions: Record<string, boolean>; // taskId -> boolean
}
