import React, { useState } from 'react';
import { X, Lock, Check, Gift } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { FrontierArea, PlayerBoosters } from '../../types';
import type { PreBoosters } from '../puzzle/Match3Board';
import { isAreaFeatureUnlocked } from '../../utils/areaUnlocks';
import { sounds } from '../../utils/soundEffects';

interface CampfireQuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: FrontierArea[];
  onAddWood: (amount: number) => void;
  onBoosterUpdated?: () => void;
}

interface DailyQuest {
  id: string;
  title: string;
  icon: string;
  progress: number;
  max: number;
  rewardType: 'wood' | 'booster' | 'pre';
  rewardKey?: keyof PlayerBoosters | keyof PreBoosters;
  rewardAmount: number;
  rewardLabel: string;
  isClaimed: boolean;
}

const DEFAULT_QUESTS: DailyQuest[] = [
  { id: 'q1', title: '丸太ピースを30個消去する', icon: '🪵', progress: 30, max: 30, rewardType: 'wood', rewardAmount: 150, rewardLabel: '木材 +150', isClaimed: false },
  { id: 'q2', title: '水流ピースを25個消去する', icon: '💧', progress: 25, max: 25, rewardType: 'pre', rewardKey: 'startRocket', rewardAmount: 1, rewardLabel: '初期ロケット x1', isClaimed: false },
  { id: 'q3', title: 'パズルステージを1回クリアする', icon: '🌟', progress: 1, max: 1, rewardType: 'booster', rewardKey: 'clock', rewardAmount: 1, rewardLabel: 'ぜんまい時計 x1', isClaimed: false },
];

const STORAGE_QUESTS_KEY = 'beaver_puzzle_campfire_quests';

export const CampfireQuestsModal: React.FC<CampfireQuestsModalProps> = ({
  isOpen,
  onClose,
  areas,
  onAddWood,
  onBoosterUpdated,
}) => {
  const [quests, setQuests] = useState<DailyQuest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_QUESTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_QUESTS;
  });

  if (!isOpen) return null;

  const isUnlocked = isAreaFeatureUnlocked('riverside_camp', areas);
  const campArea = areas.find((a) => a.id === 'riverside_camp');
  const completedTasks = campArea ? campArea.tasks.filter((t) => t.isCompleted).length : 0;
  const totalTasks = campArea ? campArea.tasks.length : 5;

  const handleClaim = (qId: string) => {
    const q = quests.find((item) => item.id === qId);
    if (!q || q.isClaimed || q.progress < q.max) return;

    sounds.playStageClear();
    try {
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#fbbf24', '#f59e0b', '#38bdf8', '#34d399'],
      });
    } catch {}

    if (q.rewardType === 'wood') {
      onAddWood(q.rewardAmount);
    } else if (q.rewardType === 'booster' && q.rewardKey) {
      try {
        const saved = localStorage.getItem('beaver_puzzle_boosters');
        const current = saved ? JSON.parse(saved) : { hammer: 2, saw: 2, tail: 2, clock: 2 };
        current[q.rewardKey] = (current[q.rewardKey] || 0) + q.rewardAmount;
        localStorage.setItem('beaver_puzzle_boosters', JSON.stringify(current));
      } catch {}
    } else if (q.rewardType === 'pre' && q.rewardKey) {
      try {
        const saved = localStorage.getItem('beaver_puzzle_pre_boosters');
        const current = saved ? JSON.parse(saved) : { startRocket: 2, startBomb: 2, extraMoves: 2 };
        current[q.rewardKey] = (current[q.rewardKey] || 0) + q.rewardAmount;
        localStorage.setItem('beaver_puzzle_pre_boosters', JSON.stringify(current));
      } catch {}
    }

    const updated = quests.map((item) => (item.id === qId ? { ...item, isClaimed: true } : item));
    setQuests(updated);
    localStorage.setItem(STORAGE_QUESTS_KEY, JSON.stringify(updated));

    if (onBoosterUpdated) {
      onBoosterUpdated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-gradient-to-b from-orange-950/95 via-slate-900 to-slate-950 border-2 border-orange-500/50 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-orange-500/20 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-3xl animate-bounce-subtle">🔥🦝</span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-orange-300">
                焚き火の集会場・デイリー依頼
              </h3>
              <p className="text-[10px] text-slate-300">
                アライグマ達の仲間から届いたプチ依頼！
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ロック状態 */}
        {!isUnlocked ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-900/80 rounded-2xl border border-slate-700/80 my-4">
            <div className="w-14 h-14 rounded-full bg-orange-950/80 border-2 border-orange-500/40 flex items-center justify-center text-2xl shadow-inner">
              <Lock className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">
                せせらぎキャンプ場が未復興です
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                開拓マップで「せせらぎキャンプ場」を完成させると、焚き火を囲んだ仲間たちのデイリー依頼がオープンします！
              </p>
            </div>
            <div className="text-[11px] font-black text-orange-400 bg-orange-950/60 px-3 py-1 rounded-full border border-orange-500/30">
              キャンプ場の復興進捗: {completedTasks} / {totalTasks} ステップ完了
            </div>
          </div>
        ) : (
          /* クエスト一覧 */
          <div className="flex-1 flex flex-col space-y-2.5 overflow-y-auto no-scrollbar">
            {quests.map((q) => {
              const isCompleted = q.progress >= q.max;

              return (
                <div
                  key={q.id}
                  className={`bg-slate-900/90 border rounded-2xl p-3 flex items-center justify-between space-x-2 transition-all ${
                    q.isClaimed
                      ? 'border-slate-800 opacity-60'
                      : isCompleted
                      ? 'border-orange-400/80 bg-orange-950/30 ring-1 ring-orange-400/50'
                      : 'border-orange-500/20'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                    <span className="text-2xl shrink-0">{q.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-white truncate">{q.title}</div>
                      <div className="text-[10px] text-orange-300 font-bold mt-0.5">
                        報酬: {q.rewardLabel}
                      </div>
                    </div>
                  </div>

                  {q.isClaimed ? (
                    <span className="text-[10px] font-black text-slate-400 bg-slate-850 px-2.5 py-1.5 rounded-xl flex items-center space-x-1 shrink-0">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>完了</span>
                    </span>
                  ) : isCompleted ? (
                    <button
                      onClick={() => handleClaim(q.id)}
                      className="px-3 py-1.5 bg-gradient-to-r from-orange-400 to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md active:scale-95 transition-transform flex items-center space-x-1 shrink-0 animate-pulse cursor-pointer"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>受取！</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-1 rounded-lg shrink-0">
                      {q.progress}/{q.max}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center text-[10px] text-orange-200/70 pt-1">
          {isUnlocked ? 'アライグマ「キャンプファイヤーのご馳走をみんなで楽しもう！」' : 'キャンプ場を直して、温かい焚き火を囲もう！'}
        </div>
      </div>
    </div>
  );
};
