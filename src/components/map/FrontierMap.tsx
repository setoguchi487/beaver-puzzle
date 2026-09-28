import React, { useState } from 'react';
import type { FrontierArea, Creature } from '../../types';
import confetti from 'canvas-confetti';
import {
  Lock,
  CheckCircle2,
  Sparkles,
  Play,
  Heart,
  Hammer,
} from 'lucide-react';

interface FrontierMapProps {
  areas: FrontierArea[];
  woodPoints: number;
  badgesCount: number;
  creaturesCount: number;
  onStartPuzzle: (stageId: number) => void;
  onCompleteTask: (areaId: string, taskId: string, cost: number) => void;
  onCompleteArea: (area: FrontierArea) => void;
  currentStageId: number;
}

export const FrontierMap: React.FC<FrontierMapProps> = ({
  areas,
  woodPoints,
  badgesCount,
  creaturesCount,
  onStartPuzzle,
  onCompleteTask,
  onCompleteArea,
  currentStageId,
}) => {
  const [selectedCreature, setSelectedCreature] = useState<Creature | null>(null);
  const [creatureReaction, setCreatureReaction] = useState<string | null>(null);

  const handleTaskClick = (area: FrontierArea, taskId: string, cost: number) => {
    if (woodPoints < cost) return;

    onCompleteTask(area.id, taskId, cost);

    // 全タスク完了かチェック
    const remainingTasks = area.tasks.filter((t) => t.id !== taskId && !t.isCompleted);
    if (remainingTasks.length === 0) {
      // エリアコンプリート！
      onCompleteArea(area);
      triggerConfetti();
    }
  };

  const handleCreatureTap = (c: Creature) => {
    setSelectedCreature(c);
    const reactions = ['ピィッ！♪', 'クエックエッ✨', 'るんるん❤️', 'カリカリ…🌰', 'パタパタ〜🌿'];
    setCreatureReaction(reactions[Math.floor(Math.random() * reactions.length)]);
    setTimeout(() => setCreatureReaction(null), 1800);
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#A855F7'],
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 max-w-md mx-auto pb-24 select-none">
      {/* 上部固定ステータスバー */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-3xl p-1 bg-amber-500/20 rounded-2xl border border-amber-500/30">
              🦫
            </span>
            <div>
              <h1 className="text-sm font-black text-white tracking-tight flex items-center">
                ダム開拓フロンティア
              </h1>
              <span className="text-[10px] text-slate-400">
                霧を晴らして自然を蘇らせよう
              </span>
            </div>
          </div>

          {/* 所持木材 ＆ バッジ */}
          <div className="flex items-center space-x-1.5">
            <div className="flex items-center space-x-1 bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 rounded-xl">
              <span className="text-sm">🪵</span>
              <span className="text-xs font-black text-amber-400">
                {woodPoints.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center space-x-1 bg-purple-500/20 border border-purple-500/40 px-2 py-1 rounded-xl">
              <span className="text-sm">🏅</span>
              <span className="text-xs font-black text-purple-300">
                {badgesCount}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="p-4 space-y-4">
        {/* パズル挑戦バナー（最上部で目立つ） */}
        <div className="p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl shadow-lg text-amber-950 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider bg-black/10 px-2 py-0.5 rounded-full inline-block">
              木材集め ＆ 霧晴らし
            </span>
            <h3 className="text-base font-black mt-1">
              パズル Stage {currentStageId}
            </h3>
            <p className="text-[11px] text-amber-900 font-bold">
              クリアで木材GET ＆ 新エリアの霧が晴れる！
            </p>
          </div>

          <button
            onClick={() => onStartPuzzle(currentStageId)}
            className="p-3 bg-white text-orange-600 rounded-2xl shadow-md hover:scale-105 active:scale-95 transition-transform flex items-center justify-center font-black"
          >
            <Play className="w-6 h-6 fill-current" />
          </button>
        </div>

        {/* 開拓エリア一覧 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
              川の開拓エリア一覧
            </h3>
            <span className="text-[11px] text-slate-400 font-bold">
              図鑑: {creaturesCount} 種発見
            </span>
          </div>

          {areas.map((area) => {
            const isCompleted = area.status === 'completed';
            const isClearedFog = area.status === 'cleared_fog';
            const isLockedFog = area.status === 'locked_fog';

            return (
              <div
                key={area.id}
                className={`relative rounded-3xl p-4 border transition-all overflow-hidden ${
                  isCompleted
                    ? 'bg-gradient-to-br from-emerald-950/70 via-slate-900 to-teal-950/70 border-emerald-500/50 shadow-lg'
                    : isClearedFog
                    ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-slate-900/40 border-slate-800'
                }`}
              >
                {/* 1. 霧でロックされているエリア（演出） */}
                {isLockedFog && (
                  <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                    <div className="relative">
                      <span className="text-5xl opacity-40 blur-xs">🌫️</span>
                      <Lock className="w-5 h-5 text-slate-400 absolute inset-0 m-auto" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-300">
                        {area.name}（未踏の地）
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {area.unlockStageId
                          ? `Stage ${area.unlockStageId} クリア または バッジ ${area.requiredBadges} 個で霧が晴れます`
                          : `バッジ ${area.requiredBadges} 個で霧が晴れます`}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. 霧が晴れて開拓可能なエリア */}
                {isClearedFog && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl p-1.5 bg-amber-500/20 text-amber-300 rounded-2xl border border-amber-500/30">
                          {area.icon}
                        </span>
                        <div>
                          <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            霧が晴れた！開拓可能 🌿
                          </span>
                          <h4 className="text-sm font-black text-white mt-0.5">
                            {area.name}
                          </h4>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400">
                        {area.tasks.filter((t) => t.isCompleted).length} / {area.tasks.length} 完了
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {area.description}
                    </p>

                    {/* タスク一覧 */}
                    <div className="space-y-2 pt-1">
                      {area.tasks.map((task) => {
                        const canAfford = woodPoints >= task.woodCost;

                        return (
                          <div
                            key={task.id}
                            className={`p-2.5 rounded-2xl border flex items-center justify-between transition-all ${
                              task.isCompleted
                                ? 'bg-emerald-950/30 border-emerald-500/30 opacity-70'
                                : 'bg-slate-800/80 border-slate-700'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{task.icon}</span>
                              <div>
                                <div className="text-xs font-black text-white">
                                  {task.title}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  効果: {task.visualLabel}
                                </div>
                              </div>
                            </div>

                            <div>
                              {task.isCompleted ? (
                                <span className="flex items-center text-[11px] font-black text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-xl">
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                  完了
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleTaskClick(area, task.id, task.woodCost)}
                                  disabled={!canAfford}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1 shadow-sm transition-all ${
                                    canAfford
                                      ? 'bg-amber-500 hover:bg-amber-600 text-amber-950 active:scale-95 cursor-pointer'
                                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                  }`}
                                >
                                  <Hammer className="w-3 h-3" />
                                  <span>開拓 (🪵{task.woodCost})</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. 開拓コンプリート済みエリア */}
                {isCompleted && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-3xl p-1.5 bg-emerald-500/20 rounded-2xl border border-emerald-500/30">
                          {area.icon}
                        </span>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[9px] font-black text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center">
                              <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                              開拓コンプリート！
                            </span>
                          </div>
                          <h4 className="text-sm font-black text-white mt-0.5">
                            {area.name}
                          </h4>
                        </div>
                      </div>

                      {/* 獲得バッジ */}
                      <div className="text-center bg-purple-500/20 border border-purple-500/40 px-2.5 py-1 rounded-2xl">
                        <span className="text-lg">{area.badge.icon}</span>
                        <div className="text-[9px] font-bold text-purple-200">
                          {area.badge.name}
                        </div>
                      </div>
                    </div>

                    {/* 住み着いた生き物 */}
                    <div
                      onClick={() => handleCreatureTap(area.creature)}
                      className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-emerald-950/60 transition-colors"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-3xl animate-bounce-subtle inline-block">
                          {area.creature.icon}
                        </span>
                        <div>
                          <div className="text-xs font-black text-emerald-200 flex items-center">
                            <span>{area.creature.name}</span>
                            <span className="ml-1 text-[9px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded-md">
                              暮らしているよ
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {area.creature.comment}
                          </div>
                        </div>
                      </div>

                      <div className="text-rose-400 p-1">
                        <Heart className="w-4 h-4 fill-current animate-pulse" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* 生き物詳細モーダル */}
      {selectedCreature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs bg-slate-900 border border-emerald-500/50 rounded-3xl p-5 shadow-2xl text-center space-y-3">
            <span className="text-6xl inline-block drop-shadow-md animate-bounce-subtle">
              {selectedCreature.icon}
            </span>
            <h3 className="text-base font-black text-white">
              {selectedCreature.name}
            </h3>
            {creatureReaction && (
              <div className="text-xs font-black text-emerald-300 bg-emerald-500/20 py-1 rounded-xl">
                {creatureReaction}
              </div>
            )}
            <p className="text-xs text-slate-400 bg-slate-800 p-3 rounded-2xl">
              {selectedCreature.description}
            </p>
            <div className="text-xs text-rose-300 font-bold bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
              {selectedCreature.comment}
            </div>
            <button
              onClick={() => setSelectedCreature(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
