import React, { useState, useEffect } from 'react';
import type { StageRecord } from '../../types';
import { STAGES, PIECE_CONFIG } from '../../data/masterData';
import { X, Play, Star, Lock, Sparkles, ChevronRight } from 'lucide-react';

interface StageSelectModalProps {
  unlockedStageId: number; // ユーザーが到達している最大ステージ番号（1〜100）
  currentStageId: number;  // 現在選択されているステージ
  stageRecords: { [stageId: number]: StageRecord }; // ステージ別レコード
  onSelectStage: (stageId: number) => void;
  onClose: () => void;
}

export const StageSelectModal: React.FC<StageSelectModalProps> = ({
  unlockedStageId,
  currentStageId,
  stageRecords,
  onSelectStage,
  onClose,
}) => {
  // チャプター定義
  const CHAPTERS = [
    { id: 1, name: '第1章', subName: '小川・巣作り', range: [1, 25], icon: '🌱', bg: 'from-emerald-950/40 to-teal-950/30' },
    { id: 2, name: '第2章', subName: '激流・水車小屋', range: [26, 50], icon: '🌊', bg: 'from-blue-950/40 to-cyan-950/30' },
    { id: 3, name: '第3章', subName: '果樹園・秘境渓谷', range: [51, 75], icon: '🍎', bg: 'from-amber-950/40 to-orange-950/30' },
    { id: 4, name: '第4章', subName: '桃源郷グランドダム', range: [76, 100], icon: '👑', bg: 'from-purple-950/40 to-fuchsia-950/30' },
  ];

  // 初期タブ: 現在の最新到達ステージが属するチャプター
  const [activeTab, setActiveTab] = useState<number>(() => {
    if (unlockedStageId <= 25) return 1;
    if (unlockedStageId <= 50) return 2;
    if (unlockedStageId <= 75) return 3;
    return 4;
  });

  // ESCキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const currentChapter = CHAPTERS.find((c) => c.id === activeTab) || CHAPTERS[0];

  // 全スター獲得数
  const totalStars = Object.values(stageRecords).reduce((acc, rec) => acc + (rec?.stars || 0), 0);
  const chapterStages = STAGES.filter(
    (s) => s.id >= currentChapter.range[0] && s.id <= currentChapter.range[1]
  );

  // チャプター内の獲得星数
  const chapterStars = chapterStages.reduce((acc, s) => {
    return acc + (stageRecords[s.id]?.stars || 0);
  }, 0);
  const chapterMaxStars = chapterStages.length * 3;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-925 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-4 sm:p-5 shadow-2xl text-white space-y-3.5 max-h-[92vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl text-slate-950 shadow-md">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide text-white flex items-center space-x-2">
                <span>ステージ選択</span>
                <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                  全100ステージ
                </span>
              </h2>
              <div className="text-[10px] text-slate-400 flex items-center space-x-2">
                <span>最新到達: Stage {unlockedStageId}</span>
                <span>•</span>
                <span className="text-yellow-400 font-bold flex items-center space-x-0.5">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-300 inline" />
                  <span>{totalStars} / 300</span>
                </span>
              </div>
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

        {/* クイックスタート: 最新ステージへ挑戦 */}
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-400/50 rounded-2xl p-2.5 flex items-center justify-between shadow-xs">
          <div className="text-left">
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/30 px-1.5 py-0.5 rounded-md">
              NEXT STAGE
            </span>
            <div className="text-xs font-black text-white mt-0.5">
              Stage {unlockedStageId}: {STAGES.find((s) => s.id === unlockedStageId)?.title.split(':')[1] || '新たな開拓地へ！'}
            </div>
          </div>
          <button
            onClick={() => {
              onSelectStage(unlockedStageId);
              onClose();
            }}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-md flex items-center space-x-1.5 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>つづきから遊ぶ！</span>
          </button>
        </div>

        {/* チャプタータブ切替 */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
            {CHAPTERS.map((ch) => {
              const isActive = activeTab === ch.id;
              const isLocked = unlockedStageId < ch.range[0];
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveTab(ch.id)}
                  className={`py-2 px-1 rounded-2xl text-[10px] font-black transition-all flex flex-col items-center justify-center cursor-pointer relative ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                      : isLocked
                      ? 'bg-slate-900/60 text-slate-500 border border-slate-800'
                      : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/60'
                  }`}
                >
                  <span className="text-sm leading-none">{ch.icon}</span>
                  <span className="truncate leading-tight mt-1 font-black">{ch.name}</span>
                  <span className="text-[8px] opacity-80 leading-none scale-90">
                    {ch.range[0]}〜{ch.range[1]}
                  </span>
                  {isLocked && (
                    <div className="absolute top-1 right-1">
                      <Lock className="w-2.5 h-2.5 text-slate-500" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* チャプター進捗バナー */}
          <div className="flex items-center justify-between px-2 text-[10px] text-slate-400">
            <span className="font-bold text-amber-200">
              {currentChapter.name}: {currentChapter.subName}
            </span>
            <span className="flex items-center space-x-1 text-yellow-300 font-mono">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-300" />
              <span>{chapterStars} / {chapterMaxStars}</span>
            </span>
          </div>
        </div>

        {/* ステージリスト（スクロール可能） */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 pr-0.5 min-h-[220px]">
          {chapterStages.map((st) => {
            const isUnlocked = st.id <= unlockedStageId;
            const isNext = st.id === unlockedStageId;
            const record = stageRecords[st.id];
            const stars = record?.stars || 0;
            const isCurrentPlaying = currentStageId === st.id;

            if (!isUnlocked) {
              return (
                <div
                  key={st.id}
                  className="p-2.5 bg-slate-950/40 border border-slate-800/60 rounded-2xl flex items-center justify-between opacity-50 select-none"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-500">Stage {st.id}</div>
                      <div className="text-[10px] text-slate-600">前のステージをクリアして解放</div>
                    </div>
                  </div>
                  <div className="flex space-x-0.5 text-slate-700">
                    <Star className="w-3.5 h-3.5" />
                    <Star className="w-3.5 h-3.5" />
                    <Star className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            }

            return (
              <button
                key={st.id}
                onClick={() => {
                  onSelectStage(st.id);
                  onClose();
                }}
                className={`w-full p-2.5 rounded-2xl flex items-center justify-between text-left transition-all active:scale-98 cursor-pointer border ${
                  isNext
                    ? 'bg-gradient-to-r from-amber-500/25 to-yellow-500/15 border-amber-400/80 shadow-md ring-1 ring-amber-400/50'
                    : isCurrentPlaying
                    ? 'bg-slate-800/95 border-cyan-400/70 shadow-sm'
                    : 'bg-slate-900/85 hover:bg-slate-800/90 border-slate-750 hover:border-amber-400/40 shadow-xs'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl font-mono text-xs font-black flex items-center justify-center shrink-0 ${
                      isNext
                        ? 'bg-amber-400 text-slate-950 shadow-md animate-pulse-slow'
                        : stars > 0
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {st.id}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-black text-white truncate">
                        {st.title.split(':')[1]?.trim() || st.title}
                      </span>
                      {isNext && (
                        <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-full uppercase shrink-0">
                          挑戦中!
                        </span>
                      )}
                    </div>
                    {/* 目標素材アイコンプレビュー */}
                    <div className="flex items-center space-x-2 mt-0.5 text-[10px] text-slate-400">
                      <span>最大{st.maxMoves}手</span>
                      <span>•</span>
                      <div className="flex items-center space-x-1">
                        {st.targets.map((tgt, idx) => {
                          const pConf = (PIECE_CONFIG as any)[tgt.type];
                          return (
                            <span key={idx} className="flex items-center space-x-0.5">
                              <span>{pConf?.icon || '📦'}</span>
                              <span className="font-mono">{tgt.required}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 星評価（★1〜3）& アクション */}
                <div className="flex items-center space-x-2 shrink-0">
                  <div className="flex space-x-0.5">
                    {[1, 2, 3].map((sIndex) => (
                      <Star
                        key={sIndex}
                        className={`w-3.5 h-3.5 ${
                          sIndex <= stars
                            ? 'fill-yellow-400 text-yellow-300 drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]'
                            : 'text-slate-700'
                        }`}
                      />
                    ))}
                  </div>

                  <div className="p-1 rounded-lg bg-slate-800/80 text-amber-300 group-hover:text-white">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* フッター */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-[10px] text-slate-400">
            ★3を目指して再挑戦するとボーナス木材GET! 🪵✨
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
