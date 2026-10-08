import React, { useState } from 'react';
import { X, Lock, Sparkles, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { FrontierArea, PlayerBoosters } from '../../types';
import type { PreBoosters } from '../puzzle/Match3Board';
import { isAreaFeatureUnlocked } from '../../utils/areaUnlocks';
import { sounds } from '../../utils/soundEffects';

interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: FrontierArea[];
  onAddWood: (amount: number) => void;
  onBoosterUpdated?: () => void;
}

interface WheelReward {
  id: string;
  name: string;
  icon: string;
  type: 'wood' | 'in_game' | 'pre_game';
  key?: keyof PlayerBoosters | keyof PreBoosters;
  amount: number;
  color: string;
}

const WHEEL_REWARDS: WheelReward[] = [
  { id: 'wood_100', name: '木材 100', icon: '🪵', type: 'wood', amount: 100, color: 'from-amber-600 to-amber-700' },
  { id: 'hammer', name: '木槌 x1', icon: '🔨', type: 'in_game', key: 'hammer', amount: 1, color: 'from-orange-500 to-amber-600' },
  { id: 'wood_200', name: '木材 200', icon: '🪵', type: 'wood', amount: 200, color: 'from-amber-500 to-yellow-600' },
  { id: 'rocket', name: '初期ロケット x1', icon: '🚀', type: 'pre_game', key: 'startRocket', amount: 1, color: 'from-cyan-600 to-blue-600' },
  { id: 'clock', name: '時計 x1', icon: '⏱️', type: 'in_game', key: 'clock', amount: 1, color: 'from-indigo-600 to-purple-600' },
  { id: 'wood_300', name: '大当り 木材 300', icon: '🪵✨', type: 'wood', amount: 300, color: 'from-yellow-500 to-amber-500' },
  { id: 'bomb', name: '初期爆弾 x1', icon: '💣', type: 'pre_game', key: 'startBomb', amount: 1, color: 'from-rose-600 to-red-600' },
  { id: 'saw', name: 'ノコギリ x1', icon: '🪚', type: 'in_game', key: 'saw', amount: 1, color: 'from-emerald-600 to-teal-600' },
];

const LAST_SPIN_KEY = 'beaver_puzzle_wheel_last_spin';

export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({
  isOpen,
  onClose,
  areas,
  onAddWood,
  onBoosterUpdated,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonReward, setWonReward] = useState<WheelReward | null>(null);

  if (!isOpen) return null;

  const isUnlocked = isAreaFeatureUnlocked('small_dam', areas);
  const damArea = areas.find((a) => a.id === 'small_dam');
  const completedTasks = damArea ? damArea.tasks.filter((t) => t.isCompleted).length : 0;
  const totalTasks = damArea ? damArea.tasks.length : 5;

  const todayStr = new Date().toISOString().split('T')[0];
  const lastSpin = localStorage.getItem(LAST_SPIN_KEY);
  const canSpinFree = lastSpin !== todayStr;

  const handleSpin = () => {
    if (isSpinning || !canSpinFree) return;

    setIsSpinning(true);
    setWonReward(null);
    sounds.playSwipe();

    // ランダムな当選インデックス (0〜7)
    const prizeIndex = Math.floor(Math.random() * WHEEL_REWARDS.length);
    const segmentAngle = 360 / WHEEL_REWARDS.length; // 45度
    
    // 最低5回転 (1800度) + ターゲット角度 (矢印が上=0度の位置)
    const extraSpins = 5 * 360;
    const targetAngle = extraSpins + (360 - (prizeIndex * segmentAngle + segmentAngle / 2));
    const finalRotation = rotation + targetAngle;

    setRotation(finalRotation);

    // 4.5秒の回転後に当選判定
    setTimeout(() => {
      setIsSpinning(false);
      const prize = WHEEL_REWARDS[prizeIndex];
      setWonReward(prize);
      sounds.playStageClear();

      // 紙吹雪
      try {
        confetti({
          particleCount: 70,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#fbbf24', '#f59e0b', '#38bdf8', '#34d399', '#ffffff'],
        });
      } catch {}

      // 報酬付与
      if (prize.type === 'wood') {
        onAddWood(prize.amount);
      } else if (prize.type === 'in_game' && prize.key) {
        try {
          const saved = localStorage.getItem('beaver_puzzle_boosters');
          const current = saved ? JSON.parse(saved) : { hammer: 2, saw: 2, tail: 2, clock: 2 };
          current[prize.key] = (current[prize.key] || 0) + prize.amount;
          localStorage.setItem('beaver_puzzle_boosters', JSON.stringify(current));
        } catch {}
      } else if (prize.type === 'pre_game' && prize.key) {
        try {
          const saved = localStorage.getItem('beaver_puzzle_pre_boosters');
          const current = saved ? JSON.parse(saved) : { startRocket: 2, startBomb: 2, extraMoves: 2 };
          current[prize.key] = (current[prize.key] || 0) + prize.amount;
          localStorage.setItem('beaver_puzzle_pre_boosters', JSON.stringify(current));
        } catch {}
      }

      localStorage.setItem(LAST_SPIN_KEY, todayStr);

      if (onBoosterUpdated) {
        onBoosterUpdated();
      }
    }, 4500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-gradient-to-b from-blue-950/95 via-slate-900 to-slate-950 border-2 border-cyan-400/50 rounded-3xl p-5 shadow-2xl text-center space-y-4 max-h-[92vh] flex flex-col items-center">
        {/* ヘッダー */}
        <div className="w-full flex items-center justify-between border-b border-cyan-500/20 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-3xl animate-bounce-subtle">🎡🌊</span>
            <div className="text-left">
              <h3 className="text-base sm:text-lg font-black text-cyan-300">
                水流仕掛けのラッキールーレット
              </h3>
              <p className="text-[10px] text-slate-300">
                小枝ダムの水流で回る毎日のガラポン！
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
            <div className="w-14 h-14 rounded-full bg-blue-950/80 border-2 border-cyan-400/40 flex items-center justify-center text-2xl shadow-inner">
              <Lock className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">
                小枝ダムの浅瀬が未復興です
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                開拓マップで「小枝ダムの浅瀬」を完成させると、水流仕掛けの毎日ルーレットがオープンします！
              </p>
            </div>
            <div className="text-[11px] font-black text-cyan-400 bg-blue-950/60 px-3 py-1 rounded-full border border-cyan-400/30">
              ダムの復興進捗: {completedTasks} / {totalTasks} ステップ完了
            </div>
          </div>
        ) : (
          /* ルーレット本体 */
          <div className="flex flex-col items-center space-y-4 my-2">
            {/* 上部ポインター矢印 */}
            <div className="relative flex flex-col items-center z-20">
              <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[18px] border-t-amber-400 filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]" />
            </div>

            {/* 回転ホイールコンテナ */}
            <div className="relative w-56 h-56 rounded-full border-4 border-amber-400 shadow-[0_0_30px_rgba(56,189,248,0.4)] overflow-hidden bg-slate-950">
              <div
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? 'transform 4.5s cubic-bezier(0.12, 0.8, 0.15, 1)' : 'none',
                }}
                className="w-full h-full relative"
              >
                {WHEEL_REWARDS.map((rew, idx) => {
                  const angle = idx * 45;
                  return (
                    <div
                      key={rew.id}
                      style={{
                        transform: `rotate(${angle}deg)`,
                        transformOrigin: '50% 100%',
                      }}
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-28 flex flex-col items-center pt-2 select-none"
                    >
                      <span className="text-xl filter drop-shadow-md">{rew.icon}</span>
                      <span className="text-[9px] font-black text-white mt-0.5 whitespace-nowrap drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                        {rew.name.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 中央軸ピン */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 border-2 border-white shadow-lg flex items-center justify-center z-10">
                <Sparkles className="w-4 h-4 text-slate-950 fill-current animate-spin-slow" />
              </div>
            </div>

            {/* 当選結果表示 */}
            {wonReward && (
              <div className="bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-amber-500/20 border border-amber-400 text-amber-200 px-4 py-2 rounded-2xl text-xs font-black animate-balloon-pop flex items-center space-x-2">
                <Check className="w-4 h-4 text-amber-400" />
                <span>見事当選！「{wonReward.name}」を獲得したよ！🎉</span>
              </div>
            )}

            {/* スピンボタン */}
            <button
              onClick={handleSpin}
              disabled={isSpinning || !canSpinFree}
              className={`w-full py-3.5 px-6 rounded-2xl font-black text-sm transition-all shadow-xl flex items-center justify-center space-x-2 ${
                isSpinning
                  ? 'bg-slate-800 text-slate-500 cursor-wait'
                  : canSpinFree
                  ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:brightness-110 text-white active:scale-95 shadow-cyan-500/30 cursor-pointer animate-pulse'
                  : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              }`}
            >
              <span>{isSpinning ? '回転中…！🌊' : canSpinFree ? '無料で水車を回す！ 🎡' : '本日はもう回しました（また明日！）'}</span>
            </button>
          </div>
        )}

        <div className="text-[10px] text-cyan-200/70 pt-1">
          {isUnlocked ? '毎朝ログインして、無料の木材や道具を当てよう！' : '小枝ダムを直して、森の仕掛けを動かそう！'}
        </div>
      </div>
    </div>
  );
};
