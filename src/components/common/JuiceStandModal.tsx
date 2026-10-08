import React, { useState } from 'react';
import { X, Lock, Check } from 'lucide-react';
import type { FrontierArea } from '../../types';
import { isAreaFeatureUnlocked } from '../../utils/areaUnlocks';
import { sounds } from '../../utils/soundEffects';

interface JuiceStandModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: FrontierArea[];
  woodPoints: number;
  onSpendWood: (amount: number) => void;
}

export interface JuiceBuff {
  id: string;
  name: string;
  icon: string;
  cost: number;
  remainingStages: number;
  description: string;
}

const JUICE_BUFFS: { id: string; name: string; icon: string; cost: number; stages: number; description: string }[] = [
  {
    id: 'berry_cider',
    name: '木苺のエナジーサイダー',
    icon: '🍓🍹',
    cost: 100,
    stages: 3,
    description: '甘酸っぱい元気の源！次の3ステージの間、獲得木材が 1.5倍 にアップ！',
  },
  {
    id: 'blueberry_syrup',
    name: 'ブルーベリー集中シロップ',
    icon: '🫐🥤',
    cost: 120,
    stages: 3,
    description: '頭が冴え渡る！次の3ステージの間、パズルの初期手数が +2手 増加！',
  },
  {
    id: 'ripe_smoothie',
    name: '完熟ミックススムージー',
    icon: '🍯🧉',
    cost: 160,
    stages: 3,
    description: '特濃のご馳走！次の3ステージの間、ロケット生成時にボーナス爆発が付く！',
  },
];

const STORAGE_BUFF_KEY = 'beaver_puzzle_active_juice_buff';

export const loadActiveJuiceBuff = (): JuiceBuff | null => {
  try {
    const saved = localStorage.getItem(STORAGE_BUFF_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return null;
};

export const consumeJuiceBuffStage = () => {
  const current = loadActiveJuiceBuff();
  if (!current) return;
  if (current.remainingStages <= 1) {
    localStorage.removeItem(STORAGE_BUFF_KEY);
  } else {
    current.remainingStages--;
    localStorage.setItem(STORAGE_BUFF_KEY, JSON.stringify(current));
  }
};

export const JuiceStandModal: React.FC<JuiceStandModalProps> = ({
  isOpen,
  onClose,
  areas,
  woodPoints,
  onSpendWood,
}) => {
  const [activeBuff, setActiveBuff] = useState<JuiceBuff | null>(loadActiveJuiceBuff);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isUnlocked = isAreaFeatureUnlocked('berry_orchard', areas);
  const orchardArea = areas.find((a) => a.id === 'berry_orchard');
  const completedTasks = orchardArea ? orchardArea.tasks.filter((t) => t.isCompleted).length : 0;
  const totalTasks = orchardArea ? orchardArea.tasks.length : 5;

  const handleDrink = (buffCfg: typeof JUICE_BUFFS[0]) => {
    if (woodPoints < buffCfg.cost) return;

    sounds.playWoodMatch(2);
    onSpendWood(buffCfg.cost);

    const newBuff: JuiceBuff = {
      id: buffCfg.id,
      name: buffCfg.name,
      icon: buffCfg.icon,
      cost: buffCfg.cost,
      remainingStages: buffCfg.stages,
      description: buffCfg.description,
    };

    setActiveBuff(newBuff);
    localStorage.setItem(STORAGE_BUFF_KEY, JSON.stringify(newBuff));
    setToastMessage(`「${buffCfg.name}」を飲んで元気百倍！🍹`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-gradient-to-b from-rose-950/95 via-slate-900 to-slate-950 border-2 border-rose-500/50 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-rose-500/20 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-3xl animate-bounce-subtle">🍹🦡</span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-rose-300">
                果樹園の特製ジューススタンド
              </h3>
              <p className="text-[10px] text-slate-300">
                アナグマ店長の生搾りベリージュース工房
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

        {/* 所持木材表示 */}
        <div className="flex items-center justify-between bg-rose-950/50 border border-rose-500/30 px-3.5 py-2 rounded-2xl">
          <span className="text-xs font-bold text-rose-200">所持木材 (ウッド)</span>
          <span className="text-sm font-black text-amber-300 flex items-center space-x-1">
            <span>🪵</span>
            <span>{woodPoints.toLocaleString()}</span>
          </span>
        </div>

        {/* ロック状態 */}
        {!isUnlocked ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-900/80 rounded-2xl border border-slate-700/80 my-4">
            <div className="w-14 h-14 rounded-full bg-rose-950/80 border-2 border-rose-500/40 flex items-center justify-center text-2xl shadow-inner">
              <Lock className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">
                ベリーの果樹園が未復興です
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                開拓マップで「ベリーの果樹園」を完成させると、甘酸っぱい特製ジューススタンドがオープンします！
              </p>
            </div>
            <div className="text-[11px] font-black text-rose-400 bg-rose-950/60 px-3 py-1 rounded-full border border-rose-500/30">
              果樹園の復興進捗: {completedTasks} / {totalTasks} ステップ完了
            </div>
          </div>
        ) : (
          /* ジュース一覧 */
          <div className="flex-1 flex flex-col space-y-2.5 overflow-y-auto no-scrollbar">
            {/* 発動中のバフ表示 */}
            {activeBuff && (
              <div className="bg-rose-500/20 border border-rose-400 p-2.5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{activeBuff.icon}</span>
                  <div>
                    <div className="text-xs font-black text-rose-200">{activeBuff.name}</div>
                    <div className="text-[10px] text-slate-300">効果残り: あと {activeBuff.remainingStages} ステージ</div>
                  </div>
                </div>
                <span className="text-[10px] font-black bg-rose-500 text-slate-950 px-2 py-0.5 rounded-full animate-pulse">
                  発動中!
                </span>
              </div>
            )}

            {toastMessage && (
              <div className="bg-emerald-500/20 border border-emerald-400 text-emerald-200 px-3 py-1.5 rounded-xl text-xs font-black text-center animate-balloon-pop flex items-center justify-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{toastMessage}</span>
              </div>
            )}

            <div className="space-y-2">
              {JUICE_BUFFS.map((item) => {
                const canAfford = woodPoints >= item.cost;
                const isCurrentBuff = activeBuff?.id === item.id;

                return (
                  <div
                    key={item.id}
                    className={`bg-slate-900/90 border rounded-2xl p-2.5 flex items-center justify-between space-x-2 transition-all ${
                      isCurrentBuff ? 'border-rose-400 bg-rose-950/40 ring-1 ring-rose-400' : 'border-rose-500/20'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                      <span className="text-2xl shrink-0">{item.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-black text-white truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{item.description}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDrink(item)}
                      disabled={!canAfford}
                      className={`px-3 py-2 rounded-xl text-xs font-black shrink-0 transition-transform flex items-center space-x-1 ${
                        canAfford
                          ? 'bg-gradient-to-r from-rose-400 to-amber-500 text-slate-950 active:scale-95 shadow-md shadow-rose-500/20 cursor-pointer'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <span>🪵</span>
                      <span>{item.cost}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center text-[10px] text-rose-200/70 pt-1">
          {isUnlocked ? 'アナグマ「搾りたての果汁を飲んで、難関ステージも突破だ！」' : '果樹園を復興して、美味しい実りを手に入れよう！'}
        </div>
      </div>
    </div>
  );
};
