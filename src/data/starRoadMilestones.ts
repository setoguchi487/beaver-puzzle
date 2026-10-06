export interface StarMilestone {
  starsRequired: number;
  title: string;
  description: string;
  rewardWood: number;
  boosters?: {
    hammer?: number;
    saw?: number;
    tail?: number;
    clock?: number;
  };
  badgeIcon: string;
}

export const STAR_MILESTONES: StarMilestone[] = [
  {
    starsRequired: 10,
    title: 'せせらぎの第一歩',
    description: '10個の星を集めた記念報酬！',
    rewardWood: 300,
    boosters: { hammer: 1 },
    badgeIcon: '🌱',
  },
  {
    starsRequired: 25,
    title: '小枝集めの名人',
    description: '木づちとノコギリを補給！',
    rewardWood: 600,
    boosters: { hammer: 2, saw: 1 },
    badgeIcon: '🔨',
  },
  {
    starsRequired: 50,
    title: '激流を制する者',
    description: 'しっぽビンタで盤面を薙ぎ払おう！',
    rewardWood: 1200,
    boosters: { tail: 2, clock: 1 },
    badgeIcon: '🌊',
  },
  {
    starsRequired: 80,
    title: '水車広場の人気者',
    description: 'ぜんまい時計とお助けアイテムセット！',
    rewardWood: 2000,
    boosters: { clock: 3, hammer: 2 },
    badgeIcon: '⏱️',
  },
  {
    starsRequired: 120,
    title: '果樹園の収穫祭',
    description: 'たっぷり木材とお助けアイテム全種セット！',
    rewardWood: 3500,
    boosters: { hammer: 2, saw: 2, tail: 2, clock: 2 },
    badgeIcon: '🍎',
  },
  {
    starsRequired: 160,
    title: '水晶洞窟の探検隊',
    description: '大量木材と特製ブースター！',
    rewardWood: 5000,
    boosters: { hammer: 3, saw: 3 },
    badgeIcon: '💎',
  },
  {
    starsRequired: 200,
    title: '森の熟練大棟梁',
    description: 'お助けアイテム全種×3＆大盤振る舞い木材！',
    rewardWood: 8000,
    boosters: { hammer: 3, saw: 3, tail: 3, clock: 3 },
    badgeIcon: '🏅',
  },
  {
    starsRequired: 250,
    title: '桃源郷の偉大なる開拓主',
    description: '伝説級の超大量木材ボーナス！',
    rewardWood: 15000,
    boosters: { hammer: 5, saw: 5, tail: 5, clock: 5 },
    badgeIcon: '👑',
  },
  {
    starsRequired: 300,
    title: '🌟 全100ステージ完全制覇！神話の棟梁',
    description: '全300スター制覇の最高栄誉！',
    rewardWood: 30000,
    boosters: { hammer: 10, saw: 10, tail: 10, clock: 10 },
    badgeIcon: '✨👑✨',
  },
];
