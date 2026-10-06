export type PieceType = 'wood' | 'twig' | 'water' | 'acorn' | 'stone' | 'berry' | 'mushroom';

export type SpecialType = 'none' | 'rocket_h' | 'rocket_v' | 'bomb' | 'rainbow';

export type GimmickType = 'none' | 'ice' | 'rock' | 'vine' | 'chest' | 'boulder';

export interface TileUnderlay {
  type: 'mud';
  hp: number; // 泥んこ耐久度（1: 通常泥、2: 濃い泥）
}

export type BoosterItemType = 'hammer' | 'saw' | 'tail' | 'clock';

export interface PlayerBoosters {
  hammer: number;
  saw: number;
  tail: number;
  clock: number;
}

export interface TileGimmick {
  type: GimmickType;
  hp: number; // 残り耐久力 (例: 氷は2または1、岩は2または1、宝箱は3〜1、巨石は3〜1)
  reward?: SpecialType; // 宝箱オープン時に飛び出す特殊ピース (rocket_h / rocket_v / bomb)
}

export interface PuzzleTile {
  id: string;
  type: PieceType;
  special: SpecialType;
  gimmick?: TileGimmick;
  underlay?: TileUnderlay;
  isMatched?: boolean;
}

export interface StageTarget {
  type: string;
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
  newGimmickIntro?: {
    type: GimmickType;
    title: string;
    description: string;
    icon: string;
  };
  initialGimmicks?: { r: number; c: number; type: GimmickType; hp: number }[];
  boardRows?: number; // 盤面の行数（未指定なら 7）
  boardCols?: number; // 盤面の列数（未指定なら 7）
  gravityDirection?: 'down' | 'up'; // 重力方向（'down'=通常落下、'up'=水底浮力反転。未指定なら 'down'）
  allowedPieceTypes?: PieceType[]; // 出現する素材の種類（未指定ならデフォルト5種）
  disabledTiles?: { r: number; c: number }[]; // 穴あき盤面の無効マス座標
  initialUnderlays?: { r: number; c: number; type: 'mud'; hp: number }[]; // 下地ギミック（泥んこ）初期配置
  creepingVine?: boolean; // ターン経過でツタが侵食・増殖するか（trueなら未消去ターンに侵食）
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
  mapCoords: { x: number; y: number }; // マップ上の相対座標 (0-100%)
  visualKey?: string;
  ruinedName: string; // 荒廃時のエリア名
  ruinedIcon: string; // 荒廃時のアイコン
  ruinedDescription: string; // 荒廃時の説明
  detailImages?: string[]; // 0段階(荒廃)〜5段階(完全復活)の画像リスト
}

export interface GameState {
  woodPoints: number;
  clearedStageIds: number[];
  unfoggedAreaIds: string[];
  completedAreaIds: string[];
  badges: string[];
  unlockedCreatures: string[];
  taskCompletions: Record<string, boolean>;
}
