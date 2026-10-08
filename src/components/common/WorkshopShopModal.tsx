import React, { useState } from 'react';
import { X, Check, Lock } from 'lucide-react';
import type { FrontierArea, PlayerBoosters } from '../../types';
import type { PreBoosters } from '../puzzle/Match3Board';
import { isAreaFeatureUnlocked } from '../../utils/areaUnlocks';
import { sounds } from '../../utils/soundEffects';

interface WorkshopShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: FrontierArea[];
  woodPoints: number;
  onSpendWood: (amount: number) => void;
  onBoosterUpdated?: () => void;
}

interface ShopItem {
  id: string;
  name: string;
  category: 'in_game' | 'pre_game';
  targetKey: keyof PlayerBoosters | keyof PreBoosters;
  icon: string;
  cost: number;
  description: string;
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'hammer',
    name: '木工の木槌 (ハンマー)',
    category: 'in_game',
    targetKey: 'hammer',
    icon: '🔨',
    cost: 80,
    description: 'パズル中、狙ったピースや障害物を1マス叩き割る！',
  },
  {
    id: 'saw',
    name: '木こりのノコギリ',
    category: 'in_game',
    targetKey: 'saw',
    icon: '🪚',
    cost: 120,
    description: 'パズル中、横1列のドロップやギミックを一気に切り払う！',
  },
  {
    id: 'clock',
    name: 'ぜんまい時計 (+5手)',
    category: 'in_game',
    targetKey: 'clock',
    icon: '⏱️',
    cost: 150,
    description: 'パズル中、ピンチの時に残り手数を+5手回復する！',
  },
  {
    id: 'startRocket',
    name: '初期ロケット',
    category: 'pre_game',
    targetKey: 'startRocket',
    icon: '🚀',
    cost: 100,
    description: 'ステージ開始時に、最初から盤面にロケットを1個配置！',
  },
  {
    id: 'startBomb',
    name: '初期爆弾',
    category: 'pre_game',
    targetKey: 'startBomb',
    icon: '💣',
    cost: 130,
    description: 'ステージ開始時に、最初から盤面に爆弾を1個配置！',
  },
  {
    id: 'extraMoves',
    name: '初期手数 +3手',
    category: 'pre_game',
    targetKey: 'extraMoves',
    icon: '➕',
    cost: 110,
    description: 'ステージ開始時の残り手数を+3手増やして有利に挑む！',
  },
];

export const WorkshopShopModal: React.FC<WorkshopShopModalProps> = ({
  isOpen,
  onClose,
  areas,
  woodPoints,
  onSpendWood,
  onBoosterUpdated,
}) => {
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const isUnlocked = isAreaFeatureUnlocked('beaver_workshop', areas);
  const workshopArea = areas.find((a) => a.id === 'beaver_workshop');
  const completedTasks = workshopArea ? workshopArea.tasks.filter((t) => t.isCompleted).length : 0;
  const totalTasks = workshopArea ? workshopArea.tasks.length : 5;

  // ブースター所持数の読み出し
  const getInGameBoosters = (): PlayerBoosters => {
    try {
      const saved = localStorage.getItem('beaver_puzzle_boosters');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { hammer: 2, saw: 2, tail: 2, clock: 2 };
  };

  const getPreBoosters = (): PreBoosters => {
    try {
      const saved = localStorage.getItem('beaver_puzzle_pre_boosters');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { startRocket: 2, startBomb: 2, extraMoves: 2 };
  };

  const inGameBoosters = getInGameBoosters();
  const preBoosters = getPreBoosters();

  const handleBuy = (item: ShopItem) => {
    if (woodPoints < item.cost) return;

    sounds.playWoodMatch(2);
    onSpendWood(item.cost);

    if (item.category === 'in_game') {
      const updated = { ...inGameBoosters, [item.targetKey]: (inGameBoosters[item.targetKey as keyof PlayerBoosters] || 0) + 1 };
      localStorage.setItem('beaver_puzzle_boosters', JSON.stringify(updated));
    } else {
      const updated = { ...preBoosters, [item.targetKey]: (preBoosters[item.targetKey as keyof PreBoosters] || 0) + 1 };
      localStorage.setItem('beaver_puzzle_pre_boosters', JSON.stringify(updated));
    }

    setSuccessToast(`「${item.name}」をクラフトしたぜ！🔨`);
    setTimeout(() => setSuccessToast(null), 2500);

    if (onBoosterUpdated) {
      onBoosterUpdated();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-gradient-to-b from-amber-950/95 via-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-3xl animate-bounce-subtle">🦔🔨</span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-amber-300 flex items-center space-x-1.5">
                <span>森の木工クラフトショップ</span>
              </h3>
              <p className="text-[10px] text-slate-300">
                店長ハリネズミの工房・道具補給所
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 所持木材表示 */}
        <div className="flex items-center justify-between bg-amber-950/60 border border-amber-500/30 px-3.5 py-2 rounded-2xl">
          <span className="text-xs font-bold text-amber-200">所持木材 (ウッド)</span>
          <span className="text-sm font-black text-amber-300 flex items-center space-x-1">
            <span>🪵</span>
            <span>{woodPoints.toLocaleString()}</span>
          </span>
        </div>

        {/* 購入完了トースト */}
        {successToast && (
          <div className="bg-emerald-500/20 border border-emerald-400 text-emerald-200 px-3 py-1.5 rounded-xl text-xs font-black text-center animate-balloon-pop flex items-center justify-center space-x-1.5">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successToast}</span>
          </div>
        )}

        {/* ロック状態の案内 */}
        {!isUnlocked ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-900/80 rounded-2xl border border-slate-700/80">
            <div className="w-14 h-14 rounded-full bg-amber-950/80 border-2 border-amber-500/40 flex items-center justify-center text-2xl shadow-inner">
              <Lock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">
                木工ビーバー工房が未復興です
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                開拓マップで「木工ビーバー工房」の修復を完了すると、ハリネズミ店長の道具ショップがオープンします！
              </p>
            </div>
            <div className="text-[11px] font-black text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/30">
              工房の復興進捗: {completedTasks} / {totalTasks} ステップ完了
            </div>
          </div>
        ) : (
          /* アイテム一覧 */
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
            {SHOP_ITEMS.map((item) => {
              const currentStock =
                item.category === 'in_game'
                  ? inGameBoosters[item.targetKey as keyof PlayerBoosters] || 0
                  : preBoosters[item.targetKey as keyof PreBoosters] || 0;
              const canAfford = woodPoints >= item.cost;

              return (
                <div
                  key={item.id}
                  className="bg-slate-900/90 border border-amber-500/20 rounded-2xl p-2.5 flex items-center justify-between space-x-2.5 hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-2xl shadow-inner shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-black text-white truncate">
                          {item.name}
                        </span>
                        <span className="text-[9px] font-bold text-amber-300 bg-slate-950/80 px-1.5 py-0.2 rounded-md border border-slate-700 shrink-0">
                          所持: {currentStock}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleBuy(item)}
                    disabled={!canAfford}
                    className={`px-3 py-2 rounded-xl text-xs font-black shrink-0 transition-transform flex items-center space-x-1 ${
                      canAfford
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 active:scale-95 shadow-md shadow-amber-500/20 cursor-pointer'
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
        )}

        {/* 下部案内 */}
        <div className="text-center text-[10px] text-amber-200/70 pt-1">
          {isUnlocked
            ? 'ハリネズミ店長「木材をたくさん集めて、どんどん頼ってくれよな！」'
            : '開拓地を復興して、森に活気を取り戻そう！'}
        </div>
      </div>
    </div>
  );
};
