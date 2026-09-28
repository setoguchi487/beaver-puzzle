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
    id: "stream_entry",
    ruinedName: "濁ったガレキの浅瀬",
    ruinedIcon: "🥀🗑️",
    ruinedDescription: "流木と泥で川が詰まり、魚や鳥が寄り付かなくなっています。",
    mapCoords: { x: 42, y: 92 },
    name: "はじまりのせせらぎ",
    icon: "🌱",
    description: "浅いせせらぎ。まずはここを片付けてふたりの拠点にしよう！",
    status: "cleared_fog",
    requiredBadges: 0,
    badge: {
      id: "badge_stream",
      name: "せせらぎの開拓者",
      icon: "🏅",
      description: "はじまりのせせらぎをピカピカに整備した証！",
    },
    creature: {
      id: "mallard_duck",
      name: "カルガモの親子",
      icon: "🦆",
      rarity: "common",
      description: "綺麗になった小川の水面をパチャパチャ泳ぐ仲良し親子。",
      comment: "「赤ちゃんカモが元気に泳いでるよ！可愛い〜」",
    },
        detailImages: [
      "/assets/shallows_stage_0.jpg",
      "/assets/shallows_stage_1.jpg",
      "/assets/shallows_stage_2.jpg",
      "/assets/shallows_stage_3.jpg",
      "/assets/shallows_stage_4.jpg",
      "/assets/shallows_stage_5.jpg",
    ],
    tasks: [
      { id: "task_stream_1", title: "浮遊ゴミと空き缶を回収する", woodCost: 20, isCompleted: false, icon: "🧹", visualLabel: "水面のゴミが消える" },
      { id: "task_stream_2", title: "泥水とヘドロをすくい出す", woodCost: 25, isCompleted: false, icon: "🪣", visualLabel: "水が透き通る" },
      { id: "task_stream_3", title: "散乱した倒木と枯れ枝を撤去", woodCost: 30, isCompleted: false, icon: "🪵", visualLabel: "川の流れがスムーズに" },
      { id: "task_stream_4", title: "丸太の飛び石歩道を組む", woodCost: 35, isCompleted: false, icon: "🌉", visualLabel: "向こう岸へ渡れる" },
      { id: "task_stream_5", title: "清流の水草と野花を植える", woodCost: 45, isCompleted: false, icon: "🌸", visualLabel: "カルガモ親子が喜ぶ" },
    ],
    themeColor: "from-emerald-400 to-teal-500",
    bgGradient: "from-emerald-900/60 to-teal-950/80",
  },
  {
    id: "small_dam",
    ruinedName: "決壊した小枝ダム",
    ruinedIcon: "💥🪵",
    ruinedDescription: "増水で土手が崩れてしまい、激しい濁流が溢れ出しています。",
    mapCoords: { x: 58, y: 85 },
    name: "小枝ダムの浅瀬",
    icon: "🪵",
    description: "記念すべき最初のダムを建設するメインスポット！",
    status: "locked_fog",
    requiredBadges: 1,
    badge: {
      id: "badge_dam_1",
      name: "最初のダム職人",
      icon: "🪵🏅",
      description: "ふたりで初めての小枝ダムを完成させた栄誉！",
    },
    creature: {
      id: "sweetfish",
      name: "清流のアユ",
      icon: "🐟",
      rarity: "common",
      description: "ダムで穏やかになった清流をピチピチ跳ねる元気な魚。",
      comment: "「水が透き通って魚が戻ってきたね！」",
    },
        tasks: [
      { id: "task_dam_1", title: "決壊した泥と土砂を除去", woodCost: 30, isCompleted: false, icon: "🧹", visualLabel: "川底が整う" },
      { id: "task_dam_2", title: "頑丈な基礎杭を川底に打ち込む", woodCost: 40, isCompleted: false, icon: "🪨", visualLabel: "土台が安定する" },
      { id: "task_dam_3", title: "小枝を集めて網状に編み込む", woodCost: 50, isCompleted: false, icon: "🌿", visualLabel: "ダムの骨組みができる" },
      { id: "task_dam_4", title: "太い丸太で水流をせき止める", woodCost: 60, isCompleted: false, icon: "🪵", visualLabel: "穏やかなダム湖ができる" },
      { id: "task_dam_5", title: "魚が通れる魚道を整備する", woodCost: 75, isCompleted: false, icon: "🐟", visualLabel: "アユが跳ね始める" },
    ],
    themeColor: "from-teal-400 to-cyan-500",
    bgGradient: "from-teal-900/60 to-cyan-950/80",
  },
  {
    id: "beaver_lodge",
    ruinedName: "雨ざらしの荒れ地",
    ruinedIcon: "🥀🍂",
    ruinedDescription: "枯れ草が茂り、住む場所のないビーバーが困っています。",
    mapCoords: { x: 76, y: 79 },
    name: "木漏れ日のロッジ",
    icon: "🏡",
    description: "ふたりのビーバーが暮らす温かいお家エリア。",
    status: "locked_fog",
    requiredBadges: 2,
    badge: {
      id: "badge_lodge",
      name: "ぬくもりマイホーム",
      icon: "🏡🏅",
      description: "居心地抜群のビーバーロッジを建てたマスター！",
    },
    creature: {
      id: "chipmunk",
      name: "シマリス",
      icon: "🐿️",
      rarity: "common",
      description: "ロッジの周りの木の実をほっぺいっぱいに詰め込む食いしん坊。",
      comment: "「どんぐりをいっぱい抱えて遊びに来たよ！」",
    },
        tasks: [
      { id: "task_lodge_1", title: "雑草と枯れ枝の刈り払い", woodCost: 40, isCompleted: false, icon: "🌾", visualLabel: "敷地が広がる" },
      { id: "task_lodge_2", title: "ロッジの頑丈な土台と柱を組む", woodCost: 50, isCompleted: false, icon: "🪵", visualLabel: "骨組みが建つ" },
      { id: "task_lodge_3", title: "草と小枝のふかふかベッド作り", woodCost: 60, isCompleted: false, icon: "🛏️", visualLabel: "温かい寝床ができる" },
      { id: "task_lodge_4", title: "雨を防ぐ杉皮の三角屋根を葺く", woodCost: 70, isCompleted: false, icon: "🛖", visualLabel: "雨風をしのげる" },
      { id: "task_lodge_5", title: "レンガの暖炉と煙突を作る", woodCost: 85, isCompleted: false, icon: "🔥", visualLabel: "煙が立ちのぼるお家完成" },
    ],
    themeColor: "from-amber-400 to-orange-500",
    bgGradient: "from-amber-900/60 to-orange-950/80",
  },
  {
    id: "fishing_pier",
    ruinedName: "折れた杭と崩れた水辺",
    ruinedIcon: "🥀🪵",
    ruinedDescription: "足場が流され、川辺に近寄ることができません。",
    mapCoords: { x: 34, y: 73 },
    name: "釣りテラス＆桟橋",
    icon: "🎣",
    description: "水辺で夕涼みをしたり魚釣りができる桟橋エリア。",
    status: "locked_fog",
    requiredBadges: 3,
    badge: {
      id: "badge_pier",
      name: "名釣り師のテラス",
      icon: "🎣🏅",
      description: "風情ある釣りテラスを完成させた証！",
    },
    creature: {
      id: "kingfisher",
      name: "渓流の宝石 カワセミ",
      icon: "🐦",
      rarity: "rare",
      description: "桟橋の杭にとまり、水面を狙う鮮やかな青い鳥。",
      comment: "「青い宝石みたいに綺麗な鳥が遊びに来た！」",
    },
        tasks: [
      { id: "task_pier_1", title: "流された折れ杭を抜き取る", woodCost: 50, isCompleted: false, icon: "🪓", visualLabel: "水際が安全になる" },
      { id: "task_pier_2", title: "松の丸太で新しい桟橋の杭を打つ", woodCost: 60, isCompleted: false, icon: "🪵", visualLabel: "水面に足場が伸びる" },
      { id: "task_pier_3", title: "滑りにくいスノコ板を敷き詰める", woodCost: 70, isCompleted: false, icon: "🪜", visualLabel: "快適な歩行テラス" },
      { id: "task_pier_4", title: "日よけの藁葺き屋根を架ける", woodCost: 80, isCompleted: false, icon: "🛖", visualLabel: "涼しい休憩所ができる" },
      { id: "task_pier_5", title: "カワセミが止まる止まり木を立てる", woodCost: 95, isCompleted: false, icon: "🐦", visualLabel: "カワセミがやってくる" },
    ],
    themeColor: "from-cyan-400 to-blue-500",
    bgGradient: "from-cyan-900/60 to-blue-950/80",
  },
  {
    id: "watermill_zone",
    ruinedName: "壊れて傾いた水車小屋",
    ruinedIcon: "🏚️⚙️",
    ruinedDescription: "巨大な歯車が錆び付いて外れ、小屋がツタに覆われています。",
    mapCoords: { x: 64, y: 67 },
    name: "古い水車小屋",
    icon: "⚙️",
    description: "川の水流を利用して木の実を挽く風情ある水車小屋。",
    status: "locked_fog",
    requiredBadges: 4,
    badge: {
      id: "badge_watermill",
      name: "水車村の動力主",
      icon: "⚙️🏅",
      description: "水車の動力を完全に蘇らせたエンジニア！",
    },
    creature: {
      id: "owl",
      name: "森の知恵袋 フクロウ",
      icon: "🦉",
      rarity: "rare",
      description: "水車の三角屋根に止まって、ふたりの努力を静かに見守る。",
      comment: "「夜になると目をパチクリさせて可愛い〜」",
    },
        tasks: [
      { id: "task_mill_1", title: "水車に絡みついたツタを刈り取る", woodCost: 60, isCompleted: false, icon: "🌿", visualLabel: "車輪が露出する" },
      { id: "task_mill_2", title: "巨大な木製大歯車を修復する", woodCost: 75, isCompleted: false, icon: "⚙️", visualLabel: "歯車が噛み合う" },
      { id: "task_mill_3", title: "水流を導く木樋（とい）を架け直す", woodCost: 85, isCompleted: false, icon: "🌊", visualLabel: "水車がコトコト回転開始" },
      { id: "task_mill_4", title: "製粉小屋の壁と窓をリフォーム", woodCost: 95, isCompleted: false, icon: "🧱", visualLabel: "温かい工房が蘇る" },
      { id: "task_mill_5", title: "パン焼き用の石窯を築く", woodCost: 110, isCompleted: false, icon: "🥖", visualLabel: "香ばしいパン工房完成" },
    ],
    themeColor: "from-blue-400 to-indigo-500",
    bgGradient: "from-blue-900/60 to-indigo-950/80",
  },
  {
    id: "flower_garden",
    ruinedName: "トゲだらけの荒れ野",
    ruinedIcon: "🥀🪨",
    ruinedDescription: "花は枯れ果て、動物たちのエサになる木の実もありません。",
    mapCoords: { x: 26, y: 61 },
    name: "ホタルの花園",
    icon: "🌸",
    description: "水辺を彩る美しい植物と小さな動物たちの癒やしエリア。",
    status: "locked_fog",
    requiredBadges: 5,
    badge: {
      id: "badge_garden",
      name: "楽園ガーデナー",
      icon: "🌸🏅",
      description: "大自然の花畑とホタルの並木道を咲かせた称号！",
    },
    creature: {
      id: "deer",
      name: "森の貴公子 ニホンジカ",
      icon: "🦌",
      rarity: "super_rare",
      description: "花の香りと澄んだ水に誘われてやってきた好奇心旺盛なシカ。",
      comment: "「大きな角が立派！ふたりの川が本物の森になったね」",
    },
        tasks: [
      { id: "task_garden_1", title: "尖った岩やトゲ植物を除去する", woodCost: 70, isCompleted: false, icon: "🪨", visualLabel: "柔らかな土が現れる" },
      { id: "task_garden_2", title: "腐葉土を漉き込んで花壇を耕す", woodCost: 80, isCompleted: false, icon: "🌱", visualLabel: "豊かな土壌ができる" },
      { id: "task_garden_3", title: "色とりどりの野花の種を蒔く", woodCost: 95, isCompleted: false, icon: "🌸", visualLabel: "一面の花畑が芽吹く" },
      { id: "task_garden_4", title: "木製の散策小道とベンチを作る", woodCost: 110, isCompleted: false, icon: "🪵", visualLabel: "憩いの花園テラス" },
      { id: "task_garden_5", title: "夜に光るホタルの木を植える", woodCost: 130, isCompleted: false, icon: "✨", visualLabel: "幻想的なホタルの光" },
    ],
    themeColor: "from-pink-400 to-rose-500",
    bgGradient: "from-pink-900/60 to-rose-950/80",
  },
  {
    id: "riverside_camp",
    ruinedName: "泥水に沈んだ倒木林",
    ruinedIcon: "🥀⛺",
    ruinedDescription: "ぬかるみと腐った倒木で、誰も足を踏み入れることができません。",
    mapCoords: { x: 50, y: 55 },
    name: "せせらぎキャンプ場",
    icon: "⛺",
    description: "星空の下で川の音を聴きながらくつろぐキャンプエリア。",
    status: "locked_fog",
    requiredBadges: 6,
    badge: {
      id: "badge_camp",
      name: "キャンピングマスター",
      icon: "⛺🏅",
      description: "川辺に最高の憩いキャンプ地を拓いた証！",
    },
    creature: {
      id: "raccoon",
      name: "いたずらアライグマ",
      icon: "🦝",
      rarity: "common",
      description: "川でどんぐりや魚を丁寧に洗って食べる可愛い食いしん坊。",
      comment: "「両手でゴシゴシ洗う仕草がたまらなく可愛い！」",
    },
        tasks: [
      { id: "task_camp_1", title: "ぬかるんだ泥水を排水する", woodCost: 80, isCompleted: false, icon: "🧹", visualLabel: "乾いた地面ができる" },
      { id: "task_camp_2", title: "腐った倒木を撤去し薪を割る", woodCost: 95, isCompleted: false, icon: "🪓", visualLabel: "キャンプ薪の山" },
      { id: "task_camp_3", title: "川石を丸く組んで安全な焚き火台を作る", woodCost: 110, isCompleted: false, icon: "🔥", visualLabel: "パチパチ燃える焚き火" },
      { id: "task_camp_4", title: "丸太を削り出したベンチとテーブル", woodCost: 125, isCompleted: false, icon: "🪵", visualLabel: "バーベキューエリア" },
      { id: "task_camp_5", title: "洗い場とアライグマの水桶を置く", woodCost: 145, isCompleted: false, icon: "🦝", visualLabel: "アライグマがやってくる" },
    ],
    themeColor: "from-orange-400 to-amber-600",
    bgGradient: "from-orange-900/60 to-amber-950/80",
  },
  {
    id: "beaver_workshop",
    ruinedName: "朽ち果てた作業場跡",
    ruinedIcon: "🏚️🪓",
    ruinedDescription: "道具が散乱し、木工用の作業台が腐朽してしまっています。",
    mapCoords: { x: 74, y: 49 },
    name: "木工ビーバー工房",
    icon: "🪚",
    description: "丸太をより強く美しく加工するビーバーたちの職人工房。",
    status: "locked_fog",
    requiredBadges: 7,
    badge: {
      id: "badge_workshop",
      name: "一流クラフト職人",
      icon: "🪚🏅",
      description: "高度な木工加工ができる名工の工房を再建した証！",
    },
    creature: {
      id: "hedgehog",
      name: "トゲトゲ ハリネズミ",
      icon: "🦔",
      rarity: "rare",
      description: "木くずの温かいベッドに潜り込んで丸くなる恥ずかしがり屋。",
      comment: "「おがくずの中に隠れてコロンと寝てるよ〜」",
    },
        tasks: [
      { id: "task_shop_1", title: "錆びた古い金物を片付ける", woodCost: 90, isCompleted: false, icon: "🧹", visualLabel: "安全な床スペース" },
      { id: "task_shop_2", title: "巨大な樫の木で頑丈な作業台を組む", woodCost: 110, isCompleted: false, icon: "🪵", visualLabel: "職人の木工作業台" },
      { id: "task_shop_3", title: "丸太切り用の大きなノコギリ台を設置", woodCost: 125, isCompleted: false, icon: "🪚", visualLabel: "正確な木材加工が可能" },
      { id: "task_shop_4", title: "木工ツールを整理する壁面ラックを作る", woodCost: 140, isCompleted: false, icon: "🪓", visualLabel: "プロ仕様の道具棚" },
      { id: "task_shop_5", title: "木くずを集めた温かい小部屋を作る", woodCost: 165, isCompleted: false, icon: "🦔", visualLabel: "ハリネズミが住み着く" },
    ],
    themeColor: "from-yellow-400 to-amber-500",
    bgGradient: "from-yellow-900/60 to-amber-950/80",
  },
  {
    id: "drum_bridge",
    ruinedName: "崩落した吊り橋の谷",
    ruinedIcon: "💥🌉",
    ruinedDescription: "谷をつなぐ橋が落ち、対岸へ渡ることができなくなっています。",
    mapCoords: { x: 36, y: 43 },
    name: "太鼓橋の渓谷",
    icon: "🌉",
    description: "深い渓谷の左右を結ぶ、優美なアーチを描く木製太鼓橋。",
    status: "locked_fog",
    requiredBadges: 8,
    badge: {
      id: "badge_bridge",
      name: "架け橋のエンジニア",
      icon: "🌉🏅",
      description: "険しい渓谷に立派な太鼓橋を架けたマスター！",
    },
    creature: {
      id: "snow_monkey",
      name: "渓谷のニホンザル",
      icon: "🐒",
      rarity: "rare",
      description: "太鼓橋の手すりに座って、川のせせらぎを眺める温泉好きサル。",
      comment: "「橋の上から手招きして仲間を呼んでるよ！」",
    },
        tasks: [
      { id: "task_bridge_1", title: "崩落した旧橋の破片を回収する", woodCost: 100, isCompleted: false, icon: "🪨", visualLabel: "渓谷が綺麗になる" },
      { id: "task_bridge_2", title: "両岸の岩盤に巨大な基礎杭を固定", woodCost: 120, isCompleted: false, icon: "🪵", visualLabel: "頑丈な橋の土台" },
      { id: "task_bridge_3", title: "アーチ状の美しい太鼓梁を渡す", woodCost: 140, isCompleted: false, icon: "🌉", visualLabel: "太鼓橋の骨組み完成" },
      { id: "task_bridge_4", title: "朱塗りの手すりと高欄を取り付ける", woodCost: 160, isCompleted: false, icon: "🏮", visualLabel: "風情ある朱塗りの橋" },
      { id: "task_bridge_5", title: "橋のたもとに露天の岩風呂を掘る", woodCost: 190, isCompleted: false, icon: "🐒", visualLabel: "ニホンザルが温まる" },
    ],
    themeColor: "from-red-400 to-rose-600",
    bgGradient: "from-red-900/60 to-rose-950/80",
  },
  {
    id: "crystal_spring",
    ruinedName: "藻に覆われ淀んだ沼",
    ruinedIcon: "🥀🦠",
    ruinedDescription: "ヘドロとアオコが溜まり、太陽の光が届かない死んだ沼。",
    mapCoords: { x: 22, y: 37 },
    name: "水晶の湧水池",
    icon: "💎",
    description: "地下水脈からこんこんと清らかな水が湧き出る天然の泉。",
    status: "locked_fog",
    requiredBadges: 9,
    badge: {
      id: "badge_spring",
      name: "湧水の守護者",
      icon: "💎🏅",
      description: "奇跡の透き通る湧水泉を再生させた栄誉！",
    },
    creature: {
      id: "swan",
      name: "優美なコハクチョウ",
      icon: "🦢",
      rarity: "super_rare",
      description: "透き通るエメラルドの泉に舞い降りた、純白の美しい水鳥。",
      comment: "「羽を広げて優雅に水面を滑る姿が神秘的…！」",
    },
        tasks: [
      { id: "task_spring_1", title: "沼を覆うヘドロと藻をすくい出す", woodCost: 110, isCompleted: false, icon: "🧹", visualLabel: "水底が見え始める" },
      { id: "task_spring_2", title: "天然の水晶石と白砂を敷き詰める", woodCost: 130, isCompleted: false, icon: "💎", visualLabel: "エメラルドグリーンに輝く" },
      { id: "task_spring_3", title: "竹と丸太で清らかな湧水路を組む", woodCost: 155, isCompleted: false, icon: "🎋", visualLabel: "サラサラと湧水が注ぐ" },
      { id: "task_spring_4", title: "水辺を囲む木の観察デッキを作る", woodCost: 180, isCompleted: false, icon: "🪵", visualLabel: "水鏡を見渡すテラス" },
      { id: "task_spring_5", title: "睡蓮の白い花を水面に浮かべる", woodCost: 215, isCompleted: false, icon: "🦢", visualLabel: "純白のハクチョウが舞い降りる" },
    ],
    themeColor: "from-cyan-300 to-teal-400",
    bgGradient: "from-cyan-900/60 to-teal-950/80",
  },
  {
    id: "berry_orchard",
    ruinedName: "害虫だらけの枯れ木林",
    ruinedIcon: "🥀🫐",
    ruinedDescription: "木々は枯れ果て、木の実が1つも実らなくなっています。",
    mapCoords: { x: 58, y: 32 },
    name: "ベリーの果樹園",
    icon: "🍓",
    description: "甘い香りが漂うブルーベリーや木いちごの自然果樹園。",
    status: "locked_fog",
    requiredBadges: 10,
    badge: {
      id: "badge_orchard",
      name: "豊穣の果樹マスター",
      icon: "🍓🏅",
      description: "森の動物たちに甘い果実をもたらした功労者！",
    },
    creature: {
      id: "badger",
      name: "おっとりアナグマ",
      icon: "🦡",
      rarity: "rare",
      description: "完熟ベリーの甘い匂いに引き寄せられてやってきたのんびり屋。",
      comment: "「ベリーをお口いっぱいに頬張って満足そう〜」",
    },
        tasks: [
      { id: "task_berry_1", title: "害虫にやられた枯れ枝を剪定する", woodCost: 125, isCompleted: false, icon: "✂️", visualLabel: "日当たりが良くなる" },
      { id: "task_berry_2", title: "有機肥料を混ぜて果樹園を耕す", woodCost: 145, isCompleted: false, icon: "🌱", visualLabel: "豊かな黒土になる" },
      { id: "task_berry_3", title: "ブルーベリーと木いちごの苗を植樹", woodCost: 170, isCompleted: false, icon: "🍓", visualLabel: "赤い実がたわわに実る" },
      { id: "task_berry_4", title: "鳥よけの木製風車と水やり水路", woodCost: 195, isCompleted: false, icon: "⚙️", visualLabel: "果樹園の自動給水" },
      { id: "task_berry_5", title: "手作りベリージャムの木製直売所", woodCost: 235, isCompleted: false, icon: "🦡", visualLabel: "アナグマがジャムを味見" },
    ],
    themeColor: "from-purple-400 to-pink-500",
    bgGradient: "from-purple-900/60 to-pink-950/80",
  },
  {
    id: "great_waterfall",
    ruinedName: "土砂で塞がれた滝壺",
    ruinedIcon: "💥🪨",
    ruinedDescription: "巨大な岩が崩れ落ちて滝の流れがせき止められ、危険な状態です。",
    mapCoords: { x: 30, y: 26 },
    name: "霧立つ大滝",
    icon: "🌊",
    description: "轟音とともに水しぶきを上げる、大迫力の二段滝。",
    status: "locked_fog",
    requiredBadges: 11,
    badge: {
      id: "badge_waterfall",
      name: "激流の制覇者",
      icon: "🌊🏅",
      description: "危険な土砂を取り除き、壮大な大滝を取り戻した勇者！",
    },
    creature: {
      id: "golden_eagle",
      name: "空の王者 イヌワシ",
      icon: "🦅",
      rarity: "super_rare",
      description: "滝壺の断崖に巣を作り、空高く旋回する誇り高い猛禽類。",
      comment: "「大きな翼で大滝の上空を舞う姿が勇ましい！」",
    },
        tasks: [
      { id: "task_fall_1", title: "滝壺を塞いでいた巨岩を撤去する", woodCost: 140, isCompleted: false, icon: "💥", visualLabel: "轟音とともに水が落下" },
      { id: "task_fall_2", title: "激しい水しぶきを抑える消波ブロック組み", woodCost: 165, isCompleted: false, icon: "🪨", visualLabel: "安全な滝壺プール" },
      { id: "task_fall_3", title: "断崖に沿って登る木製ジグザグ階段", woodCost: 190, isCompleted: false, icon: "🪜", visualLabel: "滝上へのアクセス路" },
      { id: "task_fall_4", title: "マイナスイオンを浴びる展望デッキ", woodCost: 220, isCompleted: false, icon: "🪵", visualLabel: "大迫力の滝見テラス" },
      { id: "task_fall_5", title: "断崖の頂上にイヌワシの止まり木を築く", woodCost: 265, isCompleted: false, icon: "🦅", visualLabel: "イヌワシが舞い戻る" },
    ],
    themeColor: "from-blue-500 to-indigo-600",
    bgGradient: "from-blue-900/60 to-indigo-950/80",
  },
  {
    id: "stargazing_deck",
    ruinedName: "落雷で割れた巨木",
    ruinedIcon: "⚡🌲",
    ruinedDescription: "天をつく大樹が雷で裂け、黒焦げの切り株だけが残っています。",
    mapCoords: { x: 68, y: 20 },
    name: "森の星見台",
    icon: "🔭",
    description: "夜空の満天の星々と川のせせらぎを一望できる高床台。",
    status: "locked_fog",
    requiredBadges: 12,
    badge: {
      id: "badge_stars",
      name: "星空の天文学者",
      icon: "🔭🏅",
      description: "夜の森をロマンチックに彩る星見台を建てた証！",
    },
    creature: {
      id: "flying_squirrel",
      name: "夜の案内人 モモンガ",
      icon: "🦇",
      rarity: "super_rare",
      description: "星明かりの中を木から木へと滑空する、大きな黒目の森の妖精。",
      comment: "「手足を広げてふわ〜っと飛ぶ姿が最高にキュート！」",
    },
        tasks: [
      { id: "task_stars_1", title: "落雷で焦げた大木を整地する", woodCost: 155, isCompleted: false, icon: "🪓", visualLabel: "広い見晴らしスペース" },
      { id: "task_stars_2", title: "高さ6mの巨大な丸太櫓を立ち上げる", woodCost: 185, isCompleted: false, icon: "🪵", visualLabel: "空に近づく大やぐら" },
      { id: "task_stars_3", title: "360度パノラマの星見ウッドデッキ", woodCost: 215, isCompleted: false, icon: "✨", visualLabel: "夜空を一望できる床" },
      { id: "task_stars_4", title: "木製真鍮の天体望遠鏡を取り付ける", woodCost: 250, isCompleted: false, icon: "🔭", visualLabel: "月や天の川を観察" },
      { id: "task_stars_5", title: "星明かりを映すランタンツリーを灯す", woodCost: 300, isCompleted: false, icon: "🦇", visualLabel: "モモンガが滑空してくる" },
    ],
    themeColor: "from-indigo-400 to-purple-600",
    bgGradient: "from-indigo-900/60 to-purple-950/80",
  },
  {
    id: "sacred_tree",
    ruinedName: "枯死寸前の古代大樹",
    ruinedIcon: "🥀🍂",
    ruinedDescription: "森の主たる千年杉が精気を失い、枝葉が枯れ落ちています。",
    mapCoords: { x: 28, y: 13 },
    name: "守り神の神木",
    icon: "⛩️",
    description: "森の命を司る、厳かなしめ縄が巻かれた巨大な御神木。",
    status: "locked_fog",
    requiredBadges: 13,
    badge: {
      id: "badge_sacred",
      name: "自然の奇跡の守護者",
      icon: "⛩️🏅",
      description: "千年の神木に命を宿し、森全体の精気を蘇らせた証！",
    },
    creature: {
      id: "mystic_fox",
      name: "賢者のキツネ",
      icon: "🦊",
      rarity: "super_rare",
      description: "神木の根元に静かに座り、澄んだ瞳でふたりを見つめる神秘的なキツネ。",
      comment: "「ふさふさの尻尾を揺らして、何かお話ししてくれそう」",
    },
        tasks: [
      { id: "task_sacred_1", title: "神木の根元の雑草とゴミを清掃", woodCost: 170, isCompleted: false, icon: "🧹", visualLabel: "厳かな空間ができる" },
      { id: "task_sacred_2", title: "根元に清らかな湧き水を注ぎ込む", woodCost: 205, isCompleted: false, icon: "💧", visualLabel: "千年杉に若葉が萌える" },
      { id: "task_sacred_3", title: "藁を編み上げた巨大なしめ縄を巻く", woodCost: 240, isCompleted: false, icon: "⛩️", visualLabel: "神聖な御神木の威厳" },
      { id: "task_sacred_4", title: "参道の石畳と木製灯籠を並べる", woodCost: 280, isCompleted: false, icon: "🏮", visualLabel: "厳かな参拝道が完成" },
      { id: "task_sacred_5", title: "ヒノキの一枚板で神木の鳥居を奉納", woodCost: 340, isCompleted: false, icon: "🦊", visualLabel: "賢者のキツネが宿る" },
    ],
    themeColor: "from-emerald-400 via-teal-500 to-indigo-600",
    bgGradient: "from-emerald-900/60 to-indigo-950/80",
  },
  {
    id: "emerald_lake",
    ruinedName: "荒れ狂う険しい激流",
    ruinedIcon: "⚡🏔️",
    ruinedDescription: "岩が崩れ落ち、大自然の調和が乱れて近づけなくなっています。",
    mapCoords: { x: 50, y: 6 },
    name: "ビーバーの桃源郷",
    icon: "👑",
    description: "大要塞グランドダムと湖を望む、最高峰の聖地。",
    status: "locked_fog",
    requiredBadges: 14,
    badge: {
      id: "badge_paradise",
      name: "伝説のダムマスター",
      icon: "👑🏅",
      description: "すべてのエリアを開拓し、ビーバーの楽園を築き上げた覇者！",
    },
    creature: {
      id: "bear_family",
      name: "やさしい森のクマさん",
      icon: "🐻",
      rarity: "legendary",
      description: "大自然の主。川辺でサケ獲りに挑戦する心優しいお父さんグマ。",
      comment: "「大迫力だけどすっごく温厚！ふたりのダムの守り神だね」",
    },
        tasks: [
      { id: "task_lake_1", title: "激流の岩壁を削り巨大な基礎を固める", woodCost: 190, isCompleted: false, icon: "🪨", visualLabel: "要塞ダムの巨大基礎" },
      { id: "task_lake_2", title: "何百本もの大丸太を組む要塞大堰堤", woodCost: 230, isCompleted: false, icon: "🪵", visualLabel: "大要塞グランドダム" },
      { id: "task_lake_3", title: "満水の湖を渡るふたりの木製跳ね橋", woodCost: 275, isCompleted: false, icon: "🌉", visualLabel: "桃源郷への最後の架け橋" },
      { id: "task_lake_4", title: "ダム湖の湖畔に建つ展望グランドロッジ", woodCost: 325, isCompleted: false, icon: "🏰", visualLabel: "すべての動物たちの集う館" },
      { id: "task_lake_5", title: "黄金に輝くふたりのビーバー記念碑", woodCost: 400, isCompleted: false, icon: "👑", visualLabel: "伝説のダムマスター達成" },
    ],
    themeColor: "from-amber-400 via-rose-500 to-purple-500",
    bgGradient: "from-amber-900/60 via-rose-900/60 to-purple-950/80",
  },
];

