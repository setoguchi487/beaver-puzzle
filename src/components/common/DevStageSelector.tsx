import React, { useState, useEffect } from 'react';
import { STAGES } from '../../data/masterData';
import { Wrench, X, Sparkles, RotateCcw, Coins } from 'lucide-react';

interface DevStageSelectorProps {
  currentStageId: number;
  onSelectStage: (stageId: number) => void;
  onAddWood?: (amount: number) => void;
  onSetWood?: (amount: number) => void;
  onUnlockAllAreas: () => void;
  onResetAreas?: () => void;
  onResetAll?: () => void;
}

export const DevStageSelector: React.FC<DevStageSelectorProps> = ({
  currentStageId,
  onSelectStage,
  onAddWood,
  onSetWood,
  onUnlockAllAreas,
  onResetAreas,
  onResetAll,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<number>(() => {
    if (currentStageId <= 25) return 1;
    if (currentStageId <= 50) return 2;
    if (currentStageId <= 75) return 3;
    return 4;
  });

  // ESCキー押下で開発者モードを閉じる
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 木材を100,000個所持状態にする処理
  const setWoodTo100000 = () => {
    if (onSetWood) {
      onSetWood(100000);
    } else if (onAddWood) {
      onAddWood(100000);
    }
    try {
      localStorage.setItem('beaver_puzzle_state_v1_wood', '100000');
    } catch {}
  };

  // 開発者モードボタン押下時
  const handleOpen = () => {
    // 開発者モードを開いた時点で木材を100,000個所持状態にする
    setWoodTo100000();
    setIsOpen(true);
  };

  // チャプターごとのステージ範囲
  const CHAPTERS = [
    { id: 1, name: '第1章: 小川・巣作り', range: [1, 25], icon: '🌱' },
    { id: 2, name: '第2章: 激流・水車小屋', range: [26, 50], icon: '🌊' },
    { id: 3, name: '第3章: 果樹園・秘境渓谷', range: [51, 75], icon: '🍎' },
    { id: 4, name: '第4章: 桃源郷グランドダム', range: [76, 100], icon: '👑' },
  ];

  const currentChapter = CHAPTERS.find((c) => c.id === activeTab) || CHAPTERS[0];
  const stageButtons: number[] = [];
  for (let s = currentChapter.range[0]; s <= currentChapter.range[1]; s++) {
    stageButtons.push(s);
  }

  return (
    <>
      {/* 開発者モード起動ボタン */}
      <button
        onClick={handleOpen}
        className="px-2.5 py-1 text-xs font-black bg-gradient-to-r from-amber-500/25 to-orange-500/25 hover:from-amber-500/35 hover:to-orange-500/35 text-amber-300 border border-amber-400/60 rounded-xl flex items-center space-x-1.5 shadow-sm active:scale-95 transition-all cursor-pointer backdrop-blur-xs"
        title="開発者モードメニューを開く"
      >
        <Wrench className="w-3.5 h-3.5 text-amber-400 animate-pulse-slow" />
        <span>開発者モード</span>
      </button>

      {/* 開発者モードモーダル & 右下バツボタン */}
      {isOpen && (
        <>
          {/* PC・大画面向け: 画面右下に固定配置されるフローティングバツボタン */}
          <button
            onClick={() => setIsOpen(false)}
            className="fixed bottom-6 right-6 z-[60] bg-slate-900/95 hover:bg-rose-600 text-white border-2 border-amber-400 hover:border-rose-300 rounded-2xl px-4 py-3 shadow-2xl flex items-center space-x-2 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 group backdrop-blur-md ring-4 ring-black/40 animate-bounce-subtle"
            title="開発者モードを終了 (✕)"
            aria-label="開発者モードを終了"
          >
            <div className="bg-rose-500 group-hover:bg-rose-400 text-white rounded-full p-1 group-hover:rotate-90 transition-transform">
              <X className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="text-left">
              <span className="text-xs font-black text-amber-200 group-hover:text-white block leading-tight">
                開発者モード終了
              </span>
              <span className="text-[9px] text-slate-300 block leading-tight font-medium">
                ✕ 閉じる
              </span>
            </div>
          </button>

          {/* モーダル背景オーバーレイ（クリックで閉じる） */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none"
            onClick={() => setIsOpen(false)}
          >
            {/* モーダルカード本体 */}
            <div
              className="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-925 to-slate-950 border-2 border-amber-500/60 rounded-3xl p-5 shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ヘッダー */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2 text-amber-400">
                  <Wrench className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-base font-black tracking-wide">
                      開発者モード 🛠️
                    </h3>
                    <span className="text-[10px] text-amber-200/70 font-medium block">
                      ステージ選択 & 開拓デバッグチート
                    </span>
                  </div>
                </div>
                {/* ヘッダー右上のバツボタン */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
                  title="閉じる"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ドロップダウンによる即時ステージジャンプ */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-amber-200 flex items-center justify-between">
                  <span>🎯 ステージダイレクト選択（全100ステージ）</span>
                  <span className="text-[10px] text-slate-400">現在: Stage {currentStageId}</span>
                </label>
                <select
                  value={currentStageId}
                  onChange={(e) => {
                    const sId = Number(e.target.value);
                    onSelectStage(sId);
                    setIsOpen(false);
                  }}
                  className="w-full bg-slate-800/90 border border-amber-500/40 text-amber-100 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-amber-400 cursor-pointer"
                >
                  {STAGES.map((st) => (
                    <option key={st.id} value={st.id} className="bg-slate-900 text-white">
                      {st.title} (最大{st.maxMoves}手)
                    </option>
                  ))}
                </select>
              </div>

              {/* チャプタータブ（1〜100） */}
              <div className="space-y-2">
                <span className="text-[11px] font-black text-slate-300 block">
                  🗺️ ステージ番号グリッド選択（1〜100）
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {CHAPTERS.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => setActiveTab(ch.id)}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-black transition-all flex items-center justify-center space-x-1 cursor-pointer ${
                        activeTab === ch.id
                          ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-1 ring-amber-300'
                          : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/60'
                      }`}
                    >
                      <span>{ch.icon}</span>
                      <span className="truncate">{ch.name}</span>
                    </button>
                  ))}
                </div>

                {/* 選択チャプター内の25ステージボタングリッド */}
                <div className="bg-slate-950/70 p-2 rounded-2xl border border-slate-800/80">
                  <div className="grid grid-cols-5 gap-1.5">
                    {stageButtons.map((sNum) => {
                      const isCurrent = currentStageId === sNum;
                      return (
                        <button
                          key={sNum}
                          onClick={() => {
                            onSelectStage(sNum);
                            setIsOpen(false);
                          }}
                          className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 ring-2 ring-white shadow-lg scale-105'
                              : 'bg-slate-800/90 hover:bg-amber-500/20 hover:border-amber-400/50 hover:text-amber-200 text-slate-200 border border-slate-700/70 active:scale-95'
                          }`}
                        >
                          {sNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* デバッグチート・資材・開拓操作 */}
              <div className="pt-2 border-t border-slate-800 space-y-2.5">
                <span className="text-[11px] font-black text-slate-300 block uppercase">
                  🛠️ 開発者チート機能
                </span>

                {/* 木材100,000所持 */}
                <button
                  onClick={() => {
                    setWoodTo100000();
                    alert('木材を 100,000 個に設定しました！🪵✨');
                  }}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500/25 to-yellow-500/25 hover:from-amber-500/35 hover:to-yellow-500/35 border border-amber-400/60 text-amber-300 text-xs font-black rounded-xl flex items-center justify-center space-x-2 active:scale-98 transition-all cursor-pointer shadow-sm"
                >
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span>木材を 100,000 個所持にする 🪵</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  {/* エリア全開放 */}
                  <button
                    onClick={() => {
                      onUnlockAllAreas();
                      alert('すべてのエリアを全開放しました！✨');
                    }}
                    className="py-2.5 px-2 bg-purple-500/25 hover:bg-purple-500/35 border border-purple-400/60 text-purple-200 text-xs font-black rounded-xl flex items-center justify-center space-x-1.5 active:scale-98 transition-all cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 text-purple-300" />
                    <span>エリア全開放 ✨</span>
                  </button>

                  {/* エリア解放初期化 */}
                  <button
                    onClick={() => {
                      if (window.confirm('エリアの解放状態とタスク進行を初期状態に戻しますか？')) {
                        if (onResetAreas) {
                          onResetAreas();
                        } else if (onResetAll) {
                          onResetAll();
                        }
                        alert('エリアの解放状態を初期化しました！🔄');
                      }
                    }}
                    className="py-2.5 px-2 bg-blue-500/25 hover:bg-blue-500/35 border border-blue-400/60 text-blue-200 text-xs font-black rounded-xl flex items-center justify-center space-x-1.5 active:scale-98 transition-all cursor-pointer shadow-sm"
                  >
                    <RotateCcw className="w-4 h-4 text-blue-300" />
                    <span>エリア解放初期化 🔄</span>
                  </button>
                </div>

                {/* ゲーム完全初期化 */}
                {onResetAll && (
                  <button
                    onClick={() => {
                      if (window.confirm('ゲームデータ（木材・エリア・バッジ・仲間）を完全に最初からリセットしますか？')) {
                        onResetAll();
                        setIsOpen(false);
                      }
                    }}
                    className="w-full py-2 px-3 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-[11px] font-bold rounded-xl flex items-center justify-center space-x-1.5 active:scale-98 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>ゲームデータ完全リセット（最初に戻す）</span>
                  </button>
                )}
              </div>

              {/* モーダルカード内・右下の終了バツボタン */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  ※ ESCキー / 背景クリックでも終了可能
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white border border-rose-400/80 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer shadow-md"
                  title="開発者モードを終了"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                  <span>開発者モードを終了 (✕)</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
