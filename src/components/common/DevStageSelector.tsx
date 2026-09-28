import React, { useState } from 'react';
import { STAGES } from '../../data/masterData';
import { Wrench, X, Play, Plus, Sparkles, RotateCcw } from 'lucide-react';

interface DevStageSelectorProps {
  currentStageId: number;
  onSelectStage: (stageId: number) => void;
  onAddWood: (amount: number) => void;
  onUnlockAllAreas: () => void;
  onResetAll?: () => void;
}

export const DevStageSelector: React.FC<DevStageSelectorProps> = ({
  currentStageId,
  onSelectStage,
  onAddWood,
  onUnlockAllAreas,
  onResetAll,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // 主な節目ステージ
  const MILESTONE_STAGES = [
    { id: 1, label: 'Stage 1 (基本せせらぎ)', icon: '🌱' },
    { id: 10, label: 'Stage 10 (🧊 氷ブロック解禁)', icon: '🧊' },
    { id: 20, label: 'Stage 20 (🪨 川底の大岩解禁)', icon: '🪨' },
    { id: 30, label: 'Stage 30 (🌿 絡みつくツタ解禁)', icon: '🌿' },
    { id: 40, label: 'Stage 40 (🧊🪨 氷と岩の峡谷)', icon: '🧊🪨' },
    { id: 50, label: 'Stage 50 (三大ギミック大決戦)', icon: '⚔️' },
    { id: 100, label: 'Stage 100 (👑 伝説グランドダム)', icon: '👑' },
  ];

  return (
    <>
      {/* 開発者用トリガーボタン (画面右上に控えめに設置) */}
      <button
        onClick={() => setIsOpen(true)}
        className="text-[10px] font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-2 py-1 rounded-lg flex items-center space-x-1 shadow-2xs active:scale-95 transition-all"
        title="開発者デバッグメニュー"
      >
        <Wrench className="w-3 h-3" />
        <span>Dev: St.{currentStageId}</span>
      </button>

      {/* デバッグモーダル */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in select-none">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-5 shadow-2xl text-white space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-1.5 text-amber-400">
                <Wrench className="w-4 h-4" />
                <h3 className="text-sm font-black tracking-wide">
                  開発者用ステージセレクター 🛠️
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 節目ステージ選択 */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase">
                節目ステージ（新ギミック試験用）
              </span>
              <div className="space-y-1.5">
                {MILESTONE_STAGES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectStage(s.id);
                      setIsOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left text-xs font-black flex items-center justify-between transition-all ${
                      currentStageId === s.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400'
                        : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{s.icon}</span>
                      <span>{s.label}</span>
                    </div>
                    <Play className="w-3.5 h-3.5 text-amber-400 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            {/* 任意ステージ番号ジャンプ */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 block mb-1.5">
                任意のステージ（1〜100）へジャンプ
              </span>
              <div className="grid grid-cols-5 gap-1 max-h-32 overflow-y-auto no-scrollbar p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                {STAGES.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      onSelectStage(st.id);
                      setIsOpen(false);
                    }}
                    className={`py-1 text-[11px] font-black rounded-lg transition-colors ${
                      currentStageId === st.id
                        ? 'bg-amber-500 text-amber-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {st.id}
                  </button>
                ))}
              </div>
            </div>

            {/* 開拓用デバッグチート */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                テスト用資材・開拓チート
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAddWood(500)}
                  className="py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-black rounded-xl flex items-center justify-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>木材 +500</span>
                </button>
                <button
                  onClick={onUnlockAllAreas}
                  className="py-2 px-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 text-xs font-black rounded-xl flex items-center justify-center space-x-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>全霧を即座に晴らす</span>
                </button>
              </div>

              {/* 初期リセットボタン */}
              {onResetAll && (
                <button
                  onClick={() => {
                    if (window.confirm("ゲームデータを完全に初期状態（最初から）に戻しますか？\n※未踏エリアが楕円の霧で覆われ、最初の浅瀬のみ出現した状態になります。")) {
                      onResetAll();
                      setIsOpen(false);
                    }
                  }}
                  className="w-full py-2.5 px-3 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 text-xs font-black rounded-xl flex items-center justify-center space-x-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>初期状態にリセット（最初に戻す）🔄</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
