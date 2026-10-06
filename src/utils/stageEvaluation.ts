// ステージクリア時の★1〜3評価およびボーナス計算ユーティリティ

export interface StarThresholds {
  star3MinMoves: number; // ★3に必要な残り手数（これ以上）
  star2MinMoves: number; // ★2に必要な残り手数（これ以上）
}

/**
 * 最大手数から★2・★3に必要な残り手数の閾値を算出
 */
export const getStarThresholds = (maxMoves: number): StarThresholds => {
  // ★3: 残り手数が全体の45%以上（切り上げ）
  const star3MinMoves = Math.max(1, Math.ceil(maxMoves * 0.45));
  // ★2: 残り手数が全体の25%以上（切り上げ）
  const star2MinMoves = Math.max(1, Math.ceil(maxMoves * 0.25));
  return { star3MinMoves, star2MinMoves };
};

/**
 * クリア時の残り手数から★1〜3を判定
 * @param maxMoves ステージの最大制限手数
 * @param remainingMoves クリア時に残っていた手数
 * @returns 1 | 2 | 3
 */
export const calculateStageStars = (maxMoves: number, remainingMoves: number): number => {
  const { star3MinMoves, star2MinMoves } = getStarThresholds(maxMoves);
  if (remainingMoves >= star3MinMoves) {
    return 3;
  }
  if (remainingMoves >= star2MinMoves) {
    return 2;
  }
  return 1;
};

/**
 * 星数に応じたボーナス木材ポイント
 */
export const getStarWoodBonus = (stars: number): number => {
  switch (stars) {
    case 3:
      return 35; // パーフェクトボーナス
    case 2:
      return 15; // グッドボーナス
    default:
      return 0;
  }
};
