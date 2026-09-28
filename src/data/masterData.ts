import type { PuzzleStage, FrontierArea, GimmickType } from '../types';

export const PIECE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  wood: { label: '丸太', icon: '🪵', color: 'text-amber-800', bg: 'bg-amber-100 border-amber-300' },
  twig: { label: '小枝', icon: '🌿', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300' },
  water: { label: '水滴', icon: '💧', color: 'text-cyan-600', bg: 'bg-cyan-100 border-cyan-300' },
  acorn: { label: 'どんぐり', icon: '🌰', color: 'text-orange-800', bg: 'bg-orange-100 border-orange-300' },
  stone: { label: '小石', icon: '🪨', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-300' },
};

// 1〜100ステージの生成関数（節目ステージを手動で精密設計し、間を自動補間）
export const generate100Stages = (): PuzzleStage[] => {
  const stages: PuzzleStage[] = [];

  for (let i = 1; i <= 100; i++) {
    // 節目ステージの個別リッチ設計
    if (i === 1) {
      stages.push({
        id: 1,
        title: 'Stage 1: 小枝集めのレッスン',
        description: 'まずは基本の丸太と水滴を集めよう！スワイプして3つ揃えてね。',
        maxMoves: 18,
        targets: [
          { type: 'wood', required: 10, current: 0 },
          { type: 'water', required: 8, current: 0 },
        ],
        woodReward: 100,
        unfogAreaIds: ['stream_entry', 'small_dam'],
      });
    } else if (i === 10) {
      // 🧊 氷ブロック解禁！
      stages.push({
        id: 10,
        title: 'Stage 10: 氷解のせせらぎ 🧊',
        description: '新ギミック【氷ブロック】登場！氷の隣で素材を消すと、氷が割れて中の丸太が手に入るよ！',
        maxMoves: 22,
        targets: [
          { type: 'ice', required: 6, current: 0 },
          { type: 'wood', required: 15, current: 0 },
        ],
        woodReward: 200,
        unfogAreaIds: ['beaver_lodge'],
        newGimmickIntro: {
          type: 'ice',
          title: '新ギミック：氷ブロック 🧊',
          description: 'カチコチに凍った丸太！隣でピースを消して氷を割ろう！',
          icon: '🧊',
        },
        initialGimmicks: [
          { r: 2, c: 2, type: 'ice', hp: 2 },
          { r: 2, c: 4, type: 'ice', hp: 2 },
          { r: 4, c: 2, type: 'ice', hp: 2 },
          { r: 4, c: 4, type: 'ice', hp: 2 },
          { r: 3, c: 3, type: 'ice', hp: 2 },
          { r: 3, c: 2, type: 'ice', hp: 1 },
        ],
      });
    } else if (i === 20) {
      // 🪨 川底の大岩解禁！
      stages.push({
        id: 20,
        title: 'Stage 20: 巨石の渓谷 🪨',
        description: '新ギミック【川底の大岩】登場！動かせない頑丈な岩だ。隣でマッチさせるかロケット・ボムで粉砕しよう！',
        maxMoves: 24,
        targets: [
          { type: 'rock', required: 5, current: 0 },
          { type: 'water', required: 18, current: 0 },
        ],
        woodReward: 280,
        unfogAreaIds: ['fishing_pier'],
        newGimmickIntro: {
          type: 'rock',
          title: '新ギミック：川底の大岩 🪨',
          description: 'スワップできないブロッカー！爆風や隣接マッチで吹き飛ばせ！',
          icon: '🪨',
        },
        initialGimmicks: [
          { r: 1, c: 3, type: 'rock', hp: 2 },
          { r: 3, c: 1, type: 'rock', hp: 2 },
          { r: 3, c: 5, type: 'rock', hp: 2 },
          { r: 5, c: 3, type: 'rock', hp: 2 },
          { r: 3, c: 3, type: 'rock', hp: 2 },
        ],
      });
    } else if (i === 30) {
      // 🌿 絡みつくツタ解禁！
      stages.push({
        id: 30,
        title: 'Stage 30: 密林のツタ絡み 🌿',
        description: '新ギミック【絡みつくツタ】登場！ツタで固定されたピースは動かせないが、同じ色で3つ揃えれば解けるぞ！',
        maxMoves: 25,
        targets: [
          { type: 'vine', required: 8, current: 0 },
          { type: 'wood', required: 20, current: 0 },
        ],
        woodReward: 350,
        unfogAreaIds: ['watermill_zone'],
        newGimmickIntro: {
          type: 'vine',
          title: '新ギミック：絡みつくツタ 🌿',
          description: 'ピースが縛られて動かせない！同じ色を揃えてツタを断ち切ろう！',
          icon: '🌿',
        },
        initialGimmicks: [
          { r: 2, c: 1, type: 'vine', hp: 1 },
          { r: 2, c: 5, type: 'vine', hp: 1 },
          { r: 3, c: 2, type: 'vine', hp: 1 },
          { r: 3, c: 4, type: 'vine', hp: 1 },
          { r: 4, c: 1, type: 'vine', hp: 1 },
          { r: 4, c: 5, type: 'vine', hp: 1 },
          { r: 1, c: 3, type: 'vine', hp: 1 },
          { r: 5, c: 3, type: 'vine', hp: 1 },
        ],
      });
    } else if (i === 40) {
      stages.push({
        id: 40,
        title: 'Stage 40: 氷と大岩の激流峡谷 🧊🪨',
        description: '氷と大岩が入り乱れる大難所！ロケット丸太を大量に作って突破せよ！',
        maxMoves: 26,
        targets: [
          { type: 'ice', required: 6, current: 0 },
          { type: 'rock', required: 4, current: 0 },
          { type: 'wood', required: 22, current: 0 },
        ],
        woodReward: 420,
        unfogAreaIds: ['flower_garden'],
        initialGimmicks: [
          { r: 2, c: 2, type: 'ice', hp: 2 },
          { r: 2, c: 4, type: 'ice', hp: 2 },
          { r: 3, c: 3, type: 'rock', hp: 2 },
          { r: 4, c: 2, type: 'ice', hp: 2 },
          { r: 4, c: 4, type: 'ice', hp: 2 },
          { r: 1, c: 1, type: 'rock', hp: 1 },
          { r: 1, c: 5, type: 'rock', hp: 1 },
          { r: 5, c: 1, type: 'rock', hp: 1 },
          { r: 5, c: 5, type: 'rock', hp: 1 },
        ],
      });
    } else if (i === 50) {
      stages.push({
        id: 50,
        title: 'Stage 50: 豪快！三大ギミック大決戦 🧊🪨🌿',
        description: '氷・岩・ツタのフルコース！持てるパズルテクニックのすべてをぶつけろ！',
        maxMoves: 28,
        targets: [
          { type: 'ice', required: 8, current: 0 },
          { type: 'rock', required: 5, current: 0 },
          { type: 'vine', required: 6, current: 0 },
        ],
        woodReward: 500,
        unfogAreaIds: ['emerald_lake'],
        initialGimmicks: [
          { r: 1, c: 3, type: 'rock', hp: 2 },
          { r: 5, c: 3, type: 'rock', hp: 2 },
          { r: 2, c: 2, type: 'ice', hp: 2 },
          { r: 2, c: 4, type: 'ice', hp: 2 },
          { r: 4, c: 2, type: 'ice', hp: 2 },
          { r: 4, c: 4, type: 'ice', hp: 2 },
          { r: 3, c: 1, type: 'vine', hp: 1 },
          { r: 3, c: 5, type: 'vine', hp: 1 },
        ],
      });
    } else if (i === 100) {
      // Stage 100 伝説のボス
      stages.push({
        id: 100,
        title: 'Stage 100: 桃源郷の伝説グランドダム 👑🦫',
        description: '100ステージ到達記念！大要塞ダムを築き上げ、森の主クマさん親子を迎える最高峰の試練！',
        maxMoves: 35,
        targets: [
          { type: 'ice', required: 10, current: 0 },
          { type: 'rock', required: 8, current: 0 },
          { type: 'vine', required: 8, current: 0 },
          { type: 'wood', required: 30, current: 0 },
        ],
        woodReward: 1000,
        unfogAreaIds: ['emerald_lake'],
        initialGimmicks: [
          { r: 0, c: 0, type: 'rock', hp: 2 },
          { r: 0, c: 6, type: 'rock', hp: 2 },
          { r: 6, c: 0, type: 'rock', hp: 2 },
          { r: 6, c: 6, type: 'rock', hp: 2 },
          { r: 1, c: 2, type: 'ice', hp: 2 },
          { r: 1, c: 4, type: 'ice', hp: 2 },
          { r: 2, c: 3, type: 'rock', hp: 2 },
          { r: 3, c: 2, type: 'vine', hp: 1 },
          { r: 3, c: 4, type: 'vine', hp: 1 },
          { r: 4, c: 3, type: 'rock', hp: 2 },
          { r: 5, c: 2, type: 'ice', hp: 2 },
          { r: 5, c: 4, type: 'ice', hp: 2 },
        ],
      });
    } else {
      // 通常ステージ（自動バリエーション生成）
      const stageGimmickType: GimmickType =
        i < 10 ? 'none' : i < 20 ? 'ice' : i < 30 ? 'rock' : 'vine';

      const moves = Math.max(16, 26 - Math.floor(i / 10));
      const targetWood = 10 + (i % 15) * 2;
      const targetSub = 8 + (i % 12) * 2;
      const reward = 100 + i * 8;

      const stageGimmicks: { r: number; c: number; type: GimmickType; hp: number }[] = [];
      if (stageGimmickType === 'ice') {
        stageGimmicks.push({ r: 2, c: 2, type: 'ice', hp: 1 + (i % 2) });
        stageGimmicks.push({ r: 4, c: 4, type: 'ice', hp: 1 + (i % 2) });
        if (i > 14) stageGimmicks.push({ r: 3, c: 3, type: 'ice', hp: 2 });
      } else if (stageGimmickType === 'rock') {
        stageGimmicks.push({ r: 1, c: 3, type: 'rock', hp: 2 });
        stageGimmicks.push({ r: 5, c: 3, type: 'rock', hp: 2 });
      } else if (stageGimmickType === 'vine') {
        stageGimmicks.push({ r: 3, c: 2, type: 'vine', hp: 1 });
        stageGimmicks.push({ r: 3, c: 4, type: 'vine', hp: 1 });
      }

      stages.push({
        id: i,
        title: `Stage ${i}: ${
          i < 10
            ? 'せせらぎの小枝集め'
            : i < 20
            ? '凍った川底の開拓'
            : i < 30
            ? '巨石を越える冒険'
            : i < 40
            ? 'ツタ絡まる原生林'
            : '大自然のフロンティア'
        }`,
        description: '指定素材を集めて木材を獲得し、霧を晴らそう！',
        maxMoves: moves,
        targets: [
          { type: 'wood', required: targetWood, current: 0 },
          { type: 'water', required: targetSub, current: 0 },
          ...(stageGimmickType !== 'none'
            ? [{ type: stageGimmickType, required: stageGimmicks.length, current: 0 }]
            : []),
        ],
        woodReward: reward,
        unfogAreaIds: [],
        initialGimmicks: stageGimmicks,
      });
    }
  }

  return stages;
};

export const STAGES = generate100Stages();

export const INITIAL_AREAS: FrontierArea[] = [
  {
    id: 'stream_entry',
    mapCoords: { x: 42, y: 88 },
    name: 'はじまりのせせらぎ',
    icon: '🌱',
    description: '浅いせせらぎ。まずはここを片付けてふたりの拠点にしよう！',
    status: 'cleared_fog',
    requiredBadges: 0,
    badge: {
      id: 'badge_stream',
      name: 'せせらぎの開拓者',
      icon: '🏅',
      description: 'はじまりのせせらぎをピカピカに整備した証！',
    },
    creature: {
      id: 'mallard_duck',
      name: 'カルガモの親子',
      icon: '🦆',
      rarity: 'common',
      description: '綺麗になった小川の水面をパチャパチャ泳ぐ仲良し親子。',
      comment: '「赤ちゃんカモが元気に泳いでるよ！可愛い〜」',
    },
    tasks: [
      { id: 'task_stream_1', title: '流木とゴミを片付ける', woodCost: 40, isCompleted: false, icon: '🧹', visualLabel: '小川が澄み渡る' },
      { id: 'task_stream_2', title: '小石の歩きやすい足場を作る', woodCost: 60, isCompleted: false, icon: '🪨', visualLabel: '安全な川岸ができる' },
    ],
    themeColor: 'from-emerald-400 to-teal-500',
    bgGradient: 'from-emerald-900/60 to-teal-950/80',
  },
  {
    id: 'small_dam',
    mapCoords: { x: 46, y: 74 },
    name: '小枝ダムの浅瀬',
    icon: '🪵',
    description: '記念すべき最初のダムを建設するメインスポット！',
    status: 'cleared_fog',
    requiredBadges: 0,
    badge: {
      id: 'badge_dam_1',
      name: '最初のダム職人',
      icon: '🪵🏅',
      description: 'ふたりで初めての小枝ダムを完成させた栄誉！',
    },
    creature: {
      id: 'sweetfish',
      name: '清流のアユ',
      icon: '🐟',
      rarity: 'common',
      description: 'ダムで穏やかになった清流をピチピチ跳ねる元気な魚。',
      comment: '「水が透き通って魚が戻ってきたね！」',
    },
    tasks: [
      { id: 'task_dam_1', title: '小枝を集めて土台を組む', woodCost: 50, isCompleted: false, icon: '🌿', visualLabel: 'ダムの骨組みができる' },
      { id: 'task_dam_2', title: '太い丸太で水流をせき止める', woodCost: 80, isCompleted: false, icon: '🪵', visualLabel: '小枝ダムが完成する' },
    ],
    themeColor: 'from-teal-400 to-cyan-500',
    bgGradient: 'from-teal-900/60 to-cyan-950/80',
  },
  {
    id: 'beaver_lodge',
    mapCoords: { x: 74, y: 77 },
    name: '木漏れ日のロッジ',
    icon: '🏡',
    description: 'ふたりのビーバーが暮らす温かいお家エリア。',
    status: 'locked_fog',
    requiredBadges: 1,
    unlockStageId: 10,
    badge: {
      id: 'badge_lodge',
      name: 'ぬくもりマイホーム',
      icon: '🏡🏅',
      description: '居心地抜群のビーバーロッジを建てたマスター！',
    },
    creature: {
      id: 'chipmunk',
      name: 'シマリス',
      icon: '🐿️',
      rarity: 'common',
      description: 'ロッジの周りの木の実をほっぺいっぱいに詰め込む食いしん坊。',
      comment: '「どんぐりをいっぱい抱えて遊びに来たよ！」',
    },
    tasks: [
      { id: 'task_lodge_1', title: '草と小枝のふかふかベッドを作る', woodCost: 70, isCompleted: false, icon: '🛏️', visualLabel: '快適な寝床' },
      { id: 'task_lodge_2', title: '丸太で頑丈な壁と屋根を組む', woodCost: 110, isCompleted: false, icon: '🪵', visualLabel: '温かいロッジが完成' },
    ],
    themeColor: 'from-amber-400 to-orange-500',
    bgGradient: 'from-amber-900/60 to-orange-950/80',
  },
  {
    id: 'fishing_pier',
    mapCoords: { x: 62, y: 57 },
    name: '釣りテラス＆桟橋',
    icon: '🎣',
    description: '水辺で夕涼みをしたり魚釣りができる桟橋エリア。',
    status: 'locked_fog',
    requiredBadges: 2,
    unlockStageId: 20,
    badge: {
      id: 'badge_pier',
      name: '名釣り師のテラス',
      icon: '🎣🏅',
      description: '風情ある釣りテラスを完成させた証！',
    },
    creature: {
      id: 'kingfisher',
      name: '渓流の宝石 カワセミ',
      icon: '🐦',
      rarity: 'rare',
      description: '桟橋の杭にとまり、水面を狙う鮮やかな青い鳥。',
      comment: '「青い宝石みたいに綺麗な鳥が遊びに来た！」',
    },
    tasks: [
      { id: 'task_pier_1', title: '水面に丸太の桟橋を伸ばす', woodCost: 90, isCompleted: false, icon: '🪵', visualLabel: '木の桟橋' },
      { id: 'task_pier_2', title: '雨よけの屋根付きテラスを作る', woodCost: 140, isCompleted: false, icon: '🛖', visualLabel: '屋根付き展望テラス' },
    ],
    themeColor: 'from-cyan-400 to-blue-500',
    bgGradient: 'from-cyan-900/60 to-blue-950/80',
  },
  {
    id: 'watermill_zone',
    mapCoords: { x: 64, y: 49 },
    name: '古い水車小屋',
    icon: '⚙️',
    description: '川の水流を利用して木の実を挽く風情ある水車小屋。',
    status: 'locked_fog',
    requiredBadges: 3,
    unlockStageId: 30,
    badge: {
      id: 'badge_watermill',
      name: '水車村の動力主',
      icon: '⚙️🏅',
      description: '水車の動力を完全に蘇らせたエンジニア！',
    },
    creature: {
      id: 'owl',
      name: '森の知恵袋 フクロウ',
      icon: '🦉',
      rarity: 'rare',
      description: '水車の三角屋根に止まって、ふたりの努力を静かに見守る。',
      comment: '「夜になると目をパチクリさせて可愛い〜」',
    },
    tasks: [
      { id: 'task_mill_1', title: '水車の巨大な木製歯車を直す', woodCost: 130, isCompleted: false, icon: '⚙️', visualLabel: '水車がコトコト回転' },
      { id: 'task_mill_2', title: 'レンガの壁と工房をリフォーム', woodCost: 180, isCompleted: false, icon: '🧱', visualLabel: '温かいパン工房' },
    ],
    themeColor: 'from-blue-400 to-indigo-500',
    bgGradient: 'from-blue-900/60 to-indigo-950/80',
  },
  {
    id: 'flower_garden',
    mapCoords: { x: 20, y: 42 },
    name: 'ホタルの花園',
    icon: '🌸',
    description: '水辺を彩る美しい植物と小さな動物たちの癒やしエリア。',
    status: 'locked_fog',
    requiredBadges: 4,
    unlockStageId: 40,
    badge: {
      id: 'badge_garden',
      name: '楽園ガーデナー',
      icon: '🌸🏅',
      description: '大自然の花畑とホタルの並木道を咲かせた称号！',
    },
    creature: {
      id: 'deer',
      name: '森の貴公子 ニホンジカ',
      icon: '🦌',
      rarity: 'super_rare',
      description: '花の香りと澄んだ水に誘われてやってきた好奇心旺盛なシカ。',
      comment: '「大きな角が立派！ふたりの川が本物の森になったね」',
    },
    tasks: [
      { id: 'task_garden_1', title: '色とりどりの野花を植える', woodCost: 160, isCompleted: false, icon: '🌺', visualLabel: '一面の野花畑' },
      { id: 'task_garden_2', title: '夜を照らすホタルの木を植える', woodCost: 220, isCompleted: false, icon: '✨', visualLabel: '幻想的なホタルの光' },
    ],
    themeColor: 'from-pink-400 to-rose-500',
    bgGradient: 'from-pink-900/60 to-rose-950/80',
  },
  {
    id: 'emerald_lake',
    mapCoords: { x: 48, y: 20 },
    name: 'ビーバーの桃源郷',
    icon: '👑',
    description: '大要塞グランドダムと湖を望む、最高峰の聖地。',
    status: 'locked_fog',
    requiredBadges: 5,
    unlockStageId: 50,
    badge: {
      id: 'badge_paradise',
      name: '伝説のダムマスター',
      icon: '👑🏅',
      description: 'すべてのエリアを開拓し、ビーバーの楽園を築き上げた覇者！',
    },
    creature: {
      id: 'bear_family',
      name: 'やさしい森のクマさん',
      icon: '🐻',
      rarity: 'legendary',
      description: '大自然の主。川辺でサケ獲りに挑戦する心優しいお父さんグマ。',
      comment: '「大迫力だけどすっごく温厚！ふたりのダムの守り神だね」',
    },
    tasks: [
      { id: 'task_lake_1', title: '大要塞グランドダムを築き上げる', woodCost: 300, isCompleted: false, icon: '🏰', visualLabel: '巨大ダム完成' },
      { id: 'task_lake_2', title: '黄金のふたり記念碑を建てる', woodCost: 450, isCompleted: false, icon: '👑', visualLabel: '黄金モニュメント' },
    ],
    themeColor: 'from-amber-400 via-rose-500 to-purple-500',
    bgGradient: 'from-amber-900/60 via-rose-900/60 to-purple-950/80',
  },
];
