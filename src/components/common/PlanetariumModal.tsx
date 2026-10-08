import React, { useState, useEffect } from 'react';
import { X, Lock, Star, Sparkles, Check, Moon } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { FrontierArea } from '../../types';
import { isAreaFeatureUnlocked } from '../../utils/areaUnlocks';
import { sounds } from '../../utils/soundEffects';

interface PlanetariumModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: FrontierArea[];
  totalStars?: number;
  onAddWood: (amount: number) => void;
}

interface Constellation {
  id: string;
  name: string;
  icon: string;
  requiredStars: number;
  woodReward: number;
  description: string;
  lore: string;
}

const CONSTELLATIONS: Constellation[] = [
  {
    id: 'beaver_constellation',
    name: '森の働き者・ビーバー座',
    icon: '🦫✨',
    requiredStars: 10,
    woodReward: 100,
    description: '丸太を抱えて泳ぐ姿を描いた、森の象徴的な星座',
    lore: '昔々、川の洪水を防いだ勇敢なビーバーが星になったと言われている。',
  },
  {
    id: 'watermill_constellation',
    name: 'せせらぎの恵み・水車座',
    icon: '⚙️🌊',
    requiredStars: 25,
    woodReward: 150,
    description: '巡る水の循環と豊かな実りを表す四大星座の1つ',
    lore: '水車の星が天高く輝く季節は、豊かな恵みがもたらされる。',
  },
  {
    id: 'kingfisher_constellation',
    name: '蒼き飛翔・カワセミ座',
    icon: '🐦💎',
    requiredStars: 45,
    woodReward: 200,
    description: '水面すれすれを美しく滑空するエメラルドの星',
    lore: '澄んだ水と星の光が交わるとき、旅人に幸運の道しるべを示す。',
  },
  {
    id: 'sacred_tree_constellation',
    name: '千年の守り・神木座',
    icon: '🌳🌟',
    requiredStars: 70,
    woodReward: 300,
    description: '根を大地に、枝を宇宙に伸ばす壮大なる大樹の星座',
    lore: '森のすべての命を見守り、災いから護る悠久の光。',
  },
  {
    id: 'mystic_fox_constellation',
    name: '賢者の導き・キツネ座',
    icon: '🦊🌌',
    requiredStars: 100,
    woodReward: 500,
    description: '九尾の輝きを放ち、天の川を渡る神話の星座',
    lore: '森を完全に開拓し調和を築いた者にのみ、その全貌を現す。',
  },
];

const RESTORED_CONSTELLATIONS_KEY = 'beaver_puzzle_restored_constellations';

export const PlanetariumModal: React.FC<PlanetariumModalProps> = ({
  isOpen,
  onClose,
  areas,
  totalStars = 0,
  onAddWood,
}) => {
  const isUnlocked = isAreaFeatureUnlocked('stargazing_deck', areas);
  const [restoredIds, setRestoredIds] = useState<string[]>([]);
  const [selectedConstellation, setSelectedConstellation] = useState<Constellation>(CONSTELLATIONS[0]);

  useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = JSON.parse(localStorage.getItem(RESTORED_CONSTELLATIONS_KEY) || '[]');
      setRestoredIds(saved);
    } catch {
      setRestoredIds([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 星座を復元点灯する
  const handleRestore = (item: Constellation) => {
    if (restoredIds.includes(item.id)) return;
    if (totalStars < item.requiredStars) {
      sounds.warning();
      return;
    }

    sounds.fanfare();
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });

    const newRestored = [...restoredIds, item.id];
    setRestoredIds(newRestored);
    localStorage.setItem(RESTORED_CONSTELLATIONS_KEY, JSON.stringify(newRestored));
    onAddWood(item.woodReward);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-950 via-indigo-950/80 to-slate-950 border-2 border-indigo-400/50 rounded-3xl p-5 shadow-2xl text-white space-y-4 max-h-[92vh] overflow-y-auto">
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ヘッダー */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center space-x-1.5 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-3 py-0.5 rounded-full text-xs font-black">
            <span>🔭✨ 星見台</span>
            <span>・</span>
            <span>プラネタリウム</span>
          </div>
          <h2 className="text-xl font-black bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
            満天の星空ギャラリー
          </h2>
          <p className="text-[11px] text-indigo-200/80">
            パズルで集めたスター（★）を捧げて、森の夜空の星座を復元しよう！
          </p>
        </div>

        {/* ロック状態の表示 */}
        {!isUnlocked ? (
          <div className="py-8 px-4 text-center space-y-3 bg-slate-900/90 rounded-2xl border border-indigo-500/20">
            <div className="w-12 h-12 mx-auto rounded-full bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-indigo-200">満天の星見台が未完成です</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                エリア「満天の星見台」を完全復興すると、フクロウ教授と一緒に天体望遠鏡で星座を復元できます！
              </p>
            </div>
            <div className="pt-2">
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                開拓マップでタスクを進めよう 🏞️
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* 総獲得スター情報バナー */}
            <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-400/30 rounded-2xl">
              <div className="flex items-center space-x-2">
                <Moon className="w-4 h-4 text-indigo-300 animate-pulse" />
                <span className="text-xs font-black text-indigo-200">フクロウ教授の天体観測</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded-lg">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                <span className="text-xs font-black text-amber-300">所持: {totalStars} 個</span>
              </div>
            </div>

            {/* プラネタリウム投影ビュー */}
            <div className="relative rounded-2xl bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 border border-indigo-400/40 p-4 text-center space-y-3 overflow-hidden shadow-2xl">
              {/* 星屑パーティクル背景 */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.2)_0%,transparent_70%)] pointer-events-none" />

              <div className="relative z-10 space-y-2">
                <div className="text-5xl animate-bounce-subtle drop-shadow-[0_0_15px_rgba(255,255,255,0.7)]">
                  {selectedConstellation.icon}
                </div>
                <div>
                  <h3 className="text-base font-black text-white flex items-center justify-center space-x-1.5">
                    <span>{selectedConstellation.name}</span>
                    {restoredIds.includes(selectedConstellation.id) && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 px-1.5 py-0.2 rounded-md">
                        点灯中 ✨
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-indigo-200/90 mt-0.5">
                    {selectedConstellation.description}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-indigo-500/20 text-[10px] text-slate-300 italic text-left">
                  💭 {selectedConstellation.lore}
                </div>

                {/* 復元ボタンまたは点灯済みバッジ */}
                <div>
                  {restoredIds.includes(selectedConstellation.id) ? (
                    <div className="w-full py-2.5 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-300 font-black text-xs flex items-center justify-center space-x-1.5">
                      <Check className="w-4 h-4" />
                      <span>夜空に輝き続けています（木材 +{selectedConstellation.woodReward} 受取済）</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRestore(selectedConstellation)}
                      disabled={totalStars < selectedConstellation.requiredStars}
                      className={`w-full py-3 rounded-2xl font-black text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg active:scale-98 ${
                        totalStars >= selectedConstellation.requiredStars
                          ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 hover:brightness-110 shadow-amber-500/20 animate-pulse'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {totalStars >= selectedConstellation.requiredStars
                          ? `★ を捧げて星座を点灯！ (木材 +${selectedConstellation.woodReward})`
                          : `解放条件: ★ あと ${selectedConstellation.requiredStars - totalStars} 個 必要`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 星座セレクターリスト */}
            <div className="space-y-2">
              <div className="text-xs font-black text-indigo-200 flex items-center justify-between">
                <span>夜空の星座リスト</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  復元済み: {restoredIds.length} / {CONSTELLATIONS.length}
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                {CONSTELLATIONS.map((c) => {
                  const isRestored = restoredIds.includes(c.id);
                  const isSelected = selectedConstellation.id === c.id;
                  const canUnlock = totalStars >= c.requiredStars;

                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        sounds.buttonClick();
                        setSelectedConstellation(c);
                      }}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-400 shadow-md ring-1 ring-indigo-400/40'
                          : isRestored
                          ? 'bg-slate-900/60 border-indigo-500/30 hover:bg-slate-850'
                          : 'bg-slate-950/60 border-slate-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="text-2xl">{c.icon.split('')[0]}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-slate-200 truncate">
                            {c.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            必要: ★ {c.requiredStars} 個
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {isRestored ? (
                          <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>点灯</span>
                          </span>
                        ) : canUnlock ? (
                          <span className="text-[10px] font-black text-amber-300 bg-amber-500/20 border border-amber-400/30 px-2 py-0.5 rounded-md animate-pulse">
                            点灯可能！
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-md">
                            ★ 不足
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
