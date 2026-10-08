import React, { useState, useEffect } from 'react';
import { DECORATIONS, type DecorationItem } from '../../data/decorations';
import { X, Hammer, Plus, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DecorationModalProps {
  woodPoints: number;
  ownedDecorationIds: string[];
  activePlacements: string[]; // スロットに配置中のデコレーションID配列（最大3個）
  onCraftDecoration: (item: DecorationItem) => void;
  onTogglePlacement: (itemId: string) => void;
  onClose: () => void;
}

export const DecorationModal: React.FC<DecorationModalProps> = ({
  woodPoints,
  ownedDecorationIds,
  activePlacements,
  onCraftDecoration,
  onTogglePlacement,
  onClose,
}) => {
  const [selectedItem, setSelectedItem] = useState<DecorationItem>(DECORATIONS[0]);

  // ESCキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCraft = (item: DecorationItem) => {
    if (woodPoints < item.woodCost) return;
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#fbbf24', '#f59e0b', '#34d399', '#ffffff'],
    });
    onCraftDecoration(item);
  };

  const isOwned = (id: string) => ownedDecorationIds.includes(id);
  const isPlaced = (id: string) => activePlacements.includes(id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-925 to-slate-950 border-2 border-emerald-500/50 rounded-3xl p-4 sm:p-5 shadow-2xl text-white space-y-4 max-h-[92vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-slate-950 shadow-md">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-wide text-white flex items-center space-x-2">
                <span>木工デコレーション工房</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  自由クラフト
                </span>
              </h2>
              <span className="text-[10px] text-slate-400 block">
                木材を使って家具やオブジェをクラフト＆配置！
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-xl text-xs font-black text-amber-300">
              <span>🪵</span>
              <span>{woodPoints}</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
              title="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 現在の配置スロットプレビュー（最大3枠） */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
            <span>🏞️ 現在の広場配置オブジェ (最大3個)</span>
            <span className="text-amber-400 font-mono text-[10px]">
              {activePlacements.length} / 3 設置中
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((slotIdx) => {
              const placedId = activePlacements[slotIdx];
              const placedItem = DECORATIONS.find((d) => d.id === placedId);

              if (placedItem) {
                return (
                  <div
                    key={slotIdx}
                    className="p-2 bg-gradient-to-b from-emerald-950/40 to-slate-900 border border-emerald-500/40 rounded-xl flex items-center justify-between shadow-xs"
                  >
                    <div className="flex items-center space-x-1.5 min-w-0">
                      {placedItem.image ? (
                        <img src={placedItem.image} alt={placedItem.name} className="w-6 h-6 rounded-md object-cover border border-emerald-400/40 shrink-0" />
                      ) : (
                        <span className="text-xl shrink-0">{placedItem.icon}</span>
                      )}
                      <span className="text-[10px] font-black text-emerald-200 truncate">
                        {placedItem.name}
                      </span>
                    </div>
                    <button
                      onClick={() => onTogglePlacement(placedItem.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                      title="配置を外す"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={slotIdx}
                  className="p-2 border border-dashed border-slate-700/80 rounded-xl flex items-center justify-center space-x-1 text-slate-500 text-[10px]"
                >
                  <Plus className="w-3.5 h-3.5 opacity-60" />
                  <span>空きスロット</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 選択中デコレーションの写真プレビュー */}
        {selectedItem && (
          <div className="p-3 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/30 rounded-2xl flex items-center space-x-3 shadow-md animate-fade-in">
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-amber-400/50 shadow-sm shrink-0 bg-slate-950">
              {selectedItem.image ? (
                <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">{selectedItem.icon}</div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-black text-amber-200 truncate">{selectedItem.name}</span>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded-md font-bold shrink-0">
                  {selectedItem.category === 'furniture' ? '家具' : selectedItem.category === 'light' ? '照明' : selectedItem.category === 'nature' ? '自然' : '記念碑'}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">
                {selectedItem.description}
              </p>
            </div>
          </div>
        )}

        {/* デコレーションカタログ一覧 */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-0.5 min-h-[220px]">
          {DECORATIONS.map((item) => {
            const owned = isOwned(item.id);
            const placed = isPlaced(item.id);
            const canAfford = woodPoints >= item.woodCost;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                  selectedItem.id === item.id
                    ? 'bg-slate-800/90 border-emerald-400 ring-1 ring-emerald-400/50 shadow-md'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-slate-800/90 border border-slate-700 overflow-hidden flex items-center justify-center text-2xl shadow-xs shrink-0 relative">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      item.icon
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-black text-white truncate">{item.name}</span>
                      {placed && (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded-full font-bold">
                          配置中
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {item.description}
                    </p>
                    <div className="text-[10px] text-amber-300 font-bold mt-0.5">
                      {owned ? '所持済み ✅' : `必要木材: 🪵 ${item.woodCost}`}
                    </div>
                  </div>
                </div>

                {/* アクションボタン */}
                <div className="shrink-0 ml-2">
                  {owned ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePlacement(item.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                        placed
                          ? 'bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 border border-slate-700'
                          : activePlacements.length >= 3
                          ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md'
                      }`}
                      disabled={!placed && activePlacements.length >= 3}
                    >
                      {placed ? '外す' : '広場に配置'}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCraft(item);
                      }}
                      disabled={!canAfford}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1 transition-all ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-md cursor-pointer active:scale-95'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800'
                      }`}
                    >
                      <Hammer className="w-3 h-3" />
                      <span>クラフト</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* フッター */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-[10px] text-slate-400">
            クラフトした家具は広場にいつでも自由に飾り付けできます
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
