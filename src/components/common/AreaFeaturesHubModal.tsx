import React from 'react';
import { X, Lock, ChevronRight } from 'lucide-react';
import type { FrontierArea } from '../../types';
import { AREA_FEATURE_CONFIG, isAreaFeatureUnlocked, canClaimWatermillWood } from '../../utils/areaUnlocks';
import { sounds } from '../../utils/soundEffects';

interface AreaFeaturesHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: FrontierArea[];
  onOpenFeature: (areaId: string) => void;
  onClaimWatermillBonus?: () => void;
  watermillBonusClaimed?: boolean;
}

export const AreaFeaturesHubModal: React.FC<AreaFeaturesHubModalProps> = ({
  isOpen,
  onClose,
  areas,
  onOpenFeature,
  onClaimWatermillBonus,
  watermillBonusClaimed = false,
}) => {
  if (!isOpen) return null;

  const areaList = Object.values(AREA_FEATURE_CONFIG);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-400/50 rounded-3xl p-5 shadow-2xl text-white space-y-4 max-h-[92vh] overflow-y-auto">
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ヘッダー */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center space-x-1.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-0.5 rounded-full text-xs font-black">
            <span>🏰✨ 森の開拓特権</span>
          </div>
          <h2 className="text-xl font-black bg-gradient-to-r from-amber-200 via-yellow-200 to-orange-200 bg-clip-text text-transparent">
            エリア制覇施設一覧
          </h2>
          <p className="text-[11px] text-slate-400">
            各エリアの全タスクを完了すると、特別な施設や機能が解放されます！
          </p>
        </div>

        {/* 施設リスト */}
        <div className="space-y-2.5">
          {areaList.map((feature) => {
            const unlocked = isAreaFeatureUnlocked(feature.areaId, areas);
            const targetArea = areas.find((a) => a.id === feature.areaId);
            const isWatermill = feature.areaId === 'watermill_zone';
            const canClaimWood = isWatermill && !watermillBonusClaimed && canClaimWatermillWood(areas);

            return (
              <div
                key={feature.areaId}
                className={`p-3 rounded-2xl border transition-all text-left ${
                  unlocked
                    ? 'bg-slate-850/80 border-amber-500/40 shadow-sm hover:border-amber-400/70'
                    : 'bg-slate-950/60 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span className="text-3xl shrink-0">{feature.icon.split('')[0]}</span>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-black text-white truncate">
                          {feature.featureName}
                        </span>
                        {unlocked ? (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold px-1.5 py-0.2 rounded-md shrink-0">
                            OPEN!
                          </span>
                        ) : (
                          <span className="text-[9px] bg-slate-800 text-slate-400 font-bold px-1.5 py-0.2 rounded-md shrink-0 flex items-center space-x-0.5">
                            <Lock className="w-2.5 h-2.5 inline" />
                            <span>未解放</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-amber-300/90 font-bold mt-0.5">
                        エリア: {targetArea?.name || feature.areaId}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {unlocked ? feature.unlockedDescription : feature.description}
                      </p>
                    </div>
                  </div>

                  {/* アクションボタン */}
                  <div className="shrink-0 self-center">
                    {unlocked ? (
                      isWatermill ? (
                        canClaimWood ? (
                          <button
                            onClick={() => {
                              sounds.buttonClick();
                              onClaimWatermillBonus?.();
                            }}
                            className="px-2.5 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-[10px] rounded-xl active:scale-95 transition-all shadow-md cursor-pointer animate-pulse"
                          >
                            木材+200受取
                          </button>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded-lg">
                            受取済
                          </span>
                        )
                      ) : (
                        <button
                          onClick={() => {
                            sounds.buttonClick();
                            onClose();
                            onOpenFeature(feature.areaId);
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-[11px] rounded-xl flex items-center space-x-1 active:scale-95 transition-all shadow-md cursor-pointer"
                        >
                          <span>利用する</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )
                    ) : (
                      <span className="text-[9px] text-slate-500 font-bold">
                        復興で解放
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 下部案内 */}
        <div className="pt-1 text-center">
          <p className="text-[10px] text-slate-500">
            パズルをクリアして木材を集め、全エリアの復興を目指そう！ 🏞️🪵
          </p>
        </div>
      </div>
    </div>
  );
};
