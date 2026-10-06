import React, { useEffect } from 'react';
import {
  getTodayDateString,
  getDailyPuzzleStage,
  getDailyRewardInfo,
  isDailyClearedToday,
} from '../../utils/dailyPuzzle';
import { PIECE_CONFIG } from '../../data/masterData';
import { X, Calendar, Play, CheckCircle2, Gift } from 'lucide-react';

interface DailyPuzzleModalProps {
  onStartDaily: () => void;
  onClose: () => void;
}

export const DailyPuzzleModal: React.FC<DailyPuzzleModalProps> = ({
  onStartDaily,
  onClose,
}) => {
  const todayStr = getTodayDateString();
  const stage = getDailyPuzzleStage(todayStr);
  const rewardInfo = getDailyRewardInfo(todayStr);
  const isCleared = isDailyClearedToday();

  // ESCキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-925 to-slate-950 border-2 border-cyan-400/60 rounded-3xl p-5 shadow-2xl text-white space-y-4 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center space-x-2 text-left">
            <div className="p-2 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl text-slate-950 shadow-md">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wide text-white flex items-center space-x-1.5">
                <span>日替わり渓流パズル</span>
                <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded-full font-bold">
                  DAILY
                </span>
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                {todayStr}
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

        {/* お題の紹介カード */}
        <div className="p-3.5 bg-gradient-to-b from-cyan-950/30 to-slate-900/90 border border-cyan-500/30 rounded-2xl space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-cyan-300 uppercase tracking-wider bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-500/30">
              TODAY'S MISSION
            </span>
            <span className="text-[10px] text-slate-400">
              制限手数: <span className="text-white font-bold">{stage.maxMoves}</span>手
            </span>
          </div>

          <h3 className="text-sm font-black text-white leading-snug">
            {stage.title.replace('日替わり: ', '')}
          </h3>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            {stage.description}
          </p>

          {/* 目標素材プレビュー */}
          <div className="pt-1.5 border-t border-slate-800 flex items-center space-x-2">
            <span className="text-[10px] text-slate-400 font-bold">目標素材:</span>
            <div className="flex items-center space-x-2">
              {stage.targets.map((tgt, i) => {
                const conf = (PIECE_CONFIG as any)[tgt.type];
                return (
                  <div key={i} className="flex items-center space-x-0.5 text-xs font-mono font-bold">
                    <span>{conf?.icon || '📦'}</span>
                    <span className="text-amber-300">{tgt.required}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 本日のクリア報酬 */}
        <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-2xl space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-amber-300 flex items-center space-x-1">
              <Gift className="w-3.5 h-3.5" />
              <span>本日のクリアボーナス</span>
            </span>
            {isCleared && (
              <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-0.5">
                <CheckCircle2 className="w-3 h-3" />
                <span>獲得済</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3 text-xs font-black">
            <span className="text-amber-400">🪵 +{rewardInfo.wood}</span>
            {rewardInfo.boosters.hammer && (
              <span className="text-cyan-300">🔨 ×{rewardInfo.boosters.hammer}</span>
            )}
            {rewardInfo.boosters.saw && (
              <span className="text-emerald-300">🪚 ×{rewardInfo.boosters.saw}</span>
            )}
            {rewardInfo.boosters.tail && (
              <span className="text-purple-300">🦫 ×{rewardInfo.boosters.tail}</span>
            )}
            {rewardInfo.boosters.clock && (
              <span className="text-rose-300">⏱️ ×{rewardInfo.boosters.clock}</span>
            )}
          </div>
        </div>

        {/* アクションボタン */}
        {isCleared ? (
          <div className="p-3 bg-slate-900 border border-emerald-500/30 rounded-2xl text-center space-y-1">
            <div className="text-xs font-black text-emerald-400 flex items-center justify-center space-x-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>本日のデイリーパズルはクリア済みです！</span>
            </div>
            <p className="text-[10px] text-slate-400">
              明日また新しいお題と報酬が届きます。お楽しみに！
            </p>
          </div>
        ) : (
          <button
            onClick={onStartDaily}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-cyan-500/25 flex items-center justify-center space-x-2 active:scale-98 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>今日のお題に挑戦する！ 🎮</span>
          </button>
        )}
      </div>
    </div>
  );
};
