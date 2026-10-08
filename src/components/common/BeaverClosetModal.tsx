import React, { useState } from 'react';
import { X, Lock, Check } from 'lucide-react';
import type { FrontierArea } from '../../types';
import { isAreaFeatureUnlocked } from '../../utils/areaUnlocks';
import { sounds } from '../../utils/soundEffects';

interface BeaverClosetModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: FrontierArea[];
}

export interface OutfitItem {
  id: string;
  name: string;
  icon: string;
  slot: 'hat' | 'clothes';
  description: string;
}

export const OUTFIT_ITEMS: OutfitItem[] = [
  { id: 'none_hat', name: '帽子なし', icon: '🍃', slot: 'hat', description: '自然体のままのふわふわ毛並み' },
  { id: 'straw_hat', name: '麦わら帽子', icon: '👒', slot: 'hat', description: '日差しをさえぎる開拓者の定番帽子' },
  { id: 'sunglasses', name: 'サングラス', icon: '🕶️', slot: 'hat', description: 'イケイケでクールな森の開拓リーダー' },
  { id: 'crown', name: '森の王冠', icon: '👑', slot: 'hat', description: '森の桃源郷を築きし者にふさわしい王冠' },

  { id: 'none_clothes', name: '服なし', icon: '🦫', slot: 'clothes', description: 'ありのままの身軽なスタイル' },
  { id: 'lumberjack', name: 'チェック柄木こりシャツ', icon: '👕', slot: 'clothes', description: '赤と黒のチェックが温かい木こりの服' },
  { id: 'apron', name: 'クラフトエプロン', icon: '🦺', slot: 'clothes', description: '木くずをしっかり防ぐ丈夫な作業エプロン' },
  { id: 'explorer', name: '探検家ベスト', icon: '🧥', slot: 'clothes', description: 'ポケットがいっぱい付いた冒険ベスト' },
];

const STORAGE_OUTFIT_KEY = 'beaver_puzzle_outfit';

export const loadBeaverOutfit = (): { hat: string; clothes: string } => {
  try {
    const saved = localStorage.getItem(STORAGE_OUTFIT_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { hat: 'none_hat', clothes: 'none_clothes' };
};

export const BeaverClosetModal: React.FC<BeaverClosetModalProps> = ({
  isOpen,
  onClose,
  areas,
}) => {
  const [currentOutfit, setCurrentOutfit] = useState(loadBeaverOutfit);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isUnlocked = isAreaFeatureUnlocked('beaver_lodge', areas);
  const lodgeArea = areas.find((a) => a.id === 'beaver_lodge');
  const completedTasks = lodgeArea ? lodgeArea.tasks.filter((t) => t.isCompleted).length : 0;
  const totalTasks = lodgeArea ? lodgeArea.tasks.length : 5;

  const handleSelect = (item: OutfitItem) => {
    sounds.playSwipe();
    const updated = {
      ...currentOutfit,
      [item.slot]: item.id,
    };
    setCurrentOutfit(updated);
    localStorage.setItem(STORAGE_OUTFIT_KEY, JSON.stringify(updated));
    setToastMessage(`「${item.name}」にお着替えしたよ！✨`);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const selectedHat = OUTFIT_ITEMS.find((o) => o.id === currentOutfit.hat) || OUTFIT_ITEMS[0];
  const selectedClothes = OUTFIT_ITEMS.find((o) => o.id === currentOutfit.clothes) || OUTFIT_ITEMS[4];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-gradient-to-b from-amber-950/95 via-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
          <div className="flex items-center space-x-2">
            <span className="text-3xl animate-bounce-subtle">🏡🐿️</span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-amber-300">
                ビーバーの着せ替えクローゼット
              </h3>
              <p className="text-[10px] text-slate-300">
                ロッジのマイホームでお気に入りにお着替え！
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
            <div className="w-14 h-14 rounded-full bg-amber-950/80 border-2 border-amber-500/40 flex items-center justify-center text-2xl shadow-inner">
              <Lock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">
                木漏れ日のロッジが未復興です
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                開拓マップで「木漏れ日のロッジ」を完成させると、ぬくもりクローゼットが解放されます！
              </p>
            </div>
            <div className="text-[11px] font-black text-amber-400 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/30">
              ロッジの復興進捗: {completedTasks} / {totalTasks} ステップ完了
            </div>
          </div>
        ) : (
          /* クローゼット本体 */
          <div className="flex-1 flex flex-col space-y-3 overflow-y-auto no-scrollbar">
            {/* プレビュー表示 */}
            <div className="bg-amber-950/50 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-center space-x-3 relative shadow-inner">
              <div className="relative flex flex-col items-center">
                {selectedHat.id !== 'none_hat' && (
                  <span className="text-2xl filter drop-shadow-md -mb-2 z-10 animate-bounce-subtle">
                    {selectedHat.icon}
                  </span>
                )}
                <span className="text-5xl filter drop-shadow-lg">🦫</span>
                {selectedClothes.id !== 'none_clothes' && (
                  <span className="text-2xl filter drop-shadow-md -mt-3 z-10">
                    {selectedClothes.icon}
                  </span>
                )}
              </div>
              <div className="text-left text-xs font-bold text-amber-200">
                <div>帽子: <span className="text-white font-black">{selectedHat.name}</span></div>
                <div className="mt-1">衣装: <span className="text-white font-black">{selectedClothes.name}</span></div>
              </div>
            </div>

            {toastMessage && (
              <div className="bg-emerald-500/20 border border-emerald-400 text-emerald-200 px-3 py-1.5 rounded-xl text-xs font-black text-center animate-balloon-pop flex items-center justify-center space-x-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{toastMessage}</span>
              </div>
            )}

            {/* 帽子リスト */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 px-1">👒 帽子・アクセサリー</span>
              <div className="grid grid-cols-2 gap-2">
                {OUTFIT_ITEMS.filter((i) => i.slot === 'hat').map((item) => {
                  const isEquipped = currentOutfit.hat === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`p-2.5 rounded-2xl border text-left flex items-center space-x-2 transition-all ${
                        isEquipped
                          ? 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-400 shadow-md'
                          : 'bg-slate-900/80 border-slate-700/80 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-2xl shrink-0">{item.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-black text-white truncate">{item.name}</div>
                        <div className="text-[9px] text-slate-400 truncate">{item.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 衣装リスト */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 px-1">👕 衣装・ウェア</span>
              <div className="grid grid-cols-2 gap-2">
                {OUTFIT_ITEMS.filter((i) => i.slot === 'clothes').map((item) => {
                  const isEquipped = currentOutfit.clothes === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`p-2.5 rounded-2xl border text-left flex items-center space-x-2 transition-all ${
                        isEquipped
                          ? 'bg-amber-500/25 border-amber-400 ring-2 ring-amber-400 shadow-md'
                          : 'bg-slate-900/80 border-slate-700/80 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-2xl shrink-0">{item.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-black text-white truncate">{item.name}</div>
                        <div className="text-[9px] text-slate-400 truncate">{item.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="text-center text-[10px] text-amber-200/70 pt-1">
          {isUnlocked ? 'シマリス「ふたりでおしゃれして開拓を続けようね！」' : 'ロッジを直して、自分だけのマイルームを作ろう！'}
        </div>
      </div>
    </div>
  );
};
