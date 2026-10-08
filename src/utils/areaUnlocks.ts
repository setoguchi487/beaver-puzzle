import type { FrontierArea } from '../types';

export interface AreaFeatureUnlock {
  areaId: string;
  featureName: string;
  icon: string;
  badgeTitle: string;
  description: string;
  unlockedDescription: string;
}

export const AREA_FEATURE_CONFIG: Record<string, AreaFeatureUnlock> = {
  beaver_workshop: {
    areaId: 'beaver_workshop',
    featureName: '森の木工クラフトショップ',
    icon: '🔨🦔',
    badgeTitle: '道具補給所 OPEN!',
    description: '木材を使ってブースターアイテムを補給・作成できるショップ',
    unlockedDescription: 'ハリネズミ店長から道具をクラフトできます！',
  },
  watermill_zone: {
    areaId: 'watermill_zone',
    featureName: '水車の自動製材所',
    icon: '🪵🦉',
    badgeTitle: '木材ストック稼働!',
    description: '水車が回り、時間経過や毎日のログインで木材を自動備蓄',
    unlockedDescription: '毎日の訪問でボーナス木材樽を受け取れます！',
  },
  beaver_lodge: {
    areaId: 'beaver_lodge',
    featureName: 'マイルーム＆着せ替え',
    icon: '🏡🐿️',
    badgeTitle: '我が家が完成!',
    description: 'ロッジの模様替えやビーバーの衣装チェンジ',
    unlockedDescription: 'お気に入りのスタイルで冒険に出かけよう！',
  },
  berry_orchard: {
    areaId: 'berry_orchard',
    featureName: '特製ジューススタンド',
    icon: '🍹🦡',
    badgeTitle: 'スタミナ補給!',
    description: '特製ベリージュースでパズルの獲得木材や手数をブースト',
    unlockedDescription: '甘酸っぱいジュースでパズルを有利に進めよう！',
  },
  riverside_camp: {
    areaId: 'riverside_camp',
    featureName: '焚き火の集会場',
    icon: '🔥🦝',
    badgeTitle: '仲間たちの集い!',
    description: '仲間たちのおしゃべりやデイリープチ依頼',
    unlockedDescription: '焚き火を囲んで特別な報酬をもらおう！',
  },
  fishing_pier: {
    areaId: 'fishing_pier',
    featureName: '渓流フィッシング',
    icon: '🎣🐟',
    badgeTitle: '釣りテラス解放!',
    description: 'カワセミと一緒に清流の魚を釣るミニゲーム＆魚拓図鑑',
    unlockedDescription: '糸を垂らして幻の魚を釣り上げよう！',
  },
  stargazing_deck: {
    areaId: 'stargazing_deck',
    featureName: '満天のプラネタリウム',
    icon: '🔭✨',
    badgeTitle: '星空ギャラリー!',
    description: '集めた★（スター）で夜空の星座を復元＆夜景テーマ解放',
    unlockedDescription: '美しい星座を夜空に輝かせよう！',
  },
  sacred_tree: {
    areaId: 'sacred_tree',
    featureName: '大樹の加護',
    icon: '🍁🦊',
    badgeTitle: '永続パッシブ発動!',
    description: '賢者キツネから授かる木材ボーナスなどの神聖なパッシブ能力',
    unlockedDescription: '森のすべての開拓で神聖な恩恵を受けられます！',
  },
};

export const isAreaFeatureUnlocked = (areaId: string, areas: FrontierArea[]): boolean => {
  const targetArea = areas.find((a) => a.id === areaId);
  if (!targetArea) return false;
  return targetArea.status === 'completed' || targetArea.tasks.every((t) => t.isCompleted);
};

// 水車小屋の木材ストック（1日1回ボーナス回収）
const WATERMILL_CLAIM_KEY = 'beaver_puzzle_watermill_last_claim';

export const canClaimWatermillWood = (areas: FrontierArea[]): boolean => {
  if (!isAreaFeatureUnlocked('watermill_zone', areas)) return false;
  const lastClaim = localStorage.getItem(WATERMILL_CLAIM_KEY);
  if (!lastClaim) return true;
  const today = new Date().toISOString().split('T')[0];
  return lastClaim !== today;
};

export const claimWatermillWood = (): number => {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(WATERMILL_CLAIM_KEY, today);
  return 200; // 毎朝 200 ウッドをプレゼント！
};
