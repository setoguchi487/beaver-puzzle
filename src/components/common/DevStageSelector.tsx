import React, { useState, useEffect } from 'react';
import { STAGES } from '../../data/masterData';
import { Wrench, X, Sparkles, RotateCcw, Coins, Package } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<string>('all');

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

  // お助けアイテムの所持数を一括設定する処理
  const setBoostersCount = (count: number) => {
    const newBoosters = {
      hammer: count,
      saw: count,
      tail: count,
      clock: count,
    };
    try {
      localStorage.setItem('beaver_puzzle_boosters', JSON.stringify(newBoosters));
      window.dispatchEvent(new CustomEvent('beaver-boosters-updated', { detail: newBoosters }));
    } catch (e) {
      console.error('Failed to set boosters:', e);
    }
  };

  // 隠しコマンド（キーボードショートカット Ctrl+Shift+D / Cmd+Shift+D）およびカスタムイベント
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESCキーで閉じる
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        return;
      }

      // 隠しコマンド: Ctrl+Shift+D または Cmd+Shift+D
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        setWoodTo100000();
        setIsOpen((prev) => !prev);
      }
    };

    const handleCustomOpen = () => {
      setWoodTo100000();
      setIsOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-beaver-dev-mode', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-beaver-dev-mode', handleCustomOpen);
    };
  }, [isOpen]);

  // タブ定義（全100ステージ & チャプター別）
  const TABS = [
    { id: 'all', name: '全ステージ', range: [1, 100], icon: '🌟', badge: '1〜100' },
    { id: 'ch1', name: '第1章', range: [1, 25], icon: '🌱', badge: '1〜25' },
    { id: 'ch2', name: '第2章', range: [26, 50], icon: '🌊', badge: '26〜50' },
    { id: 'ch3', name: '第3章', range: [51, 75], icon: '🍎', badge: '51〜75' },
    { id: 'ch4', name: '第4章', range: [76, 100], icon: '👑', badge: '76〜100' },
  ];

  const currentTabDef = TABS.find((t) => t.id === activeTab) || TABS[0];
  const stageButtons: number[] = [];
  for (let s = currentTabDef.range[0]; s <= currentTabDef.range[1]; s++) {
    stageButtons.push(s);
  }

  // 隠しコマンド化：通常時はボタンを表示しない
  if (!isOpen) {
    return null;
  }

  return (
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

      {/* モーダル背景オーバーレイ */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in select-none"
        onClick={() => setIsOpen(false)}
      >
        {/* モーダル本体カード */}
        <div
          className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl p-5 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl text-slate-100 ring-4 ring-amber-500/20"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/40">
                <Wrench className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-amber-400 flex items-center space-x-1.5">
                  <span>🛠️ 秘密の開発者モード</span>
                  <span className="text-[10px] bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-400/40">
                    全100ステージ対応
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  現在の選択中: Stage {currentStageId} / {STAGES.length}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
              title="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ステージ選択セクション */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center space-x-1">
                <span>🗺️ ステージ番号ボタン選択</span>
                <span className="text-[10px] text-amber-400 font-normal">
                  （{currentTabDef.name}: {currentTabDef.badge}）
                </span>
              </span>
              <span className="text-[10px] text-slate-400">
                表示中: {stageButtons.length}ステージ
              </span>
            </div>

            {/* チャプター・全表示タブ切り替えバー */}
            <div className="grid grid-cols-5 gap-1">
              {TABS.map((tab) => {
                const isTabActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-1.5 px-1 rounded-xl text-[10px] font-black transition-all flex flex-col items-center justify-center cursor-pointer ${
                      isTabActive
                        ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-300'
                        : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    <span className="text-xs leading-none">{tab.icon}</span>
                    <span className="truncate leading-tight mt-0.5">{tab.name}</span>
                    <span className="text-[8px] opacity-80 leading-none scale-90">{tab.badge}</span>
                  </button>
                );
              })}
            </div>

            {/* 選択タブのステージボタングリッド */}
            <div className="bg-slate-950/70 p-2 rounded-2xl border border-slate-800/80 max-h-56 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                {stageButtons.map((sNum) => {
                  const isCurrent = currentStageId === sNum;
                  return (
                    <button
                      key={sNum}
                      onClick={() => {
                        onSelectStage(sNum);
                        setIsOpen(false);
                      }}
                      title={`Stage ${sNum} を開始`}
                      className={`py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center ${
                        isCurrent
                          ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 ring-2 ring-white shadow-lg scale-105 font-black'
                          : 'bg-slate-800/90 hover:bg-amber-500/20 hover:border-amber-400/50 hover:text-amber-200 text-slate-200 border border-slate-700/70 active:scale-95'
                      }`}
                    >
                      <span>{sNum}</span>
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

            {/* お助けアイテム操作 */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setBoostersCount(2);
                  alert('お助けアイテムを初期値（各2個）にリセットしました！🎒✨ (木づち2/のこぎり2/しっぽ2/時計2)');
                }}
                className="py-2.5 px-2 bg-emerald-500/25 hover:bg-emerald-500/35 border border-emerald-400/60 text-emerald-200 text-xs font-black rounded-xl flex items-center justify-center space-x-1.5 active:scale-98 transition-all cursor-pointer shadow-sm"
              >
                <Package className="w-4 h-4 text-emerald-300" />
                <span>アイテム各2個リセット 🎒</span>
              </button>

              <button
                onClick={() => {
                  setBoostersCount(99);
                  alert('お助けアイテムを全種 99個 に補充しました！🚀✨ (各99個)');
                }}
                className="py-2.5 px-2 bg-indigo-500/25 hover:bg-indigo-500/35 border border-indigo-400/60 text-indigo-200 text-xs font-black rounded-xl flex items-center justify-center space-x-1.5 active:scale-98 transition-all cursor-pointer shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-indigo-300" />
                <span>アイテム各99個補充 🚀</span>
              </button>
            </div>

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

            {/* PWA / 画像キャッシュ強制クリア */}
            <button
              onClick={async () => {
                if (window.confirm("端末の画像キャッシュ・PWAキャッシュを全て削除して、最新の画像とプログラムを再ダウンロードしますか？")) {
                  try {
                    if ("caches" in window) {
                      const keys = await caches.keys();
                      await Promise.all(keys.map((k) => caches.delete(k)));
                    }
                    if ("serviceWorker" in navigator) {
                      const regs = await navigator.serviceWorker.getRegistrations();
                      await Promise.all(regs.map((r) => r.unregister()));
                    }
                    window.location.reload();
                  } catch {
                    window.location.reload();
                  }
                }
              }}
              className="w-full py-2 px-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 text-xs font-black rounded-xl flex items-center justify-center space-x-1.5 active:scale-98 transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-300" />
              <span>キャッシュ全消去＆最新アセットを再取得 ⚡</span>
            </button>

            {/* ゲーム完全初期化 */}
            {onResetAll && (
              <button
                onClick={() => {
                  if (window.confirm('ゲームデータ（木材・エリア・バッジ・仲間・アイテム）を完全に最初からリセットしますか？')) {
                    setBoostersCount(2);
                    onResetAll();
                    alert('ゲームデータを完全に最初（アイテム各2個・木材60・ステージ1）へリセットしました！🔄');
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
  );
};
