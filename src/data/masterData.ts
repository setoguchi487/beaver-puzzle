import { getAssetUrl } from '../utils/assetPath';
import type { PuzzleStage, FrontierArea, GimmickType, PieceType, SpecialType } from '../types';

export const PIECE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string; image?: string }> = {
  wood: { label: '丸太', icon: '🪵', color: 'text-amber-800', bg: 'bg-amber-100 border-amber-300', image: getAssetUrl('/assets/piece_wood.png') },
  twig: { label: '小枝', icon: '🌿', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300', image: getAssetUrl('/assets/piece_twig.png') },
  water: { label: '水滴', icon: '💧', color: 'text-cyan-600', bg: 'bg-cyan-100 border-cyan-300', image: getAssetUrl('/assets/piece_water.png') },
  acorn: { label: 'どんぐり', icon: '🌰', color: 'text-orange-800', bg: 'bg-orange-100 border-orange-300', image: getAssetUrl('/assets/piece_acorn.png') },
  stone: { label: '小石', icon: '🪨', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-300', image: getAssetUrl('/assets/piece_stone.png') },
  berry: { label: '野イチゴ', icon: '🍓', color: 'text-rose-600', bg: 'bg-rose-100 border-rose-300', image: getAssetUrl('/assets/piece_berry.png') },
  mushroom: { label: 'キノコ', icon: '🍄', color: 'text-purple-600', bg: 'bg-purple-100 border-purple-300', image: getAssetUrl('/assets/piece_mushroom.png') },
};

// 1〜100ステージの生成関数（節目ステージを手動で精密設計し、間を自動補間）
export const generate100Stages = (): PuzzleStage[] => {
  const stages: PuzzleStage[] = [];

  const ALL_PIECES: PieceType[] = ['wood', 'twig', 'water', 'acorn', 'stone', 'berry', 'mushroom'];

  for (let i = 1; i <= 100; i++) {
    // ==========================================
    // 🌟 節目ステージ（精密手動設計）
    // ==========================================
    if (i === 1) {
      stages.push({
        id: 1,
        title: 'Stage 1: 小枝集めのレッスン 🪵💧',
        description: 'まずは基本の丸太と水滴を集めよう！スワイプして3つ揃えてね。',
        maxMoves: 18,
        boardRows: 7,
        boardCols: 7,
        allowedPieceTypes: ['wood', 'twig', 'water', 'acorn'],
        targets: [
          { type: 'wood', required: 10, current: 0 },
          { type: 'water', required: 8, current: 0 },
        ],
        woodReward: 100,
        unfogAreaIds: ['stream_entry', 'small_dam'],
      });
    } else if (i === 2) {
      stages.push({
        id: 2,
        title: 'Stage 2: 完熟！野イチゴ摘み 🍓',
        description: '新素材【野イチゴ】登場！コンパクトな6×6盤面で爽快4色コンボを決めよう！',
        maxMoves: 16,
        boardRows: 6,
        boardCols: 6,
        allowedPieceTypes: ['berry', 'wood', 'water', 'twig'],
        targets: [
          { type: 'berry', required: 12, current: 0 },
          { type: 'wood', required: 12, current: 0 },
        ],
        woodReward: 110,
        unfogAreaIds: ['small_dam'],
      });
    } else if (i === 3) {
      stages.push({
        id: 3,
        title: 'Stage 3: 水底のふしぎな浮力 ⬆️💧',
        description: '水流の力でドロップが下から上へ浮かび上がる！新感覚の浮力パズルを楽しもう！',
        maxMoves: 18,
        boardRows: 7,
        boardCols: 7,
        gravityDirection: 'up',
        allowedPieceTypes: ['water', 'wood', 'acorn', 'stone'],
        targets: [
          { type: 'water', required: 15, current: 0 },
          { type: 'stone', required: 10, current: 0 },
        ],
        woodReward: 120,
        unfogAreaIds: ['small_dam'],
      });
    } else if (i === 4) {
      stages.push({
        id: 4,
        title: 'Stage 4: 巨樹のふもとのキノコ狩り 🍄',
        description: '新素材【森のキノコ】登場！紫色のキノコを集めて、美味しいスープを作ろう！',
        maxMoves: 18,
        boardRows: 7,
        boardCols: 7,
        allowedPieceTypes: ['mushroom', 'acorn', 'twig', 'wood'],
        targets: [
          { type: 'mushroom', required: 14, current: 0 },
          { type: 'acorn', required: 12, current: 0 },
        ],
        woodReward: 130,
        unfogAreaIds: ['beaver_lodge'],
      });
    } else if (i === 5) {
      stages.push({
        id: 5,
        title: 'Stage 5: ひし形渓谷のせせらぎ 💎',
        description: '四隅が削られた変形ダイヤモンド盤面！角をうまく使って特殊ピースを作ろう！',
        maxMoves: 20,
        boardRows: 7,
        boardCols: 7,
        allowedPieceTypes: ['wood', 'water', 'berry', 'twig', 'stone'],
        disabledTiles: [
          { r: 0, c: 0 }, { r: 0, c: 1 }, { r: 0, c: 5 }, { r: 0, c: 6 },
          { r: 1, c: 0 }, { r: 1, c: 6 },
          { r: 5, c: 0 }, { r: 5, c: 6 },
          { r: 6, c: 0 }, { r: 6, c: 1 }, { r: 6, c: 5 }, { r: 6, c: 6 },
        ],
        targets: [
          { type: 'wood', required: 14, current: 0 },
          { type: 'berry', required: 12, current: 0 },
        ],
        woodReward: 140,
        unfogAreaIds: ['beaver_lodge'],
      });
    } else if (i === 6) {
      stages.push({
        id: 6,
        title: 'Stage 6: 豪快！9×9メガダム建設 👑',
        description: '超広大な9×9盤面！素材数も6色に拡大。ロケットやボムを大量連鎖させよう！',
        maxMoves: 26,
        boardRows: 9,
        boardCols: 9,
        allowedPieceTypes: ['wood', 'water', 'twig', 'acorn', 'berry', 'mushroom'],
        targets: [
          { type: 'wood', required: 25, current: 0 },
          { type: 'water', required: 20, current: 0 },
          { type: 'mushroom', required: 15, current: 0 },
        ],
        woodReward: 150,
        unfogAreaIds: ['beaver_lodge'],
      });
    } else if (i === 7) {
      stages.push({
        id: 7,
        title: 'Stage 7: 泥んこクリーン作戦！🟫',
        description: '新ギミック【泥んこ】登場！泥の上に敷かれたピースを3つ揃えて、キレイに洗い流そう！',
        maxMoves: 20,
        boardRows: 7,
        boardCols: 7,
        allowedPieceTypes: ['wood', 'water', 'twig', 'berry', 'stone'],
        targets: [
          { type: 'mud', required: 12, current: 0 },
          { type: 'wood', required: 12, current: 0 },
        ],
        woodReward: 160,
        unfogAreaIds: ['beaver_lodge'],
        newGimmickIntro: {
          type: 'mud' as GimmickType,
          title: '新ギミック：泥んこタイル 🟫',
          description: 'マスの下地に泥が塗られているよ！そのマスの上で素材を揃えて泥をきれいに洗い流そう！',
          icon: '🟫',
        },
        initialUnderlays: [
          { r: 2, c: 2, type: 'mud', hp: 1 },
          { r: 2, c: 3, type: 'mud', hp: 1 },
          { r: 2, c: 4, type: 'mud', hp: 1 },
          { r: 3, c: 1, type: 'mud', hp: 2 },
          { r: 3, c: 2, type: 'mud', hp: 2 },
          { r: 3, c: 3, type: 'mud', hp: 2 },
          { r: 3, c: 4, type: 'mud', hp: 2 },
          { r: 3, c: 5, type: 'mud', hp: 2 },
          { r: 4, c: 2, type: 'mud', hp: 1 },
          { r: 4, c: 3, type: 'mud', hp: 1 },
          { r: 4, c: 4, type: 'mud', hp: 1 },
          { r: 1, c: 3, type: 'mud', hp: 1 },
        ],
      });
    } else if (i === 8) {
      stages.push({
        id: 8,
        title: 'Stage 8: 木工のからくり宝箱！📦✨',
        description: '新ギミック【からくり宝箱】登場！隣でピースを消して木箱を開けると、中からロケットやボムが飛び出すよ！',
        maxMoves: 22,
        boardRows: 7,
        boardCols: 7,
        allowedPieceTypes: ['water', 'wood', 'acorn', 'twig', 'mushroom'],
        targets: [
          { type: 'chest', required: 3, current: 0 },
          { type: 'water', required: 15, current: 0 },
        ],
        woodReward: 180,
        unfogAreaIds: ['beaver_lodge'],
        newGimmickIntro: {
          type: 'chest' as GimmickType,
          title: '新ギミック：からくり宝箱 📦',
          description: '頑丈な木箱だよ！隣で3マッチさせて叩き割ると、中からロケットやボムが飛び出して大連鎖！',
          icon: '📦',
        },
        initialGimmicks: [
          { r: 2, c: 3, type: 'chest' as GimmickType, hp: 3, reward: 'rocket_h' } as any,
          { r: 4, c: 2, type: 'chest' as GimmickType, hp: 3, reward: 'bomb' } as any,
          { r: 4, c: 4, type: 'chest' as GimmickType, hp: 3, reward: 'rocket_v' } as any,
        ],
      });
    } else if (i === 9) {
      stages.push({
        id: 9,
        title: 'Stage 9: 迫りくる侵食ツタ！🌿',
        description: '新ギミック【侵食ツタ】登場！1ターン中にツタを刈り取らないと、毎ターンじわじわ増殖するスリル！',
        maxMoves: 24,
        boardRows: 7,
        boardCols: 7,
        creepingVine: true,
        allowedPieceTypes: ['acorn', 'twig', 'wood', 'berry', 'stone'],
        targets: [
          { type: 'vine', required: 8, current: 0 },
          { type: 'acorn', required: 15, current: 0 },
        ],
        woodReward: 200,
        unfogAreaIds: ['beaver_lodge'],
        newGimmickIntro: {
          type: 'vine' as GimmickType,
          title: '新ギミック：侵食するツタ 🌿',
          description: 'ツタを放置すると毎ターン周囲に増殖してしまう！ツタの隣でマッチさせて素早く刈り取ろう！',
          icon: '🌿',
        },
        initialGimmicks: [
          { r: 1, c: 1, type: 'vine' as GimmickType, hp: 1 },
          { r: 1, c: 5, type: 'vine' as GimmickType, hp: 1 },
          { r: 5, c: 1, type: 'vine' as GimmickType, hp: 1 },
          { r: 5, c: 5, type: 'vine' as GimmickType, hp: 1 },
        ],
      });
    } else if (i === 10) {
      stages.push({
        id: 10,
        title: 'Stage 10: 巨石ダムの総力戦！🗿💥',
        description: '新ギミック【ダムの巨石】登場！超硬い巨石と宝箱・泥んこが入り混じる第1章の集大成！',
        boardRows: 8,
        boardCols: 8,
        maxMoves: 28,
        creepingVine: true,
        allowedPieceTypes: ['wood', 'water', 'stone', 'berry', 'mushroom'],
        targets: [
          { type: 'boulder', required: 2, current: 0 },
          { type: 'chest', required: 2, current: 0 },
          { type: 'mud', required: 8, current: 0 },
        ],
        woodReward: 250,
        unfogAreaIds: ['beaver_lodge', 'fishing_pier'],
        newGimmickIntro: {
          type: 'boulder' as GimmickType,
          title: '新ギミック：ダムの巨石 🗿',
          description: '超頑丈な巨大ブロック！マッチや爆弾の衝撃を3回当てて粉砕しよう！',
          icon: '🗿',
        },
        initialGimmicks: [
          { r: 3, c: 3, type: 'boulder' as GimmickType, hp: 3 },
          { r: 4, c: 4, type: 'boulder' as GimmickType, hp: 3 },
          { r: 2, c: 5, type: 'chest' as GimmickType, hp: 3, reward: 'bomb' } as any,
          { r: 5, c: 2, type: 'chest' as GimmickType, hp: 3, reward: 'rocket_h' } as any,
          { r: 0, c: 0, type: 'vine' as GimmickType, hp: 1 },
          { r: 7, c: 7, type: 'vine' as GimmickType, hp: 1 },
        ],
        initialUnderlays: [
          { r: 2, c: 2, type: 'mud', hp: 1 },
          { r: 2, c: 3, type: 'mud', hp: 1 },
          { r: 3, c: 2, type: 'mud', hp: 2 },
          { r: 4, c: 5, type: 'mud', hp: 2 },
          { r: 5, c: 4, type: 'mud', hp: 1 },
          { r: 5, c: 5, type: 'mud', hp: 1 },
          { r: 1, c: 4, type: 'mud', hp: 1 },
          { r: 6, c: 3, type: 'mud', hp: 1 },
        ],
      });
    } else if (i === 25) {
      // 🌟 第1章フィナーレ：釣り桟橋の巨大生簀（浮力反転×宝箱ラッシュ）
      stages.push({
        id: 25,
        title: 'Stage 25: 釣り桟橋の宝箱ラッシュ！📦⬆️',
        description: '浮力反転する水底で、からくり宝箱を開けまくれ！豪快な連鎖で第1章を締めくくろう！',
        boardRows: 8,
        boardCols: 8,
        gravityDirection: 'up',
        maxMoves: 26,
        allowedPieceTypes: ['water', 'stone', 'wood', 'berry'],
        targets: [
          { type: 'chest', required: 4, current: 0 },
          { type: 'water', required: 25, current: 0 },
        ],
        woodReward: 260,
        unfogAreaIds: ['watermill_zone'],
        initialGimmicks: [
          { r: 1, c: 2, type: 'chest' as GimmickType, hp: 3, reward: 'rocket_h' } as any,
          { r: 1, c: 5, type: 'chest' as GimmickType, hp: 3, reward: 'rocket_h' } as any,
          { r: 6, c: 2, type: 'chest' as GimmickType, hp: 3, reward: 'bomb' } as any,
          { r: 6, c: 5, type: 'chest' as GimmickType, hp: 3, reward: 'bomb' } as any,
        ],
      });
    } else if (i === 50) {
      // 🌟 第2章フィナーレ：太鼓橋の激流大決戦（8x8、巨石＋侵食ツタ＋泥んこ）
      stages.push({
        id: 50,
        title: 'Stage 50: 朱塗り太鼓橋の激流大決戦！🌉👑',
        description: '第2章クライマックス！激流の中にそびえる巨石を打ち砕き、広がるツタを食い止めろ！',
        boardRows: 8,
        boardCols: 8,
        maxMoves: 28,
        creepingVine: true,
        allowedPieceTypes: ['wood', 'water', 'berry', 'twig', 'stone'],
        targets: [
          { type: 'boulder', required: 3, current: 0 },
          { type: 'vine', required: 10, current: 0 },
          { type: 'mud', required: 12, current: 0 },
        ],
        woodReward: 350,
        unfogAreaIds: ['fruit_orchard'],
        initialGimmicks: [
          { r: 2, c: 2, type: 'boulder' as GimmickType, hp: 3 },
          { r: 3, c: 5, type: 'boulder' as GimmickType, hp: 3 },
          { r: 5, c: 3, type: 'boulder' as GimmickType, hp: 3 },
          { r: 0, c: 0, type: 'vine' as GimmickType, hp: 1 },
          { r: 0, c: 7, type: 'vine' as GimmickType, hp: 1 },
          { r: 7, c: 0, type: 'vine' as GimmickType, hp: 1 },
          { r: 7, c: 7, type: 'vine' as GimmickType, hp: 1 },
        ],
        initialUnderlays: [
          { r: 3, c: 3, type: 'mud', hp: 2 }, { r: 3, c: 4, type: 'mud', hp: 2 },
          { r: 4, c: 3, type: 'mud', hp: 2 }, { r: 4, c: 4, type: 'mud', hp: 2 },
          { r: 2, c: 3, type: 'mud', hp: 1 }, { r: 2, c: 4, type: 'mud', hp: 1 },
          { r: 5, c: 3, type: 'mud', hp: 1 }, { r: 5, c: 4, type: 'mud', hp: 1 },
          { r: 3, c: 2, type: 'mud', hp: 1 }, { r: 4, c: 2, type: 'mud', hp: 1 },
          { r: 3, c: 5, type: 'mud', hp: 1 }, { r: 4, c: 5, type: 'mud', hp: 1 },
        ],
      });
    } else if (i === 75) {
      // 🌟 第3章フィナーレ：水晶湧水洞窟の神秘（9x9、浮力反転×全色ラッシュ）
      stages.push({
        id: 75,
        title: 'Stage 75: 水晶洞窟の神秘なる湧水 💎⬆️',
        description: '9×9超大盤面での浮力反転！水晶の奥に眠る宝箱を開放し、聖なる滝つぼへ進もう！',
        boardRows: 9,
        boardCols: 9,
        gravityDirection: 'up',
        maxMoves: 32,
        allowedPieceTypes: ['water', 'stone', 'mushroom', 'berry', 'wood', 'twig'],
        targets: [
          { type: 'chest', required: 5, current: 0 },
          { type: 'ice', required: 12, current: 0 },
          { type: 'mushroom', required: 25, current: 0 },
        ],
        woodReward: 420,
        unfogAreaIds: ['rainbow_falls'],
        initialGimmicks: [
          { r: 4, c: 4, type: 'chest' as GimmickType, hp: 3, reward: 'bomb' } as any,
          { r: 2, c: 2, type: 'chest' as GimmickType, hp: 3, reward: 'rocket_h' } as any,
          { r: 2, c: 6, type: 'chest' as GimmickType, hp: 3, reward: 'rocket_v' } as any,
          { r: 6, c: 2, type: 'chest' as GimmickType, hp: 3, reward: 'rocket_v' } as any,
          { r: 6, c: 6, type: 'chest' as GimmickType, hp: 3, reward: 'rocket_h' } as any,
          { r: 1, c: 4, type: 'ice' as GimmickType, hp: 2 },
          { r: 7, c: 4, type: 'ice' as GimmickType, hp: 2 },
          { r: 4, c: 1, type: 'ice' as GimmickType, hp: 2 },
          { r: 4, c: 7, type: 'ice' as GimmickType, hp: 2 },
        ],
      });
    } else if (i === 100) {
      // 🌟 第4章最終ボス：桃源郷の伝説グランドダム完成！
      stages.push({
        id: 100,
        title: 'Stage 100: 桃源郷の伝説グランドダム 👑🦫✨',
        description: '100ステージ到達記念！大要塞ダムを築き上げ、すべての仲間たちと桃源郷を完成させよう！',
        boardRows: 9,
        boardCols: 9,
        maxMoves: 34,
        creepingVine: true,
        allowedPieceTypes: ['wood', 'water', 'berry', 'mushroom', 'acorn', 'stone'],
        targets: [
          { type: 'boulder', required: 4, current: 0 },
          { type: 'chest', required: 4, current: 0 },
          { type: 'mud', required: 16, current: 0 },
          { type: 'wood', required: 35, current: 0 },
        ],
        woodReward: 600,
        unfogAreaIds: ['paradise_grand_dam'],
        initialGimmicks: [
          { r: 3, c: 3, type: 'boulder' as GimmickType, hp: 3 },
          { r: 3, c: 5, type: 'boulder' as GimmickType, hp: 3 },
          { r: 5, c: 3, type: 'boulder' as GimmickType, hp: 3 },
          { r: 5, c: 5, type: 'boulder' as GimmickType, hp: 3 },
          { r: 2, c: 4, type: 'chest' as GimmickType, hp: 3, reward: 'bomb' } as any,
          { r: 6, c: 4, type: 'chest' as GimmickType, hp: 3, reward: 'bomb' } as any,
          { r: 4, c: 2, type: 'chest' as GimmickType, hp: 3, reward: 'rocket_h' } as any,
          { r: 4, c: 6, type: 'chest' as GimmickType, hp: 3, reward: 'rocket_v' } as any,
          { r: 0, c: 0, type: 'vine' as GimmickType, hp: 1 },
          { r: 0, c: 8, type: 'vine' as GimmickType, hp: 1 },
          { r: 8, c: 0, type: 'vine' as GimmickType, hp: 1 },
          { r: 8, c: 8, type: 'vine' as GimmickType, hp: 1 },
        ],
        initialUnderlays: [
          { r: 3, c: 4, type: 'mud', hp: 2 }, { r: 5, c: 4, type: 'mud', hp: 2 },
          { r: 4, c: 3, type: 'mud', hp: 2 }, { r: 4, c: 5, type: 'mud', hp: 2 },
          { r: 2, c: 2, type: 'mud', hp: 1 }, { r: 2, c: 6, type: 'mud', hp: 1 },
          { r: 6, c: 2, type: 'mud', hp: 1 }, { r: 6, c: 6, type: 'mud', hp: 1 },
          { r: 1, c: 4, type: 'mud', hp: 1 }, { r: 7, c: 4, type: 'mud', hp: 1 },
          { r: 4, c: 1, type: 'mud', hp: 1 }, { r: 4, c: 7, type: 'mud', hp: 1 },
          { r: 3, c: 1, type: 'mud', hp: 1 }, { r: 3, c: 7, type: 'mud', hp: 1 },
          { r: 5, c: 1, type: 'mud', hp: 1 }, { r: 5, c: 7, type: 'mud', hp: 1 },
        ],
      });
    }

    // ==========================================
    // 🎲 通常ステージ（インテリジェント自動生成）
    // ==========================================
    else {
      // 1. フェーズ・エリアに応じたテーマ設計
      const phase = i <= 25 ? 1 : i <= 50 ? 2 : i <= 75 ? 3 : 4;

      // 2. 盤面サイズのバリエーション
      let boardRows = 7;
      let boardCols = 7;
      if (phase === 1) {
        boardRows = i % 6 === 2 ? 6 : 7;
        boardCols = boardRows;
      } else if (phase === 2) {
        boardRows = i % 5 === 0 ? 8 : 7;
        boardCols = boardRows;
      } else if (phase === 3) {
        boardRows = i % 4 === 0 ? 9 : i % 3 === 0 ? 8 : 7;
        boardCols = boardRows;
      } else {
        boardRows = i % 3 === 0 ? 9 : 8;
        boardCols = boardRows;
      }

      // 3. 重力反転（浮力 ⬆️）：7ステージ周期で定期的に水底パズルを体験！
      const gravityDirection: 'down' | 'up' = (i % 7 === 3 || i % 7 === 6) ? 'up' : 'down';

      // 4. カラーパレットのローテーション（4色爽快 〜 5色標準 〜 6色高難度）
      let pieceCount = 5;
      if (phase === 1 && i % 4 === 1) pieceCount = 4; // 序盤の爽快4色
      else if (phase >= 3 && i % 4 === 3) pieceCount = 6; // 後半の高難度6色

      // 素材の組み合わせをステージ番号に応じてシャッフル選択
      const paletteOffset = (i * 2) % ALL_PIECES.length;
      const allowedPieceTypes: PieceType[] = [];
      for (let p = 0; p < pieceCount; p++) {
        allowedPieceTypes.push(ALL_PIECES[(paletteOffset + p) % ALL_PIECES.length]);
      }
      // 木材または水滴は常に1つ以上含める
      if (!allowedPieceTypes.includes('wood') && !allowedPieceTypes.includes('water')) {
        allowedPieceTypes[0] = 'wood';
      }

      // 5. 変形・穴あき盤面（i % 6 === 5 のときに四隅カットやダイヤモンド型）
      let disabledTiles: { r: number; c: number }[] | undefined = undefined;
      if (i % 6 === 5 && boardRows >= 7) {
        disabledTiles = [
          { r: 0, c: 0 }, { r: 0, c: boardCols - 1 },
          { r: boardRows - 1, c: 0 }, { r: boardRows - 1, c: boardCols - 1 },
        ];
      }

      // 6. ギミックのインテリジェント配備（氷・岩・ツタ・泥んこ・宝箱・巨石）
      const stageGimmicks: { r: number; c: number; type: GimmickType; hp: number; reward?: SpecialType }[] = [];
      const stageUnderlays: { r: number; c: number; type: 'mud'; hp: number }[] = [];
      let creepingVine = false;

      // ギミックテーマの選定
      const gimmickMod = i % 6;
      if (gimmickMod === 1) {
        // 泥んこ敷き詰めパズル
        const mudCount = 6 + (i % 6) * 2;
        const startR = Math.max(1, Math.floor(boardRows / 2) - 1);
        const startC = Math.max(1, Math.floor(boardCols / 2) - 1);
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            if (stageUnderlays.length < mudCount) {
              stageUnderlays.push({
                r: startR + r,
                c: startC + c,
                type: 'mud',
                hp: phase >= 2 && (r + c) % 2 === 0 ? 2 : 1,
              });
            }
          }
        }
      } else if (gimmickMod === 2) {
        // からくり宝箱パズル
        stageGimmicks.push({
          r: Math.floor(boardRows / 2),
          c: Math.floor(boardCols / 2) - 1,
          type: 'chest',
          hp: 3,
          reward: i % 2 === 0 ? 'bomb' : 'rocket_h',
        });
        stageGimmicks.push({
          r: Math.floor(boardRows / 2),
          c: Math.floor(boardCols / 2) + 1,
          type: 'chest',
          hp: 3,
          reward: 'rocket_v',
        });
        if (phase >= 3) {
          stageGimmicks.push({
            r: Math.floor(boardRows / 2) - 1,
            c: Math.floor(boardCols / 2),
            type: 'chest',
            hp: 3,
            reward: 'bomb',
          });
        }
      } else if (gimmickMod === 3) {
        // 侵食ツタサバイバル
        creepingVine = true;
        stageGimmicks.push({ r: 1, c: 1, type: 'vine', hp: 1 });
        stageGimmicks.push({ r: boardRows - 2, c: boardCols - 2, type: 'vine', hp: 1 });
        if (phase >= 2) {
          stageGimmicks.push({ r: 1, c: boardCols - 2, type: 'vine', hp: 1 });
        }
      } else if (gimmickMod === 4) {
        // 氷と大岩の河川
        stageGimmicks.push({ r: 2, c: 2, type: 'ice', hp: phase >= 2 ? 2 : 1 });
        stageGimmicks.push({ r: boardRows - 3, c: boardCols - 3, type: 'ice', hp: phase >= 2 ? 2 : 1 });
        stageGimmicks.push({ r: Math.floor(boardRows / 2), c: Math.floor(boardCols / 2), type: 'rock', hp: 2 });
      } else if (gimmickMod === 5) {
        // ダムの巨石 or 複合ギミック
        if (phase >= 2) {
          stageGimmicks.push({ r: Math.floor(boardRows / 2), c: Math.floor(boardCols / 2), type: 'boulder', hp: 3 });
        } else {
          stageGimmicks.push({ r: 2, c: 3, type: 'rock', hp: 2 });
          stageGimmicks.push({ r: 4, c: 3, type: 'rock', hp: 2 });
        }
        // 泥んこも併設
        stageUnderlays.push({ r: 2, c: 2, type: 'mud', hp: 1 });
        stageUnderlays.push({ r: 2, c: 4, type: 'mud', hp: 1 });
        stageUnderlays.push({ r: 4, c: 2, type: 'mud', hp: 1 });
        stageUnderlays.push({ r: 4, c: 4, type: 'mud', hp: 1 });
      }

      // 7. 目標（targets）の多彩な決定
      const mainPiece = allowedPieceTypes[0];
      const subPiece = allowedPieceTypes[1] || 'water';
      const mainReq = 12 + (i % 10) * 2;
      const subReq = 10 + (i % 8) * 2;

      const stageTargets: { type: string; required: number; current: number }[] = [
        { type: mainPiece, required: mainReq, current: 0 },
      ];

      // ギミックがあればギミックを第2目標に、なければ素材
      if (stageUnderlays.length > 0) {
        stageTargets.push({ type: 'mud', required: stageUnderlays.length, current: 0 });
      } else if (stageGimmicks.some((g) => g.type === 'chest')) {
        stageTargets.push({
          type: 'chest',
          required: stageGimmicks.filter((g) => g.type === 'chest').length,
          current: 0,
        });
      } else if (stageGimmicks.some((g) => g.type === 'boulder')) {
        stageTargets.push({
          type: 'boulder',
          required: stageGimmicks.filter((g) => g.type === 'boulder').length,
          current: 0,
        });
      } else if (stageGimmicks.some((g) => g.type === 'ice')) {
        stageTargets.push({
          type: 'ice',
          required: stageGimmicks.filter((g) => g.type === 'ice').length,
          current: 0,
        });
      } else if (stageGimmicks.some((g) => g.type === 'vine')) {
        stageTargets.push({
          type: 'vine',
          required: Math.max(6, stageGimmicks.filter((g) => g.type === 'vine').length * 2),
          current: 0,
        });
      } else {
        stageTargets.push({ type: subPiece, required: subReq, current: 0 });
      }

      // フェーズ3以降は第3目標も追加
      if (phase >= 3 && stageTargets.length < 3 && allowedPieceTypes.length >= 3) {
        stageTargets.push({ type: allowedPieceTypes[2], required: 12 + (i % 5) * 2, current: 0 });
      }

      // 8. 手数（maxMoves）の精密チューニング（16〜30手）
      const baseMoves = 18 + (phase * 2);
      const movesMod = (i % 5) - 2; // -2 〜 +2
      const maxMoves = Math.max(16, Math.min(32, baseMoves + movesMod + (boardRows >= 8 ? 2 : 0)));

      // 9. タイトルと演出文
      const titles = [
        'せせらぎの小枝集め', '陽だまりの木の実摘み', '澄んだ渓流の治水',
        '水底に眠る湧水', '木漏れ日のキャンプ地', '荒れた川底の土木工事',
        '緑豊かな水車広場', '花咲くせせらぎの道', '岩波砕ける難所',
        '原生林の奥地開拓', '果樹園の実りと収穫', '静寂のエメラルド湖',
        '風渡る高原のダム', '古代の石造堰堤', '虹かける大瀑布'
      ];
      const titleName = titles[(i - 1) % titles.length];

      stages.push({
        id: i,
        title: `Stage ${i}: ${titleName} ${gravityDirection === 'up' ? '⬆️' : ''}`,
        description: `${gravityDirection === 'up' ? '【浮力反転】ドロップが下から上へ浮かぶ！' : ''}指定素材を集めて、開拓地を復興させよう！`,
        maxMoves,
        boardRows,
        boardCols,
        gravityDirection,
        allowedPieceTypes,
        disabledTiles,
        creepingVine,
        targets: stageTargets,
        woodReward: 100 + Math.floor(i * 3.5),
        unfogAreaIds: [],
        initialGimmicks: stageGimmicks.length > 0 ? stageGimmicks : undefined,
        initialUnderlays: stageUnderlays.length > 0 ? stageUnderlays : undefined,
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
      getAssetUrl("/assets/shallows_stage_0.jpg"),
      getAssetUrl("/assets/shallows_stage_1.jpg"),
      getAssetUrl("/assets/shallows_stage_2.jpg"),
      getAssetUrl("/assets/shallows_stage_3.jpg"),
      getAssetUrl("/assets/shallows_stage_4.jpg"),
      getAssetUrl("/assets/shallows_stage_5.jpg"),
    ],
    tasks: [
      { id: "task_stream_1", title: "浮遊ゴミと空き缶を回収する", woodCost: 60, isCompleted: false, icon: "🧹", visualLabel: "水面のゴミが消える" },
      { id: "task_stream_2", title: "泥水とヘドロをすくい出す", woodCost: 80, isCompleted: false, icon: "🪣", visualLabel: "水が透き通る" },
      { id: "task_stream_3", title: "散乱した倒木と枯れ枝を撤去", woodCost: 100, isCompleted: false, icon: "🪵", visualLabel: "川の流れがスムーズに" },
      { id: "task_stream_4", title: "丸太の飛び石歩道を組む", woodCost: 120, isCompleted: false, icon: "🌉", visualLabel: "向こう岸へ渡れる" },
      { id: "task_stream_5", title: "清流の水草と野花を植える", woodCost: 140, isCompleted: false, icon: "🌸", visualLabel: "カルガモ親子が喜ぶ" },
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
        detailImages: [
      getAssetUrl("/assets/dam_stage_0.jpg"),
      getAssetUrl("/assets/dam_stage_1.jpg"),
      getAssetUrl("/assets/dam_stage_2.jpg"),
      getAssetUrl("/assets/dam_stage_3.jpg"),
      getAssetUrl("/assets/dam_stage_4.jpg"),
      getAssetUrl("/assets/dam_stage_5.jpg"),
    ],
    tasks: [
      { id: "task_dam_1", title: "決壊した泥と土砂を除去", woodCost: 70, isCompleted: false, icon: "🧹", visualLabel: "川底が整う" },
      { id: "task_dam_2", title: "頑丈な基礎杭を川底に打ち込む", woodCost: 90, isCompleted: false, icon: "🪨", visualLabel: "土台が安定する" },
      { id: "task_dam_3", title: "小枝を集めて網状に編み込む", woodCost: 110, isCompleted: false, icon: "🌿", visualLabel: "ダムの骨組みができる" },
      { id: "task_dam_4", title: "太い丸太で水流をせき止める", woodCost: 130, isCompleted: false, icon: "🪵", visualLabel: "穏やかなダム湖ができる" },
      { id: "task_dam_5", title: "魚が通れる魚道を整備する", woodCost: 150, isCompleted: false, icon: "🐟", visualLabel: "アユが跳ね始める" },
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
        detailImages: [
      getAssetUrl("/assets/lodge_stage_0.jpg"),
      getAssetUrl("/assets/lodge_stage_1.jpg"),
      getAssetUrl("/assets/lodge_stage_2.jpg"),
      getAssetUrl("/assets/lodge_stage_3.jpg"),
      getAssetUrl("/assets/lodge_stage_4.jpg"),
      getAssetUrl("/assets/lodge_stage_5.jpg"),
    ],
    tasks: [
      { id: "task_lodge_1", title: "雑草と枯れ枝の刈り払い", woodCost: 80, isCompleted: false, icon: "🌾", visualLabel: "敷地が広がる" },
      { id: "task_lodge_2", title: "ロッジの頑丈な土台と柱を組む", woodCost: 100, isCompleted: false, icon: "🪵", visualLabel: "骨組みが建つ" },
      { id: "task_lodge_3", title: "草と小枝のふかふかベッド作り", woodCost: 130, isCompleted: false, icon: "🛏️", visualLabel: "温かい寝床ができる" },
      { id: "task_lodge_4", title: "雨を防ぐ杉皮の三角屋根を葺く", woodCost: 160, isCompleted: false, icon: "🛖", visualLabel: "雨風をしのげる" },
      { id: "task_lodge_5", title: "レンガの暖炉と煙突を作る", woodCost: 180, isCompleted: false, icon: "🔥", visualLabel: "煙が立ちのぼるお家完成" },
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
        detailImages: [
      getAssetUrl("/assets/pier_stage_0.jpg"),
      getAssetUrl("/assets/pier_stage_1.jpg"),
      getAssetUrl("/assets/pier_stage_2.jpg"),
      getAssetUrl("/assets/pier_stage_3.jpg"),
      getAssetUrl("/assets/pier_stage_4.jpg"),
      getAssetUrl("/assets/pier_stage_5.jpg"),
    ],
    tasks: [
      { id: "task_pier_1", title: "流された折れ杭を抜き取る", woodCost: 90, isCompleted: false, icon: "🪓", visualLabel: "水際が安全になる" },
      { id: "task_pier_2", title: "松の丸太で新しい桟橋の杭を打つ", woodCost: 110, isCompleted: false, icon: "🪵", visualLabel: "水面に足場が伸びる" },
      { id: "task_pier_3", title: "滑りにくいスノコ板を敷き詰める", woodCost: 140, isCompleted: false, icon: "🪜", visualLabel: "快適な歩行テラス" },
      { id: "task_pier_4", title: "日よけの藁葺き屋根を架ける", woodCost: 170, isCompleted: false, icon: "🛖", visualLabel: "涼しい休憩所ができる" },
      { id: "task_pier_5", title: "カワセミが止まる止まり木を立てる", woodCost: 190, isCompleted: false, icon: "🐦", visualLabel: "カワセミがやってくる" },
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
        detailImages: [
      getAssetUrl("/assets/mill_stage_0.jpg"),
      getAssetUrl("/assets/mill_stage_1.jpg"),
      getAssetUrl("/assets/mill_stage_2.jpg"),
      getAssetUrl("/assets/mill_stage_3.jpg"),
      getAssetUrl("/assets/mill_stage_4.jpg"),
      getAssetUrl("/assets/mill_stage_5.jpg"),
    ],
    tasks: [
      { id: "task_mill_1", title: "水車に絡みついたツタを刈り取る", woodCost: 100, isCompleted: false, icon: "🌿", visualLabel: "車輪が露出する" },
      { id: "task_mill_2", title: "巨大な木製大歯車を修復する", woodCost: 120, isCompleted: false, icon: "⚙️", visualLabel: "歯車が噛み合う" },
      { id: "task_mill_3", title: "水流を導く木樋（とい）を架け直す", woodCost: 150, isCompleted: false, icon: "🌊", visualLabel: "水車がコトコト回転開始" },
      { id: "task_mill_4", title: "製粉小屋の壁と窓をリフォーム", woodCost: 180, isCompleted: false, icon: "🧱", visualLabel: "温かい工房が蘇る" },
      { id: "task_mill_5", title: "パン焼き用の石窯を築く", woodCost: 200, isCompleted: false, icon: "🥖", visualLabel: "香ばしいパン工房完成" },
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
        detailImages: [
      getAssetUrl("/assets/garden_stage_0.jpg"),
      getAssetUrl("/assets/garden_stage_1.jpg"),
      getAssetUrl("/assets/garden_stage_2.jpg"),
      getAssetUrl("/assets/garden_stage_3.jpg"),
      getAssetUrl("/assets/garden_stage_4.jpg"),
      getAssetUrl("/assets/garden_stage_5.jpg"),
    ],
    tasks: [
      { id: "task_garden_1", title: "尖った岩やトゲ植物を除去する", woodCost: 110, isCompleted: false, icon: "🪨", visualLabel: "柔らかな土が現れる" },
      { id: "task_garden_2", title: "腐葉土を漉き込んで花壇を耕す", woodCost: 140, isCompleted: false, icon: "🌱", visualLabel: "豊かな土壌ができる" },
      { id: "task_garden_3", title: "色とりどりの野花の種を蒔く", woodCost: 170, isCompleted: false, icon: "🌸", visualLabel: "一面の花畑が芽吹く" },
      { id: "task_garden_4", title: "木製の散策小道とベンチを作る", woodCost: 200, isCompleted: false, icon: "🪵", visualLabel: "憩いの花園テラス" },
      { id: "task_garden_5", title: "夜に光るホタルの木を植える", woodCost: 230, isCompleted: false, icon: "✨", visualLabel: "幻想的なホタルの光" },
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
        detailImages: [
      getAssetUrl("/assets/camp_stage_0.jpg"),
      getAssetUrl("/assets/camp_stage_1.jpg"),
      getAssetUrl("/assets/camp_stage_2.jpg"),
      getAssetUrl("/assets/camp_stage_3.jpg"),
      getAssetUrl("/assets/camp_stage_4.jpg"),
      getAssetUrl("/assets/camp_stage_5.jpg"),
    ],
    tasks: [
      { id: "task_camp_1", title: "ぬかるんだ泥水を排水する", woodCost: 120, isCompleted: false, icon: "🧹", visualLabel: "乾いた地面ができる" },
      { id: "task_camp_2", title: "腐った倒木を撤去し薪を割る", woodCost: 150, isCompleted: false, icon: "🪓", visualLabel: "キャンプ薪の山" },
      { id: "task_camp_3", title: "川石を丸く組んで安全な焚き火台を作る", woodCost: 180, isCompleted: false, icon: "🔥", visualLabel: "パチパチ燃える焚き火" },
      { id: "task_camp_4", title: "丸太を削り出したベンチとテーブル", woodCost: 210, isCompleted: false, icon: "🪵", visualLabel: "バーベキューエリア" },
      { id: "task_camp_5", title: "洗い場とアライグマの水桶を置く", woodCost: 240, isCompleted: false, icon: "🦝", visualLabel: "アライグマがやってくる" },
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
        detailImages: [
      getAssetUrl("/assets/workshop_stage_0.jpg"),
      getAssetUrl("/assets/workshop_stage_1.jpg"),
      getAssetUrl("/assets/workshop_stage_2.jpg"),
      getAssetUrl("/assets/workshop_stage_3.jpg"),
      getAssetUrl("/assets/workshop_stage_4.jpg"),
      getAssetUrl("/assets/workshop_stage_5.jpg"),
    ],
    tasks: [
      { id: "task_shop_1", title: "錆びた古い金物を片付ける", woodCost: 130, isCompleted: false, icon: "🧹", visualLabel: "安全な床スペース" },
      { id: "task_shop_2", title: "巨大な樫の木で頑丈な作業台を組む", woodCost: 160, isCompleted: false, icon: "🪵", visualLabel: "職人の木工作業台" },
      { id: "task_shop_3", title: "丸太切り用の大きなノコギリ台を設置", woodCost: 190, isCompleted: false, icon: "🪚", visualLabel: "正確な木材加工が可能" },
      { id: "task_shop_4", title: "木工ツールを整理する壁面ラックを作る", woodCost: 220, isCompleted: false, icon: "🪓", visualLabel: "プロ仕様の道具棚" },
      { id: "task_shop_5", title: "木くずを集めた温かい小部屋を作る", woodCost: 250, isCompleted: false, icon: "🦔", visualLabel: "ハリネズミが住み着く" },
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
        detailImages: [
      getAssetUrl("/assets/bridge_stage_0.jpg"),
      getAssetUrl("/assets/bridge_stage_1.jpg"),
      getAssetUrl("/assets/bridge_stage_2.jpg"),
      getAssetUrl("/assets/bridge_stage_3.jpg"),
      getAssetUrl("/assets/bridge_stage_4.jpg"),
      getAssetUrl("/assets/bridge_stage_5.jpg"),
    ],
    tasks: [
      { id: "task_bridge_1", title: "崩落した旧橋の破片を回収する", woodCost: 140, isCompleted: false, icon: "🪨", visualLabel: "渓谷が綺麗になる" },
      { id: "task_bridge_2", title: "両岸の岩盤に巨大な基礎杭を固定", woodCost: 170, isCompleted: false, icon: "🪵", visualLabel: "頑丈な橋の土台" },
      { id: "task_bridge_3", title: "アーチ状の美しい太鼓梁を渡す", woodCost: 200, isCompleted: false, icon: "🌉", visualLabel: "太鼓橋の骨組み完成" },
      { id: "task_bridge_4", title: "朱塗りの手すりと高欄を取り付ける", woodCost: 230, isCompleted: false, icon: "🏮", visualLabel: "風情ある朱塗りの橋" },
      { id: "task_bridge_5", title: "橋のたもとに露天の岩風呂を掘る", woodCost: 260, isCompleted: false, icon: "🐒", visualLabel: "ニホンザルが温まる" },
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
        detailImages: [
      getAssetUrl("/assets/spring_stage_0.jpg"),
      getAssetUrl("/assets/spring_stage_1.jpg"),
      getAssetUrl("/assets/spring_stage_2.jpg"),
      getAssetUrl("/assets/spring_stage_3.jpg"),
      getAssetUrl("/assets/spring_stage_4.jpg"),
      getAssetUrl("/assets/spring_stage_5.jpg"),
    ],
    tasks: [
      { id: "task_spring_1", title: "沼を覆うヘドロと藻をすくい出す", woodCost: 150, isCompleted: false, icon: "🧹", visualLabel: "水底が見え始める" },
      { id: "task_spring_2", title: "天然の水晶石と白砂を敷き詰める", woodCost: 180, isCompleted: false, icon: "💎", visualLabel: "エメラルドグリーンに輝く" },
      { id: "task_spring_3", title: "竹と丸太で清らかな湧水路を組む", woodCost: 220, isCompleted: false, icon: "🎋", visualLabel: "サラサラと湧水が注ぐ" },
      { id: "task_spring_4", title: "水辺を囲む木の観察デッキを作る", woodCost: 260, isCompleted: false, icon: "🪵", visualLabel: "水鏡を見渡すテラス" },
      { id: "task_spring_5", title: "睡蓮の白い花を水面に浮かべる", woodCost: 290, isCompleted: false, icon: "🦢", visualLabel: "純白のハクチョウが舞い降りる" },
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
        detailImages: [
      getAssetUrl("/assets/orchard_stage_0.jpg"),
      getAssetUrl("/assets/orchard_stage_1.jpg"),
      getAssetUrl("/assets/orchard_stage_2.jpg"),
      getAssetUrl("/assets/orchard_stage_3.jpg"),
      getAssetUrl("/assets/orchard_stage_4.jpg"),
      getAssetUrl("/assets/orchard_stage_5.jpg"),
    ],
    tasks: [
      { id: "task_berry_1", title: "害虫にやられた枯れ枝を剪定する", woodCost: 160, isCompleted: false, icon: "✂️", visualLabel: "日当たりが良くなる" },
      { id: "task_berry_2", title: "有機肥料を混ぜて果樹園を耕す", woodCost: 190, isCompleted: false, icon: "🌱", visualLabel: "豊かな黒土になる" },
      { id: "task_berry_3", title: "ブルーベリーと木いちごの苗を植樹", woodCost: 230, isCompleted: false, icon: "🍓", visualLabel: "赤い実がたわわに実る" },
      { id: "task_berry_4", title: "鳥よけの木製風車と水やり水路", woodCost: 270, isCompleted: false, icon: "⚙️", visualLabel: "果樹園の自動給水" },
      { id: "task_berry_5", title: "手作りベリージャムの木製直売所", woodCost: 300, isCompleted: false, icon: "🦡", visualLabel: "アナグマがジャムを味見" },
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
        detailImages: [
      getAssetUrl("/assets/waterfall_stage_0.jpg"),
      getAssetUrl("/assets/waterfall_stage_1.jpg"),
      getAssetUrl("/assets/waterfall_stage_2.jpg"),
      getAssetUrl("/assets/waterfall_stage_3.jpg"),
      getAssetUrl("/assets/waterfall_stage_4.jpg"),
      getAssetUrl("/assets/waterfall_stage_5.jpg"),
    ],
    tasks: [
      { id: "task_fall_1", title: "滝壺を塞いでいた巨岩を撤去する", woodCost: 170, isCompleted: false, icon: "💥", visualLabel: "轟音とともに水が落下" },
      { id: "task_fall_2", title: "激しい水しぶきを抑える消波ブロック組み", woodCost: 210, isCompleted: false, icon: "🪨", visualLabel: "安全な滝壺プール" },
      { id: "task_fall_3", title: "断崖に沿って登る木製ジグザグ階段", woodCost: 250, isCompleted: false, icon: "🪜", visualLabel: "滝上へのアクセス路" },
      { id: "task_fall_4", title: "マイナスイオンを浴びる展望デッキ", woodCost: 290, isCompleted: false, icon: "🪵", visualLabel: "大迫力の滝見テラス" },
      { id: "task_fall_5", title: "断崖の頂上にイヌワシの止まり木を築く", woodCost: 330, isCompleted: false, icon: "🦅", visualLabel: "イヌワシが舞い戻る" },
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
        detailImages: [
      getAssetUrl("/assets/stargaze_stage_0.jpg"),
      getAssetUrl("/assets/stargaze_stage_1.jpg"),
      getAssetUrl("/assets/stargaze_stage_2.jpg"),
      getAssetUrl("/assets/stargaze_stage_3.jpg"),
      getAssetUrl("/assets/stargaze_stage_4.jpg"),
      getAssetUrl("/assets/stargaze_stage_5.jpg"),
    ],
    tasks: [
      { id: "task_stars_1", title: "落雷で焦げた大木を整地する", woodCost: 190, isCompleted: false, icon: "🪓", visualLabel: "広い見晴らしスペース" },
      { id: "task_stars_2", title: "高さ6mの巨大な丸太櫓を立ち上げる", woodCost: 230, isCompleted: false, icon: "🪵", visualLabel: "空に近づく大やぐら" },
      { id: "task_stars_3", title: "360度パノラマの星見ウッドデッキ", woodCost: 270, isCompleted: false, icon: "✨", visualLabel: "夜空を一望できる床" },
      { id: "task_stars_4", title: "木製真鍮の天体望遠鏡を取り付ける", woodCost: 310, isCompleted: false, icon: "🔭", visualLabel: "月や天の川を観察" },
      { id: "task_stars_5", title: "星明かりを映すランタンツリーを灯す", woodCost: 350, isCompleted: false, icon: "🦇", visualLabel: "モモンガが滑空してくる" },
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
        detailImages: [
      getAssetUrl("/assets/sacred_stage_0.jpg"),
      getAssetUrl("/assets/sacred_stage_1.jpg"),
      getAssetUrl("/assets/sacred_stage_2.jpg"),
      getAssetUrl("/assets/sacred_stage_3.jpg"),
      getAssetUrl("/assets/sacred_stage_4.jpg"),
      getAssetUrl("/assets/sacred_stage_5.jpg"),
    ],
    tasks: [
      { id: "task_sacred_1", title: "神木の根元の雑草とゴミを清掃", woodCost: 200, isCompleted: false, icon: "🧹", visualLabel: "厳かな空間ができる" },
      { id: "task_sacred_2", title: "根元に清らかな湧き水を注ぎ込む", woodCost: 240, isCompleted: false, icon: "💧", visualLabel: "千年杉に若葉が萌える" },
      { id: "task_sacred_3", title: "藁を編み上げた巨大なしめ縄を巻く", woodCost: 290, isCompleted: false, icon: "⛩️", visualLabel: "神聖な御神木の威厳" },
      { id: "task_sacred_4", title: "参道の石畳と木製灯籠を並べる", woodCost: 340, isCompleted: false, icon: "🏮", visualLabel: "厳かな参拝道が完成" },
      { id: "task_sacred_5", title: "ヒノキの一枚板で神木の鳥居を奉納", woodCost: 380, isCompleted: false, icon: "🦊", visualLabel: "賢者のキツネが宿る" },
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
        detailImages: [
      getAssetUrl("/assets/paradise_stage_0.jpg"),
      getAssetUrl("/assets/paradise_stage_1.jpg"),
      getAssetUrl("/assets/paradise_stage_2.jpg"),
      getAssetUrl("/assets/paradise_stage_3.jpg"),
      getAssetUrl("/assets/paradise_stage_4.jpg"),
      getAssetUrl("/assets/paradise_stage_5.jpg"),
    ],
    tasks: [
      { id: "task_lake_1", title: "激流の岩壁を削り巨大な基礎を固める", woodCost: 230, isCompleted: false, icon: "🪨", visualLabel: "要塞ダムの巨大基礎" },
      { id: "task_lake_2", title: "何百本もの大丸太を組む要塞大堰堤", woodCost: 280, isCompleted: false, icon: "🪵", visualLabel: "大要塞グランドダム" },
      { id: "task_lake_3", title: "満水の湖を渡るふたりの木製跳ね橋", woodCost: 330, isCompleted: false, icon: "🌉", visualLabel: "桃源郷への最後の架け橋" },
      { id: "task_lake_4", title: "ダム湖の湖畔に建つ展望グランドロッジ", woodCost: 380, isCompleted: false, icon: "🏰", visualLabel: "すべての動物たちの集う館" },
      { id: "task_lake_5", title: "黄金に輝くふたりのビーバー記念碑", woodCost: 430, isCompleted: false, icon: "👑", visualLabel: "伝説のダムマスター達成" },
    ],
    themeColor: "from-amber-400 via-rose-500 to-purple-500",
    bgGradient: "from-amber-900/60 via-rose-900/60 to-purple-950/80",
  },
];

