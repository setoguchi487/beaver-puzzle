import React, { useEffect } from 'react';
import { STAR_MILESTONES, type StarMilestone } from '../../data/starRoadMilestones';
import { X, Star, Gift, Check, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';

interface StarRoadModalProps {
  totalStars: number;
  claimedMilestones: number[];
  onClaimMilestone: (milestone: StarMilestone) => void;
  onClose: () => void;
}

export const StarRoadModal: React.FC<StarRoadModalProps> = ({
  totalStars,
  claimedMilestones,
  onClaimMilestone,
  onClose,
}) => {
  // ESCキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleClaim = (m: StarMilestone) => {
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#f59e0b', '#34d399', '#38bdf8', '#ffffff'],
    });
    onClaimMilestone(m);
  };

  const progressPercent = Math.min(100, Math.round((totalStars / 300) * 100));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-925 to-slate-950 border-2 border-yellow-500/50 rounded-3xl p-4 sm:p-5 shadow-2xl text-white space-y-4 max-h-[90vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl text-slate-950 shadow-md">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide text-white flex items-center space-x-1.5">
                <span>スターロード</span>
                <span className="text-[10px] text-yellow-300 font-bold bg-yellow-500/20 px-2 py-0.5 rounded-full border border-yellow-500/40">
                  星集め報酬
                </span>
              </h2>
              <span className="text-[10px] text-slate-400 block">
                集めた星の数に応じて豪華ボーナスを獲得！
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
            title="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 獲得星数プログレスバー */}
        <div className="p-3 bg-yellow-950/30 border border-yellow-500/30 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-black">
            <div className="flex items-center space-x-1.5 text-yellow-300">
              <Star className="w-4 h-4 fill-yellow-400" />
              <span>現在の獲得スター:</span>
              <span className="text-base text-yellow-400 font-mono">{totalStars}</span>
              <span className="text-slate-400 text-xs">/ 300</span>
            </div>
            <span className="text-yellow-400/80 font-mono text-[11px]">{progressPercent}%</span>
          </div>

          <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-yellow-500 to-amber-400 h-full rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* マイルストーンリスト */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-0.5 min-h-[260px]">
          {STAR_MILESTONES.map((m) => {
            const isReached = totalStars >= m.starsRequired;
            const isClaimed = claimedMilestones.includes(m.starsRequired);
            const canClaim = isReached && !isClaimed;

            return (
              <div
                key={m.starsRequired}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  isClaimed
                    ? 'bg-slate-900/50 border-slate-800 opacity-60'
                    : canClaim
                    ? 'bg-gradient-to-r from-yellow-500/20 via-amber-500/15 to-slate-900 border-yellow-400/80 shadow-md ring-1 ring-yellow-400/50 animate-golden-shine'
                    : 'bg-slate-900/80 border-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0 font-black ${
                      isClaimed
                        ? 'bg-slate-800 text-slate-500'
                        : isReached
                        ? 'bg-yellow-400 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-[10px] font-mono leading-none mt-0.5">{m.starsRequired}</span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-black text-white truncate">{m.title}</span>
                      <span className="text-xs">{m.badgeIcon}</span>
                    </div>
                    <div className="text-[10px] text-slate-300 mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-amber-300 font-bold">🪵 +{m.rewardWood}</span>
                      {m.boosters?.hammer && (
                        <span className="text-cyan-300 font-bold">🔨×{m.boosters.hammer}</span>
                      )}
                      {m.boosters?.saw && (
                        <span className="text-emerald-300 font-bold">🪚×{m.boosters.saw}</span>
                      )}
                      {m.boosters?.tail && (
                        <span className="text-purple-300 font-bold">🦫×{m.boosters.tail}</span>
                      )}
                      {m.boosters?.clock && (
                        <span className="text-rose-300 font-bold">⏱️×{m.boosters.clock}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ボタン状態 */}
                <div className="shrink-0 ml-2">
                  {isClaimed ? (
                    <div className="flex items-center space-x-1 text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                      <Check className="w-3.5 h-3.5" />
                      <span>受取済</span>
                    </div>
                  ) : canClaim ? (
                    <button
                      onClick={() => handleClaim(m)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-yellow-500/30 flex items-center space-x-1 active:scale-95 transition-all cursor-pointer animate-pulse-slow"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>受取る!</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-1 text-[10px] text-slate-500 bg-slate-800/60 px-2 py-1 rounded-xl">
                      <Lock className="w-3 h-3" />
                      <span>あと{m.starsRequired - totalStars}個</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* フッター */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-[10px] text-slate-400">
            ★3を目指してステージをクリアしよう！
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
