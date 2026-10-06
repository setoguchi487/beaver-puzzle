/**
 * ビーバーゲームのセーブデータ管理（バックアップ・引き継ぎ・復元）ユーティリティ
 */

export interface BeaverSaveDataPayload {
  version: string;
  exportedAt: string;
  data: {
    wood?: string | null;
    areas?: string | null;
    badges?: string | null;
    creatures?: string | null;
    unlocked_stage?: string | null;
    stage_records?: string | null;
    buddy?: string | null;
    star_milestones?: string | null;
    owned_decorations?: string | null;
    active_decorations?: string | null;
    boosters?: string | null;
    daily_date?: string | null;
  };
}

export interface SaveDataSummary {
  wood: number;
  clearedAreasCount: number;
  totalAreasCount: number;
  unlockedStage: number;
  totalStars: number;
  creaturesCount: number;
  isExistingPlayer: boolean;
}

const STORAGE_PREFIX = 'beaver_puzzle_state_v1';

/**
 * 現在の進捗サマリーを取得
 */
export function getSaveDataSummary(): SaveDataSummary {
  const wood = Number(localStorage.getItem(`${STORAGE_PREFIX}_wood`) || '60');
  const unlockedStage = Number(localStorage.getItem(`${STORAGE_PREFIX}_unlocked_stage`) || '1');
  
  let clearedAreasCount = 0;
  try {
    const rawAreas = localStorage.getItem(`${STORAGE_PREFIX}_areas`);
    if (rawAreas) {
      const parsed = JSON.parse(rawAreas);
      if (Array.isArray(parsed)) {
        clearedAreasCount = parsed.filter((a: any) => a.status === 'completed').length;
      }
    }
  } catch {}

  let totalStars = 0;
  try {
    const rawRecords = localStorage.getItem(`${STORAGE_PREFIX}_stage_records`);
    if (rawRecords) {
      const parsed = JSON.parse(rawRecords);
      Object.values(parsed).forEach((r: any) => {
        if (r && typeof r.stars === 'number') {
          totalStars += r.stars;
        }
      });
    }
  } catch {}

  let creaturesCount = 0;
  try {
    const rawCreatures = localStorage.getItem(`${STORAGE_PREFIX}_creatures`);
    if (rawCreatures) {
      const parsed = JSON.parse(rawCreatures);
      if (Array.isArray(parsed)) creaturesCount = parsed.length;
    }
  } catch {}

  const isExistingPlayer = unlockedStage > 1 || clearedAreasCount > 0 || totalStars > 0 || wood !== 60;

  return {
    wood,
    clearedAreasCount,
    totalAreasCount: 15,
    unlockedStage,
    totalStars,
    creaturesCount,
    isExistingPlayer,
  };
}

/**
 * セーブデータをエクスポート用文字列（Base64形式）に変換
 */
export function exportSaveDataString(): string {
  const payload: BeaverSaveDataPayload = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: {
      wood: localStorage.getItem(`${STORAGE_PREFIX}_wood`),
      areas: localStorage.getItem(`${STORAGE_PREFIX}_areas`),
      badges: localStorage.getItem(`${STORAGE_PREFIX}_badges`),
      creatures: localStorage.getItem(`${STORAGE_PREFIX}_creatures`),
      unlocked_stage: localStorage.getItem(`${STORAGE_PREFIX}_unlocked_stage`),
      stage_records: localStorage.getItem(`${STORAGE_PREFIX}_stage_records`),
      buddy: localStorage.getItem(`${STORAGE_PREFIX}_buddy`),
      star_milestones: localStorage.getItem(`${STORAGE_PREFIX}_star_milestones`),
      owned_decorations: localStorage.getItem(`${STORAGE_PREFIX}_owned_decorations`),
      active_decorations: localStorage.getItem(`${STORAGE_PREFIX}_active_decorations`),
      boosters: localStorage.getItem('beaver_puzzle_boosters'),
      daily_date: localStorage.getItem('beaver_daily_cleared_date'),
    },
  };

  const jsonStr = JSON.stringify(payload);
  // 日本語やUnicodeに対応したBase64エンコード
  return btoa(encodeURIComponent(jsonStr));
}

/**
 * エクスポート用文字列からセーブデータを復元
 */
export function importSaveDataString(encodedString: string): { success: boolean; message: string } {
  try {
    const trimmed = encodedString.trim();
    if (!trimmed) {
      return { success: false, message: '引継ぎコードが入力されていません。' };
    }

    let jsonStr = '';
    try {
      jsonStr = decodeURIComponent(atob(trimmed));
    } catch {
      // Base64でない場合は生JSONを試す
      jsonStr = trimmed;
    }

    const payload: BeaverSaveDataPayload = JSON.parse(jsonStr);
    if (!payload || !payload.data) {
      return { success: false, message: 'セーブデータの形式が正しくありません。' };
    }

    const { data } = payload;
    if (data.wood !== undefined && data.wood !== null) {
      localStorage.setItem(`${STORAGE_PREFIX}_wood`, data.wood);
    }
    if (data.areas) localStorage.setItem(`${STORAGE_PREFIX}_areas`, data.areas);
    if (data.badges) localStorage.setItem(`${STORAGE_PREFIX}_badges`, data.badges);
    if (data.creatures) localStorage.setItem(`${STORAGE_PREFIX}_creatures`, data.creatures);
    if (data.unlocked_stage) localStorage.setItem(`${STORAGE_PREFIX}_unlocked_stage`, data.unlocked_stage);
    if (data.stage_records) localStorage.setItem(`${STORAGE_PREFIX}_stage_records`, data.stage_records);
    if (data.buddy) localStorage.setItem(`${STORAGE_PREFIX}_buddy`, data.buddy);
    if (data.star_milestones) localStorage.setItem(`${STORAGE_PREFIX}_star_milestones`, data.star_milestones);
    if (data.owned_decorations) localStorage.setItem(`${STORAGE_PREFIX}_owned_decorations`, data.owned_decorations);
    if (data.active_decorations) localStorage.setItem(`${STORAGE_PREFIX}_active_decorations`, data.active_decorations);
    if (data.boosters) localStorage.setItem('beaver_puzzle_boosters', data.boosters);
    if (data.daily_date) localStorage.setItem('beaver_daily_cleared_date', data.daily_date);

    return { success: true, message: 'セーブデータを正常に復元しました！ゲームを再開します。' };
  } catch (err: any) {
    return { success: false, message: 'データの復元に失敗しました。コードをご確認ください。' };
  }
}
