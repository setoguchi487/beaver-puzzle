import React, { useState } from 'react';
import type { FrontierArea, Creature } from '../../types';
import { sounds } from '../../utils/soundEffects';
import {
  X,
  BookOpen,
  Award,
  Heart,
  Lock,
  TrendingUp,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface CreatureBadgeModalProps {
  areas: FrontierArea[];
  badges: string[];
  unlockedCreatures: string[];
  woodPoints: number;
  currentStageId: number;
  onClose: () => void;
  onNavigateToArea?: (areaId: string) => void;
}

export const CreatureBadgeModal: React.FC<CreatureBadgeModalProps> = ({
  areas,
  badges,
  unlockedCreatures,
  woodPoints,
  currentStageId,
  onClose,
  onNavigateToArea,
}) => {
  const [activeTab, setActiveTab] = useState<'creatures' | 'badges' | 'stats'>('creatures');
  const [selectedCreature, setSelectedCreature] = useState<{ creature: Creature; area: FrontierArea } | null>(null);

  // 全タスク数と完了タスク数
  const totalTasks = areas.reduce((sum, a) => sum + a.tasks.length, 0);
  const completedTasks = areas.reduce((sum, a) => sum + a.tasks.filter((t) => t.isCompleted).length, 0);
  const completionPercent = Math.round((completedTasks / totalTasks) * 100);

  const handleCreatureClick = (creature: Creature, area: FrontierArea, isUnlocked: boolean) => {
    if (!isUnlocked) {
      sounds.playSwipe();
      return;
    }
    sounds.playBirdChirp();
    setSelectedCreature({ creature, area });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/50 rounded-3xl p-5 shadow-2xl text-white space-y-4 max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/40 text-emerald-300">
              {activeTab === 'creatures' && <BookOpen className="w-5 h-5" />}
              {activeTab === 'badges' && <Award className="w-5 h-5" />}
              {activeTab === 'stats' && <TrendingUp className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {activeTab === 'creatures' && '森と川の生き物図鑑 🐾'}
                {activeTab === 'badges' && 'ふたりの開拓バッジ 🏅'}
                {activeTab === 'stats' && '開拓ジャーナル＆記録 📊'}
              </h2>
              <p className="text-[10px] text-slate-400">
                {activeTab === 'creatures' && `${unlockedCreatures.length} / ${areas.length} 種類の動物に出会ったよ`}
                {activeTab === 'badges' && `${badges.length} / ${areas.length} 個のバッジを獲得！`}
                {activeTab === 'stats' && `開拓進捗率 ${completionPercent}%`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* タブ切り替えバー */}
        <div className="flex bg-slate-950/60 p-1 rounded-2xl border border-slate-800/80">
          <button
            onClick={() => setActiveTab('creatures')}
            className={`flex-1 py-1.5 text-xs font-black rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'creatures'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🐾 生き物 ({unlockedCreatures.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 py-1.5 text-xs font-black rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'badges'
                ? 'bg-amber-500 text-amber-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🏅 バッジ ({badges.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-1.5 text-xs font-black rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>📊 記録</span>
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-0.5">
          {/* 1. 生き物図鑑 */}
          {activeTab === 'creatures' && (
            <div className="grid grid-cols-2 gap-2.5">
              {areas.map((a) => {
                const isUnlocked = unlockedCreatures.includes(a.creature.id);
                return (
                  <div
                    key={a.creature.id}
                    onClick={() => handleCreatureClick(a.creature, a, isUnlocked)}
                    className={`relative p-3 rounded-2xl border text-left transition-all ${
                      isUnlocked
                        ? 'bg-slate-800/80 hover:bg-slate-750 border-emerald-500/40 shadow-sm cursor-pointer hover:border-emerald-400 hover:scale-[1.02]'
                        : 'bg-slate-900/40 border-slate-800/80 opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                          isUnlocked
                            ? 'bg-emerald-500/20 border border-emerald-500/30 shadow-inner'
                            : 'bg-slate-800/60 border border-slate-700/50'
                        }`}
                      >
                        {isUnlocked ? a.creature.icon : <Lock className="w-5 h-5 text-slate-600" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-white truncate">
                          {isUnlocked ? a.creature.name : '？？？？'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {a.name}
                        </div>
                        {isUnlocked ? (
                          <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {a.creature.rarity === 'legendary' ? '✨ 伝説' : a.creature.rarity === 'rare' ? '⭐ 希少' : '🌿 生息中'}
                          </span>
                        ) : (
                          <span className="inline-block mt-1 text-[9px] text-slate-500">
                            エリア修復で登場
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. 開拓バッジルーム */}
          {activeTab === 'badges' && (
            <div className="space-y-2">
              {areas.map((a) => {
                const isEarned = badges.includes(a.badge.id);
                return (
                  <div
                    key={a.badge.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      isEarned
                        ? 'bg-amber-950/20 border-amber-500/40 text-amber-100 shadow-sm'
                        : 'bg-slate-900/40 border-slate-800/80 opacity-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl ${
                          isEarned
                            ? 'bg-amber-500/20 border border-amber-500/40 shadow-inner ring-1 ring-amber-400/30 animate-pulse-slow'
                            : 'bg-slate-800/60 border border-slate-700/50'
                        }`}
                      >
                        {isEarned ? a.badge.icon : <Lock className="w-5 h-5 text-slate-600" />}
                      </div>

                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-black text-white">
                            {isEarned ? a.badge.name : '未獲得のバッジ'}
                          </span>
                          {isEarned && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-md font-bold">
                              GET!
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {isEarned ? a.badge.description : `${a.name}を完全修復すると授与`}
                        </div>
                      </div>
                    </div>

                    {isEarned && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. 開拓ジャーナル＆記録 */}
          {activeTab === 'stats' && (
            <div className="space-y-3">
              {/* プログレスカード */}
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-750 space-y-2">
                <div className="flex justify-between items-center text-xs font-black">
                  <span className="text-slate-300">全体開拓進捗</span>
                  <span className="text-emerald-400">{completedTasks} / {totalTasks} タスク ({completionPercent}%)</span>
                </div>
                <div className="w-full bg-slate-850 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>

              {/* 主要ステータスグリッド */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-750 text-center">
                  <span className="text-[10px] font-bold text-slate-400 block">所持木材ポイント</span>
                  <span className="text-xl font-black text-amber-400 mt-0.5 inline-block">🪵 {woodPoints}</span>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-750 text-center">
                  <span className="text-[10px] font-bold text-slate-400 block">パズル最高到達</span>
                  <span className="text-xl font-black text-cyan-400 mt-0.5 inline-block">Stage {currentStageId}</span>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-750 text-center">
                  <span className="text-[10px] font-bold text-slate-400 block">救出した生き物</span>
                  <span className="text-xl font-black text-emerald-400 mt-0.5 inline-block">🐾 {unlockedCreatures.length} 匹</span>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-2xl border border-slate-750 text-center">
                  <span className="text-[10px] font-bold text-slate-400 block">獲得した栄誉バッジ</span>
                  <span className="text-xl font-black text-yellow-400 mt-0.5 inline-block">🏅 {badges.length} 個</span>
                </div>
              </div>

              {/* ビーバーからの励ましメッセージ */}
              <div className="p-3.5 bg-gradient-to-r from-amber-950/40 to-slate-900 border border-amber-500/30 rounded-2xl flex items-center space-x-3">
                <span className="text-3xl animate-bounce-subtle">🦫</span>
                <div className="text-xs text-amber-200">
                  <p className="font-bold">ふたりの絆で谷が息を吹き返してるよ！</p>
                  <p className="text-[10px] text-amber-400/80 mt-0.5">「全15エリアのコンプリートを目指して、力を合わせて進もう！」</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 生き物詳細ポップアップ */}
        {selectedCreature && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-xs bg-slate-900 border-2 border-emerald-400/60 rounded-3xl p-5 shadow-2xl text-center space-y-3 animate-complete-pop">
              <span className="text-6xl inline-block drop-shadow-lg animate-bounce-subtle">
                {selectedCreature.creature.icon}
              </span>
              <div>
                <h3 className="text-base font-black text-white">{selectedCreature.creature.name}</h3>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full inline-block mt-1 font-bold">
                  {selectedCreature.area.name}に生息
                </span>
              </div>
              <p className="text-xs text-slate-300 bg-slate-800/80 p-3 rounded-2xl leading-relaxed text-left">
                {selectedCreature.creature.description}
              </p>
              <div className="text-xs text-rose-300 font-bold bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 flex items-center justify-center space-x-1">
                <Heart className="w-3.5 h-3.5 fill-current animate-pulse text-rose-400" />
                <span>「{selectedCreature.creature.comment}」</span>
              </div>
              <div className="flex space-x-2 pt-1">
                {onNavigateToArea && (
                  <button
                    onClick={() => {
                      onNavigateToArea(selectedCreature.area.id);
                      setSelectedCreature(null);
                      onClose();
                    }}
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center space-x-1 cursor-pointer transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>エリアを見に行く</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedCreature(null)}
                  className="py-2 px-4 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
