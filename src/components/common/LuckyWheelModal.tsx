import React, { useState, useEffect } from 'react';
import { X, Lock, Check, Sparkles } from 'lucide-react';
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

export interface WheelReward {
  id: string;
  name: string;
  icon: string;
  type: 'wood' | 'in_game' | 'pre_game';
  key?: keyof PlayerBoosters | keyof PreBoosters;
  amount: number;
  color: string;
}

const WHEEL_REWARDS: WheelReward[] = [
  { id: 'w_100', name: '木材 +100', icon: '🪵', type: 'wood', amount: 100, color: '#0ea5e9' },
  { id: 'b_hammer', name: '木槌 x1', icon: '🔨', type: 'in_game', key: 'hammer', amount: 1, color: '#f59e0b' },
  { id: 'w_150', name: '木材 +150', icon: '🪵', type: 'wood', amount: 150, color: '#10b981' },
  { id: 'b_rocket', name: 'ロケット x1', icon: '🚀', type: 'pre_game', key: 'startRocket', amount: 1, color: '#ec4899' },
  { id: 'w_80', name: '木材 +80', icon: '🪵', type: 'wood', amount: 80, color: '#3b82f6' },
  { id: 'b_clock', name: 'ぜんまい時計 x1', icon: '⏰', type: 'in_game', key: 'clock', amount: 1, color: '#8b5cf6' },
  { id: 'w_250', name: '大当り 木材+250', icon: '🌟', type: 'wood', amount: 250, color: '#eab308' },
  { id: 'b_bomb', name: '爆弾 x1', icon: '💣', type: 'pre_game', key: 'startBomb', amount: 1, color: '#06b6d4' },
];

const LAST_SPIN_KEY = 'beaver_puzzle_wheel_last_spin';

export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({
  isOpen,
  onClose,
  areas,
  onAddWood,
  onBoosterUpdated,
}) => {
  const isUnlocked = isAreaFeatureUnlocked('small_dam', areas);
  const targetArea = areas.find((a) => a.id === 'small_dam');
  const completedTasks = targetArea?.tasks.filter((t) => t.isCompleted).length || 0;
  const totalTasks = targetArea?.tasks.length || 5;

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonReward, setWonReward] = useState<WheelReward | null>(null);
  const [canSpinFree, setCanSpinFree] = useState(true);

  // 1日1回無料判定
  useEffect(() => {
    if (!isOpen) return;
    const lastSpin = localStorage.getItem(LAST_SPIN_KEY);
    const today = new Date().toISOString().split('T')[0];
    setCanSpinFree(lastSpin !== today);
    setWonReward(null);
  }, [isOpen]);

  if (!isOpen) return null;

  // ルーレットを回す
  const handleSpin = () => {
    if (isSpinning || !canSpinFree) return;

    sounds.buttonClick();
    setIsSpinning(true);
    setWonReward(null);

    const todayStr = new Date().toISOString().split('T')[0];
    // 当選インデックス（0〜7）をランダム決定
    const prizeIndex = Math.floor(Math.random() * WHEEL_REWARDS.length);
    const segmentAngle = 360 / WHEEL_REWARDS.length; // 45度
    const extraSpins = 360 * 5; // 5回転

    // 矢印（頂点 0度 / 12時方向）に該当セクターの中央が止まるように計算
    // セクター i は [i * 45, (i + 1) * 45]、中央は i * 45 + 22.5
    // 盤面が時計回りに回転すると、インデックス i を12時方向に合わせるには
    // 360 - (i * 45 + 22.5) だけ回転させる
    const targetAngle = extraSpins + (360 - (prizeIndex * segmentAngle + segmentAngle / 2));
    const finalRotation = rotation + targetAngle;

    setRotation(finalRotation);

    // 4.5秒の回転後に当選判定
    setTimeout(() => {
      setIsSpinning(false);
      const prize = WHEEL_REWARDS[prizeIndex];
      setWonReward(prize);
      sounds.fanfare();

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
      setCanSpinFree(false);

      if (onBoosterUpdated) {
        onBoosterUpdated();
      }
    }, 4500);
  };

  // SVG扇形パス生成（中心 150, 150、半径 140）
  const getSectorPath = (index: number) => {
    const cx = 150;
    const cy = 150;
    const r = 140;
    const startAngle = (index * 45 - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * 45 - 90) * (Math.PI / 180);

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-blue-950/95 via-slate-900 to-slate-950 border-2 border-cyan-400/50 rounded-3xl p-5 shadow-2xl text-center space-y-4 max-h-[92vh] flex flex-col items-center">
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ヘッダー */}
        <div className="w-full text-center space-y-1 pr-6 pl-2">
          <div className="inline-flex items-center space-x-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 px-3 py-0.5 rounded-full text-xs font-black">
            <span>🎡🌊 小枝ダムの浅瀬</span>
          </div>
          <h3 className="text-lg font-black bg-gradient-to-r from-cyan-200 via-blue-200 to-teal-200 bg-clip-text text-transparent">
            水流仕掛けのラッキールーレット
          </h3>
          <p className="text-[11px] text-slate-300">
            小枝ダムの水流で回る毎日のガラポン！
          </p>
        </div>

        {/* ロック状態 */}
        {!isUnlocked ? (
          <div className="w-full flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-900/80 rounded-2xl border border-slate-700/80 my-2">
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
          <div className="flex flex-col items-center space-y-3 my-1 w-full">
            {/* ポインター針 ＆ 円盤コンテナ */}
            <div className="relative flex flex-col items-center">
              {/* 上部ポインター（12時方向の針：幾何学的に中心位置に固定） */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                <div className="w-0 h-0 border-l-[11px] border-l-transparent border-r-[11px] border-r-transparent border-t-[18px] border-t-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-300 -mt-1 shadow-md border border-amber-600" />
              </div>

              {/* 回転するSVG円盤 */}
              <div className="relative w-64 h-64 sm:w-68 sm:h-68">
                <svg
                  viewBox="0 0 300 300"
                  className="w-full h-full drop-shadow-[0_0_25px_rgba(56,189,248,0.35)]"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? 'transform 4.5s cubic-bezier(0.12, 0.8, 0.15, 1)' : 'none',
                    transformOrigin: '150px 150px',
                  }}
                >
                  <defs>
                    <radialGradient id="centerPinGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fef08a" />
                      <stop offset="60%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#b45309" />
                    </radialGradient>
                    <radialGradient id="wheelShine" cx="50%" cy="50%" r="50%">
                      <stop offset="70%" stopColor="transparent" />
                      <stop offset="100%" stopColor="rgba(0,0,0,0.35)" />
                    </radialGradient>
                  </defs>

                  {/* 外枠ゴールドリング */}
                  <circle cx="150" cy="150" r="147" fill="#0f172a" stroke="#d97706" strokeWidth="6" />

                  {/* 8個の扇形セクター */}
                  {WHEEL_REWARDS.map((rew, idx) => {
                    const midAngle = idx * 45 + 22.5; // セクターの中心角度
                    const rad = (midAngle - 90) * (Math.PI / 180);
                    // アイコンと文字の配置半径
                    const iconR = 95;
                    const textR = 60;
                    const ix = 150 + iconR * Math.cos(rad);
                    const iy = 150 + iconR * Math.sin(rad);
                    const tx = 150 + textR * Math.cos(rad);
                    const ty = 150 + textR * Math.sin(rad);

                    return (
                      <g key={rew.id}>
                        {/* 扇形 */}
                        <path
                          d={getSectorPath(idx)}
                          fill={rew.color}
                          stroke="#ffffff"
                          strokeWidth="2"
                          strokeOpacity="0.4"
                        />
                        {/* アイコン */}
                        <text
                          x={ix}
                          y={iy}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="22"
                          className="select-none pointer-events-none"
                        >
                          {rew.icon}
                        </text>
                        {/* テキストラベル */}
                        <text
                          x={tx}
                          y={ty}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#ffffff"
                          fontSize="9.5"
                          fontWeight="900"
                          letterSpacing="-0.2px"
                          className="select-none pointer-events-none"
                          style={{
                            filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.9))',
                          }}
                        >
                          {rew.name.replace('木材 ', '').replace('大当り ', '')}
                        </text>
                      </g>
                    );
                  })}

                  {/* 陰影オーバーレイ */}
                  <circle cx="150" cy="150" r="140" fill="url(#wheelShine)" pointerEvents="none" />

                  {/* 外周ピンの装飾鋲（各セクター境界） */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => {
                    const rRad = (ang - 90) * (Math.PI / 180);
                    const px = 150 + 144 * Math.cos(rRad);
                    const py = 150 + 144 * Math.sin(rRad);
                    return <circle key={ang} cx={px} cy={py} r="3" fill="#fef08a" stroke="#78350f" strokeWidth="1" />;
                  })}

                  {/* 中央ハブピン（完全に cx=150, cy=150 に一致） */}
                  <circle cx="150" cy="150" r="28" fill="url(#centerPinGrad)" stroke="#ffffff" strokeWidth="3" />
                  <circle cx="150" cy="150" r="16" fill="#78350f" opacity="0.25" />
                </svg>

                {/* 中央キラキラアイコン */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-100 fill-current animate-spin-slow drop-shadow" />
                </div>
              </div>
            </div>

            {/* 当選結果表示 */}
            {wonReward && (
              <div className="bg-gradient-to-r from-amber-500/20 via-cyan-500/20 to-amber-500/20 border border-amber-400 text-amber-200 px-3.5 py-1.5 rounded-2xl text-xs font-black animate-complete-pop flex items-center space-x-2">
                <Check className="w-4 h-4 text-amber-400 shrink-0" />
                <span>見事当選！「{wonReward.name}」を獲得！🎉</span>
              </div>
            )}

            {/* スピンボタン */}
            <button
              onClick={handleSpin}
              disabled={isSpinning || !canSpinFree}
              className={`w-full py-3 px-5 rounded-2xl font-black text-sm transition-all shadow-xl flex items-center justify-center space-x-2 ${
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

        <div className="text-[10px] text-cyan-200/70 pt-0.5">
          {isUnlocked ? '毎朝ログインして、無料の木材や道具を当てよう！' : '小枝ダムを直して、森の仕掛けを動かそう！'}
        </div>
      </div>
    </div>
  );
};
