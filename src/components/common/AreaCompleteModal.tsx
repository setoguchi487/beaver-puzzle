import React, { useEffect } from 'react';
import type { FrontierArea } from '../../types';
import { sounds } from '../../utils/soundEffects';
import { getAssetUrl } from '../../utils/assetPath';
import { Trophy, Check, Sparkles } from 'lucide-react';

interface AreaCompleteModalProps {
  area: FrontierArea | null;
  onClose: () => void;
}

export const AreaCompleteModal: React.FC<AreaCompleteModalProps> = ({
  area,
  onClose,
}) => {
  useEffect(() => {
    if (area) {
      sounds.playStageClear();
    }
  }, [area]);

  if (!area) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none">
      <div className="w-full max-w-sm bg-gradient-to-b from-emerald-950/90 via-slate-900 to-slate-950 border-2 border-emerald-400 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-pop-in">
        <div className="inline-flex p-3 bg-emerald-500/20 text-emerald-300 rounded-3xl animate-bounce-subtle border border-emerald-400/40">
          <Trophy className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest bg-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center justify-center w-fit mx-auto space-x-1">
            <Sparkles className="w-3 h-3" />
            <span>AREA COMPLETED!</span>
          </span>
          <h3 className="text-xl font-black text-white mt-1.5">
            {area.name} 開拓完了！🎉
          </h3>
        </div>

        {/* エリア完全復興アートをリッチに表示 */}
        {(() => {
          const completeImg = area.id === 'watermill_zone'
            ? '/assets/watermill.jpg'
            : area.detailImages && area.detailImages.length > 0
            ? area.detailImages[area.detailImages.length - 1]
            : null;

          return completeImg ? (
            <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-emerald-400/40 shadow-md">
              <img
                src={getAssetUrl(completeImg)}
                alt={`${area.name}完成`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2 justify-center">
                <span className="text-xs font-black text-emerald-300">
                  ✨ {area.name}が完全に蘇った！
                </span>
              </div>
            </div>
          ) : null;
        })()}

        {/* 獲得バッジ */}
        <div className="p-3 bg-gradient-to-r from-amber-950/50 via-purple-950/40 to-amber-950/50 border border-amber-500/50 rounded-2xl flex items-center space-x-3 shadow-lg">
          <div className="relative shrink-0">
            {area.badge.image ? (
              <img
                src={getAssetUrl(area.badge.image)}
                alt={area.badge.name}
                className="w-16 h-16 object-contain drop-shadow-xl animate-bounce-subtle"
              />
            ) : (
              <span className="text-4xl">{area.badge.icon}</span>
            )}
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="text-[10px] text-amber-300 font-black uppercase tracking-wider flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>開拓勲章メダル授与</span>
            </div>
            <div className="text-sm font-black text-white truncate">{area.badge.name}</div>
            <div className="text-[10px] text-slate-300 leading-snug mt-0.5">{area.badge.description}</div>
          </div>
        </div>

        {/* 🎁 エリア復興お助けアイテムボーナス */}
        <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-2xl flex items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🎁</span>
            <div className="text-left">
              <div className="text-[10px] text-amber-300 font-bold uppercase">復興記念ボーナス</div>
              <div className="text-xs font-black text-white">お助けアイテム全種 +1個</div>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-amber-500/30">
            <img src={getAssetUrl("/assets/booster_hammer.png")} alt="木づち" className="w-5 h-5 object-contain drop-shadow" />
            <img src={getAssetUrl("/assets/booster_saw.png")} alt="ノコギリ" className="w-5 h-5 object-contain drop-shadow" />
            <img src={getAssetUrl("/assets/booster_tail.png")} alt="しっぽ" className="w-5 h-5 object-contain drop-shadow" />
            <img src={getAssetUrl("/assets/booster_clock.png")} alt="時計" className="w-5 h-5 object-contain drop-shadow" />
          </div>
        </div>

        {/* 住み着いた生き物 */}
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-center space-x-3">
          {area.creature.image ? (
            <img
              src={getAssetUrl(area.creature.image)}
              alt={area.creature.name}
              className="w-14 h-14 object-contain animate-bounce-subtle drop-shadow-md rounded-xl bg-slate-900/50 p-1 border border-emerald-500/30 shrink-0"
            />
          ) : (
            <span className="text-4xl animate-bounce-subtle shrink-0">{area.creature.icon}</span>
          )}
          <div className="text-left flex-1 min-w-0">
            <div className="text-[10px] text-emerald-300 font-bold uppercase">仲間になった生き物</div>
            <div className="text-sm font-black text-white">{area.creature.name}</div>
            <div className="text-[10px] text-slate-300 mt-0.5">{area.creature.comment}</div>
          </div>
        </div>

        <p className="text-xs text-slate-300 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
          ✨ バッジの力で、さらに奥地にある新たな開拓エリアへ進めるようになりました！
        </p>

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/30 active:scale-98 transition-transform flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>開拓マップへ戻る</span>
        </button>
      </div>
    </div>
  );
};
