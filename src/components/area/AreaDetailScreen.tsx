import React, { useState } from 'react';
import type { FrontierArea, Creature } from '../../types';
import { DevStageSelector } from '../common/DevStageSelector';
import { sounds } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  CheckCircle2,
  Hammer,
  Play,
  Heart,
  Volume2,
  VolumeX,
  Sparkles,
  Lock,
} from 'lucide-react';

interface AreaDetailScreenProps {
  area: FrontierArea;
  woodPoints: number;
  onCompleteTask: (areaId: string, taskId: string, cost: number) => void;
  onCompleteArea: (area: FrontierArea) => void;
  onBackToMap: () => void;
  onStartPuzzle: () => void;
  currentStageId: number;
  onSelectStage: (stageId: number) => void;
  onAddWood: (amount: number) => void;
  onUnlockAllAreas: () => void;
  onResetAll?: () => void;
}

export const AreaDetailScreen: React.FC<AreaDetailScreenProps> = ({
  area,
  woodPoints,
  onCompleteTask,
  onCompleteArea,
  onBackToMap,
  onStartPuzzle,
  currentStageId,
  onSelectStage,
  onAddWood,
  onUnlockAllAreas,
  onResetAll,
}) => {
  const [selectedCreature, setSelectedCreature] = useState<Creature | null>(null);
  const [creatureReaction, setCreatureReaction] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());
  const [activeSpotIndex, setActiveSpotIndex] = useState<number | null>(null);

  const completedCount = area.tasks.filter((t) => t.isCompleted).length;
  const isAllCompleted = completedCount === area.tasks.length;

  // 段階画像 (第1エリアは生成した shallows_stage_0〜5、他エリアはフォールバック)
  const currentImage = area.detailImages && area.detailImages[completedCount]
    ? area.detailImages[completedCount]
    : isAllCompleted
    ? '/assets/watermill.jpg'
    : '/assets/river_map.jpg';

  // 5箇所のスポット座標 (X%, Y%)
  const SPOT_COORDINATES = [
    { x: 30, y: 72 }, // スポット1: 手前の浮遊ゴミ・水際
    { x: 68, y: 68 }, // スポット2: 右側の泥水・ヘドロ
    { x: 22, y: 48 }, // スポット3: 左側の倒木・川岸
    { x: 50, y: 44 }, // スポット4: 中央の歩道橋・ダム
    { x: 78, y: 38 }, // スポット5: 右奥の水草・花畑
  ];

  const triggerConfetti = () => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.5 },
    });
  };

  // 順番に処理するため、現在対象となるタスク（最初の未完了タスク）のインデックス
  const currentTaskIndex = area.tasks.findIndex((t) => !t.isCompleted);

  const handleTaskClick = (taskId: string, cost: number, idx: number) => {
    // 順番通りにしか処理できない（現在のタスク以外は拒否）
    if (idx !== currentTaskIndex) return;
    if (woodPoints < cost) return;

    sounds.playBuild();
    onCompleteTask(area.id, taskId, cost);

    // 新たに完了した後の数を計算
    const nextCompleted = completedCount + 1;
    if (nextCompleted === area.tasks.length) {
      sounds.playStageClear();
      triggerConfetti();
      onCompleteArea(area);
    }
  };

  const handleCreatureTap = (c: Creature) => {
    setSelectedCreature(c);
    const reactions = ['ピィッ！♪', 'クエックエッ✨', 'るんるん❤️', 'カリカリ…🌰', 'パタパタ〜🌿'];
    setCreatureReaction(reactions[Math.floor(Math.random() * reactions.length)]);
    setTimeout(() => setCreatureReaction(null), 2000);
  };

  const handleToggleMute = () => {
    const nextMuted = sounds.toggleMute();
    setIsMuted(nextMuted);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden pb-24 select-none">
      {/* 1. ヘッダーナビゲーション */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
        <button
          onClick={onBackToMap}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 active:scale-95 transition-all text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>全体マップ</span>
        </button>

        <div className="text-center">
          <h2 className="text-xs font-black text-white flex items-center justify-center space-x-1">
            <span>{area.icon}</span>
            <span>{isAllCompleted ? area.name : (area.ruinedName || area.name)}</span>
          </h2>
          <span className="text-[10px] text-amber-400 font-bold">
            復旧進捗: {completedCount} / {area.tasks.length} 箇所きれい！
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleToggleMute}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/80 border border-slate-700 active:scale-95"
            title="サウンドON/OFF"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          <DevStageSelector
            currentStageId={currentStageId}
            onSelectStage={onSelectStage}
            onAddWood={onAddWood}
            onUnlockAllAreas={onUnlockAllAreas}
            onResetAll={onResetAll}
          />
        </div>
      </header>

      {/* 2. 所持木材 & 復旧プログレスバー */}
      <div className="bg-slate-900/70 border-b border-slate-800/80 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-1.5 bg-amber-950/50 border border-amber-500/40 px-3 py-1 rounded-xl shadow-xs">
          <span className="text-base leading-none">🪵</span>
          <span className="text-amber-300 font-mono text-xs font-black">
            所持: {woodPoints} ウッド
          </span>
        </div>

        {/* 5段階の進捗インジケーター */}
        <div className="flex items-center space-x-1">
          {area.tasks.map((t) => (
            <div
              key={t.id}
              className={`w-5 h-2 rounded-full transition-all duration-500 ${
                t.isCompleted
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-xs'
                  : 'bg-slate-800 border border-slate-700'
              }`}
            />
          ))}
          <span className="ml-1 text-[10px] font-mono text-emerald-400 font-bold">
            {Math.round((completedCount / area.tasks.length) * 100)}%
          </span>
        </div>
      </div>

      {/* 3. エリア詳細ビジュアルマップ（タスク完了で段階的に図が更新！） */}
      <div className="relative w-full aspect-[4/3] bg-slate-900 overflow-hidden shadow-inner border-b border-slate-800">
        {/* 段階画像（クロスフェード切り替え） */}
        <img
          key={currentImage}
          src={currentImage}
          alt={area.name}
          className="w-full h-full object-cover transition-opacity duration-700 animate-fade-in"
        />

        {/* 荒廃時のオーバーレイ演出（未完了時のみ） */}
        {!isAllCompleted && (
          <div
            style={{ opacity: Math.max(0, 1 - completedCount * 0.22) }}
            className="absolute inset-0 bg-amber-950/20 backdrop-sepia-25 pointer-events-none transition-opacity duration-700"
          />
        )}

        {/* 水面のきらめき (復旧が進むと輝く) */}
        {completedCount >= 2 && (
          <div className="absolute top-[45%] left-[45%] w-16 h-16 bg-cyan-200/30 rounded-full blur-md animate-water-shimmer pointer-events-none" />
        )}

        {/* 5箇所のインタラクティブ・スポットピン（順番にアンロック） */}
        {area.tasks.map((task, idx) => {
          const coords = SPOT_COORDINATES[idx] || { x: 50, y: 50 };
          const isCurrent = idx === currentTaskIndex;
          const isLocked = currentTaskIndex !== -1 && idx > currentTaskIndex;
          const canAfford = woodPoints >= task.woodCost;
          const isSelected = activeSpotIndex === idx;

          return (
            <div
              key={task.id}
              style={{ top: `${coords.y}%`, left: `${coords.x}%` }}
              onClick={() => {
                if (!isLocked) {
                  setActiveSpotIndex(isSelected ? null : idx);
                }
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center group ${
                isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
            >
              {/* ピン本体 */}
              <div
                className={`relative w-9 h-9 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                  task.isCompleted
                    ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 border-2 border-white scale-95 shadow-emerald-500/20'
                    : isCurrent
                    ? canAfford
                      ? 'bg-gradient-to-tr from-amber-400 to-amber-500 border-2 border-white ring-4 ring-amber-400/60 scale-110 animate-bounce-subtle'
                      : 'bg-gradient-to-tr from-amber-600 to-amber-700 border-2 border-amber-300 ring-2 ring-amber-500/40 scale-105'
                    : 'bg-slate-800/80 border-2 border-slate-600 opacity-60'
                }`}
              >
                <span className="text-sm">
                  {task.isCompleted ? '✨' : isLocked ? '🔒' : task.icon}
                </span>

                {/* 現在の修復対象で木材が足りる場合の通知ポッチ */}
                {isCurrent && canAfford && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border border-white animate-ping" />
                )}
              </div>

              {/* スポット番号ラベル */}
              <span
                className={`mt-1 px-1.5 py-0.2 rounded-full text-[8px] font-black border shadow-md whitespace-nowrap ${
                  task.isCompleted
                    ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                    : isCurrent
                    ? 'bg-amber-950/90 text-amber-200 border-amber-400/60 ring-1 ring-amber-400/40 font-black'
                    : 'bg-slate-900/90 text-slate-500 border-slate-700'
                }`}
              >
                {task.isCompleted ? 'きれい！' : isCurrent ? 'ここを修復！🔨' : `🔒 場所 ${idx + 1}`}
              </span>
            </div>
          );
        })}

        {/* 完全復活時のカルガモ・生き物アニメーション */}
        {isAllCompleted && (
          <div
            onClick={() => handleCreatureTap(area.creature)}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-25 cursor-pointer animate-duck-swim"
            title={area.creature.name}
          >
            <span className="text-3xl filter drop-shadow-lg inline-block">
              {area.creature.icon}
            </span>
          </div>
        )}
      </div>

      {/* 4. きれいにする5つのタスク一覧（順番に1つずつ処理） */}
      <div className="flex-1 p-4 space-y-2.5 overflow-y-auto no-scrollbar">
        <div className="flex items-center justify-between text-xs font-black text-slate-300">
          <span className="flex items-center space-x-1">
            <Hammer className="w-3.5 h-3.5 text-amber-400" />
            <span>きれいに修復するステップ（順番に進めよう）</span>
          </span>
          <span className="text-[10px] text-slate-400">
            {completedCount === 5 ? 'すべてきれいになりました！🎉' : `Step ${completedCount + 1} / 5`}
          </span>
        </div>

        <div className="space-y-2">
          {area.tasks.map((task, idx) => {
            const isCurrent = idx === currentTaskIndex;
            const isLocked = currentTaskIndex !== -1 && idx > currentTaskIndex;
            const canAfford = woodPoints >= task.woodCost;
            const isHighlighted = activeSpotIndex === idx;

            return (
              <div
                key={task.id}
                className={`p-3 rounded-2xl border transition-all ${
                  task.isCompleted
                    ? 'bg-emerald-950/30 border-emerald-500/30 opacity-75'
                    : isCurrent
                    ? `bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/50 shadow-lg ${isHighlighted ? 'scale-[1.02]' : ''}`
                    : `bg-slate-900/50 border-slate-800/80 opacity-50 ${isHighlighted ? 'border-slate-600' : ''}`
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                        task.isCompleted
                          ? 'bg-emerald-500/20 border border-emerald-500/30'
                          : isCurrent
                          ? 'bg-amber-500/20 border border-amber-500/40 shadow-xs'
                          : 'bg-slate-800/40 border border-slate-800 text-slate-600'
                      }`}
                    >
                      {task.isCompleted ? '✅' : isLocked ? '🔒' : task.icon}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`text-[9px] font-mono font-bold ${
                            isCurrent ? 'text-amber-400' : 'text-slate-500'
                          }`}
                        >
                          Step {idx + 1}
                        </span>
                        {isCurrent && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-md font-bold animate-pulse">
                            修復中
                          </span>
                        )}
                        <span
                          className={`text-xs font-black ${
                            task.isCompleted
                              ? 'text-white'
                              : isCurrent
                              ? 'text-amber-100'
                              : 'text-slate-400'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
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
                    ) : isCurrent ? (
                      <button
                        onClick={() => handleTaskClick(task.id, task.woodCost, idx)}
                        disabled={!canAfford}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1 shadow-md transition-all ${
                          canAfford
                            ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 active:scale-95 cursor-pointer shadow-amber-500/30'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        }`}
                      >
                        <Hammer className="w-3 h-3" />
                        <span>きれいに (🪵{task.woodCost})</span>
                      </button>
                    ) : (
                      <div className="flex items-center text-slate-500 text-[11px] px-2.5 py-1 bg-slate-800/40 rounded-xl border border-slate-800">
                        <Lock className="w-3 h-3 mr-1" />
                        <span>ロック</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 生き物プレビュー */}
        <div
          onClick={() => handleCreatureTap(area.creature)}
          className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-emerald-950/60 transition-colors mt-2"
        >
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl animate-bounce-subtle inline-block">
              {area.creature.icon}
            </span>
            <div>
              <div className="text-xs font-black text-emerald-200 flex items-center space-x-1">
                <span>{area.creature.name}</span>
                <span className="text-[9px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded-md">
                  {isAllCompleted ? '暮らしているよ' : '5箇所きれいになると戻ってくる！'}
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

      {/* 5. 画面下部固定アクションバー（木材が足りない時はパズルへ！） */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-3 flex items-center justify-between shadow-2xl">
        {isAllCompleted ? (
          <button
            onClick={onBackToMap}
            className="w-full py-3 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-slate-950 font-black text-sm rounded-2xl shadow-lg flex items-center justify-center space-x-2 active:scale-98 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>開拓完了！全体マップへ戻る 🏞️</span>
          </button>
        ) : (
          <button
            onClick={onStartPuzzle}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-black text-sm rounded-2xl shadow-lg flex items-center justify-center space-x-2 active:scale-98 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>パズルで木材を集めてきれいにする！ 🪵</span>
          </button>
        )}
      </footer>

      {/* 生き物詳細モーダル */}
      {selectedCreature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs bg-slate-900 border border-emerald-500/50 rounded-3xl p-5 shadow-2xl text-center space-y-3">
            <span className="text-6xl inline-block drop-shadow-md animate-bounce-subtle">
              {selectedCreature.icon}
            </span>
            <h3 className="text-base font-black text-white">{selectedCreature.name}</h3>
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
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs rounded-xl"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
