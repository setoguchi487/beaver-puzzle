import React, { useState, useEffect } from 'react';
import { X, Lock, Check, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { FrontierArea } from '../../types';
import { isAreaFeatureUnlocked } from '../../utils/areaUnlocks';
import { sounds } from '../../utils/soundEffects';

interface SacredTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: FrontierArea[];
}

export interface SacredBlessing {
  id: string;
  name: string;
  icon: string;
  color: string;
  tagline: string;
  description: string;
  effectDetail: string;
}

export const SACRED_BLESSINGS: SacredBlessing[] = [
  {
    id: 'abundance',
    name: '豊穣の大樹の祈り',
    icon: '🪵🌿',
    color: 'from-emerald-500/20 to-teal-500/20 border-emerald-400/40 text-emerald-300',
    tagline: '木材獲得量 +25% 永続UP',
    description: '大樹の豊かな生命力が宿り、すべてのパズルクリア時に得られる木材ポイントが永続で1.25倍に増加します。',
    effectDetail: '木材ボーナス +25%',
  },
  {
    id: 'serenity',
    name: '静寂の木陰の祈り',
    icon: '🍃🕊️',
    color: 'from-sky-500/20 to-blue-500/20 border-sky-400/40 text-sky-300',
    tagline: 'パズル初期手数 +1 永続UP',
    description: '静謐な森の守りが心を研ぎ澄まし、すべてのパズルステージで初期手数が永続で+1回追加されます。',
    effectDetail: '初期手数 +1',
  },
  {
    id: 'resonance',
    name: '共鳴の雫の祈り',
    icon: '⚡💥',
    color: 'from-amber-500/20 to-orange-500/20 border-amber-400/40 text-amber-300',
    tagline: 'スペシャルピース連鎖スコア 2倍',
    description: '神聖なマナがロケットや爆弾と共鳴し、起爆・誘爆時の獲得スコアが2倍に倍増します。',
    effectDetail: '爆発スコア 2倍',
  },
];

const SACRED_BLESSING_KEY = 'beaver_puzzle_active_sacred_blessing';

export const loadActiveSacredBlessing = (): string => {
  return localStorage.getItem(SACRED_BLESSING_KEY) || 'abundance';
};

export const SacredTreeModal: React.FC<SacredTreeModalProps> = ({
  isOpen,
  onClose,
  areas,
}) => {
  const isUnlocked = isAreaFeatureUnlocked('sacred_tree', areas);
  const [activeBlessingId, setActiveBlessingId] = useState<string>('abundance');

  useEffect(() => {
    if (!isOpen) return;
    setActiveBlessingId(loadActiveSacredBlessing());
  }, [isOpen]);

  if (!isOpen) return null;

  // 加護の選択・祈り
  const handleSelectBlessing = (id: string) => {
    sounds.buttonClick();
    sounds.fanfare();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
    setActiveBlessingId(id);
    localStorage.setItem(SACRED_BLESSING_KEY, id);
  };

  const currentBlessing = SACRED_BLESSINGS.find((b) => b.id === activeBlessingId) || SACRED_BLESSINGS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-950 via-amber-950/40 to-slate-950 border-2 border-amber-400/50 rounded-3xl p-5 shadow-2xl text-white space-y-4 max-h-[92vh] overflow-y-auto">
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
            <span>🍁🦊 守り神の神木</span>
            <span>・</span>
            <span>大樹の加護</span>
          </div>
          <h2 className="text-xl font-black bg-gradient-to-r from-amber-200 via-yellow-200 to-orange-200 bg-clip-text text-transparent">
            賢者キツネの神聖加護
          </h2>
          <p className="text-[11px] text-amber-200/80">
            千年を生きる神木に祈りを捧げ、森全体の永続パッシブ能力を授かろう！
          </p>
        </div>

        {/* ロック状態の表示 */}
        {!isUnlocked ? (
          <div className="py-8 px-4 text-center space-y-3 bg-slate-900/90 rounded-2xl border border-amber-500/20">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-amber-200">守り神の神木が未完成です</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                エリア「守り神の神木」を完全復興すると、賢者キツネから強力な永続パッシブ加護を受けられます！
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
            {/* 現在発動中の加護ディスプレイ */}
            <div className="relative rounded-2xl bg-gradient-to-b from-amber-900/40 via-yellow-950/20 to-slate-950 border border-amber-400/40 p-4 text-center space-y-2 overflow-hidden shadow-inner">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.15)_0%,transparent_70%)] pointer-events-none" />

              <div className="text-4xl animate-bounce-subtle drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">
                {currentBlessing.icon}
              </div>

              <div>
                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center justify-center space-x-1">
                  <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
                  <span>現在発動中のご加護</span>
                </div>
                <h3 className="text-base font-black text-amber-100">
                  {currentBlessing.name}
                </h3>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-500/20 text-xs text-amber-200 font-bold leading-relaxed">
                {currentBlessing.description}
              </div>
            </div>

            {/* 加護の選択肢 */}
            <div className="space-y-2">
              <div className="text-xs font-black text-amber-200 flex items-center justify-between">
                <span>捧げる祈りを選ぶ（いつでも変更可能）</span>
              </div>

              <div className="space-y-2">
                {SACRED_BLESSINGS.map((blessing) => {
                  const isActive = activeBlessingId === blessing.id;
                  return (
                    <button
                      key={blessing.id}
                      onClick={() => handleSelectBlessing(blessing.id)}
                      className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                        isActive
                          ? 'bg-amber-500/20 border-amber-400 shadow-md ring-2 ring-amber-400/50'
                          : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <span className="text-3xl">{blessing.icon}</span>
                          <div>
                            <div className="text-xs font-black text-white flex items-center space-x-1.5">
                              <span>{blessing.name}</span>
                              {isActive && (
                                <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded-md">
                                  発動中
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-amber-300 font-bold mt-0.5">
                              {blessing.tagline}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 pt-0.5">
                          {isActive ? (
                            <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-slate-950">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="text-[10px] font-bold text-slate-400 border border-slate-700 px-2 py-1 rounded-lg">
                              祈る
                            </div>
                          )}
                        </div>
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
