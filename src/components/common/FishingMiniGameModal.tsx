import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Sparkles, Trophy, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { FrontierArea } from '../../types';
import { isAreaFeatureUnlocked } from '../../utils/areaUnlocks';
import { sounds } from '../../utils/soundEffects';

interface FishingMiniGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  areas: FrontierArea[];
  onAddWood: (amount: number) => void;
}

interface FishCatch {
  id: string;
  name: string;
  icon: string;
  rarity: 'common' | 'rare' | 'legendary';
  woodReward: number;
  description: string;
}

const FISH_TYPES: FishCatch[] = [
  { id: 'ayu', name: '清流の若鮎（アユ）', icon: '🐟', rarity: 'common', woodReward: 80, description: 'スイカの香りがする清流の代表魚' },
  { id: 'yamame', name: '渓流の女王ヤマメ', icon: '🐠', rarity: 'common', woodReward: 100, description: '美しいパーマーク模様を持つ銀色の魚' },
  { id: 'iwana', name: '深山の幻イワナ', icon: '🎣', rarity: 'rare', woodReward: 150, description: '冷たい最上流の岩陰に潜む警戒心の強い美魚' },
  { id: 'rainbow_trout', name: '虹色ニジマス', icon: '🌈🐟', rarity: 'rare', woodReward: 180, description: '七色に輝く鮮やかな大型トラウト' },
  { id: 'golden_king', name: '黄金のヌシ・大ナマズ', icon: '👑✨', rarity: 'legendary', woodReward: 300, description: '湖の底深くに何十年も生きる伝説の巨大魚' },
];

const FISHING_DATE_KEY = 'beaver_puzzle_fishing_date';
const FISHING_COUNT_KEY = 'beaver_puzzle_fishing_count';
const FISH_CAUGHT_LOG_KEY = 'beaver_puzzle_fish_caught_log';

export const FishingMiniGameModal: React.FC<FishingMiniGameModalProps> = ({
  isOpen,
  onClose,
  areas,
  onAddWood,
}) => {
  const isUnlocked = isAreaFeatureUnlocked('fishing_pier', areas);

  // 釣りミニゲームの状態
  const [gameState, setGameState] = useState<'idle' | 'aiming' | 'hooked' | 'result'>('idle');
  const [gaugePos, setGaugePos] = useState<number>(0);
  const [gaugeDirection, setGaugeDirection] = useState<'up' | 'down'>('up');
  const [resultFish, setResultFish] = useState<FishCatch | null>(null);
  const [resultType, setResultType] = useState<'great' | 'hit' | 'miss'>('hit');
  const [remainingFreeAttempts, setRemainingFreeAttempts] = useState<number>(3);
  const [caughtFishIds, setCaughtFishIds] = useState<string[]>([]);

  const animFrameRef = useRef<number | null>(null);

  // 1日の残り回数初期化 & 魚拓ログ読み込み
  useEffect(() => {
    if (!isOpen) return;

    const today = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem(FISHING_DATE_KEY);
    const savedCount = parseInt(localStorage.getItem(FISHING_COUNT_KEY) || '0', 10);

    if (savedDate !== today) {
      localStorage.setItem(FISHING_DATE_KEY, today);
      localStorage.setItem(FISHING_COUNT_KEY, '0');
      setRemainingFreeAttempts(3);
    } else {
      setRemainingFreeAttempts(Math.max(0, 3 - savedCount));
    }

    try {
      const savedFish = JSON.parse(localStorage.getItem(FISH_CAUGHT_LOG_KEY) || '[]');
      setCaughtFishIds(savedFish);
    } catch {
      setCaughtFishIds([]);
    }
  }, [isOpen]);

  // ゲージの往復アニメーション
  useEffect(() => {
    if (gameState !== 'aiming') {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let current = gaugePos;
    let dir = gaugeDirection;

    const loop = () => {
      const speed = 2.4;
      if (dir === 'up') {
        current += speed;
        if (current >= 100) {
          current = 100;
          dir = 'down';
        }
      } else {
        current -= speed;
        if (current <= 0) {
          current = 0;
          dir = 'up';
        }
      }
      setGaugePos(current);
      setGaugeDirection(dir);
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, gaugeDirection]);

  if (!isOpen) return null;

  // 竿を投げる
  const handleCastLine = () => {
    if (remainingFreeAttempts <= 0) return;
    sounds.buttonClick();
    setGameState('aiming');
    setGaugePos(10);
    setGaugeDirection('up');
  };

  // 竿を引く（タップ）
  const handleReelIn = () => {
    if (gameState !== 'aiming') return;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    // ゲージ判定:
    // 中央 45% - 55% -> GREAT
    // 35% - 65% -> HIT
    // それ以外 -> MISS
    const pos = gaugePos;
    let outcome: 'great' | 'hit' | 'miss' = 'miss';
    let fish: FishCatch | null = null;

    if (pos >= 46 && pos <= 54) {
      outcome = 'great';
      // レア or レジェンダリー
      const rarePool = FISH_TYPES.filter((f) => f.rarity !== 'common');
      fish = rarePool[Math.floor(Math.random() * rarePool.length)];
    } else if (pos >= 35 && pos <= 65) {
      outcome = 'hit';
      // コモン
      const commonPool = FISH_TYPES.filter((f) => f.rarity === 'common');
      fish = commonPool[Math.floor(Math.random() * commonPool.length)];
    } else {
      outcome = 'miss';
    }

    setResultType(outcome);
    setResultFish(fish);
    setGameState('hooked');

    // 効果音 & 報酬処理
    setTimeout(() => {
      setGameState('result');
      if (outcome === 'great' || outcome === 'hit') {
        sounds.fanfare();
        confetti({
          particleCount: outcome === 'great' ? 55 : 30,
          spread: 60,
          origin: { y: 0.6 },
        });

        if (fish) {
          onAddWood(fish.woodReward);
          // 魚拓ログに追加
          const newCaught = Array.from(new Set([...caughtFishIds, fish.id]));
          setCaughtFishIds(newCaught);
          localStorage.setItem(FISH_CAUGHT_LOG_KEY, JSON.stringify(newCaught));
        }
      } else {
        sounds.warning();
        // 逃げられた残念賞
        onAddWood(20);
      }

      // 残り回数更新
      const todayCount = parseInt(localStorage.getItem(FISHING_COUNT_KEY) || '0', 10) + 1;
      localStorage.setItem(FISHING_COUNT_KEY, todayCount.toString());
      setRemainingFreeAttempts(Math.max(0, 3 - todayCount));
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900 via-sky-950/60 to-slate-900 border-2 border-sky-400/40 rounded-3xl p-5 shadow-2xl text-white space-y-4 max-h-[92vh] overflow-y-auto">
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ヘッダー */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center space-x-1.5 bg-sky-500/20 text-sky-300 border border-sky-400/30 px-3 py-0.5 rounded-full text-xs font-black">
            <span>🎣🐟 釣りテラス</span>
            <span>・</span>
            <span>清流フィッシング</span>
          </div>
          <h2 className="text-xl font-black bg-gradient-to-r from-sky-200 via-cyan-100 to-teal-300 bg-clip-text text-transparent">
            カワセミの渓流釣り
          </h2>
          <p className="text-[11px] text-sky-200/80">
            清流のせせらぎに竿を垂らし、大物を釣り上げよう！
          </p>
        </div>

        {/* ロック状態の表示 */}
        {!isUnlocked ? (
          <div className="py-8 px-4 text-center space-y-3 bg-slate-900/90 rounded-2xl border border-sky-500/20">
            <div className="w-12 h-12 mx-auto rounded-full bg-sky-950/80 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-sky-200">清流の釣りテラスが未完成です</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                エリア「清流の釣りテラス」を完全復興すると、カワセミと一緒に毎日魚釣りが楽しめます！
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
            {/* メイン釣り画面 */}
            <div className="relative rounded-2xl bg-gradient-to-b from-sky-900/40 via-teal-900/30 to-slate-950 border border-sky-400/30 p-4 text-center space-y-3 overflow-hidden shadow-inner">
              {/* 背景水面エフェクト */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.15),transparent_70%)] pointer-events-none" />

              {/* ステータス・残り回数 */}
              <div className="flex justify-between items-center text-xs font-bold px-1">
                <span className="text-sky-300 flex items-center space-x-1">
                  <span>🐦 カワセミ店長</span>
                </span>
                <span className="bg-sky-500/20 text-sky-200 px-2 py-0.5 rounded-lg border border-sky-400/30">
                  今日の無料挑戦: <strong className="text-amber-300">{remainingFreeAttempts}</strong> / 3回
                </span>
              </div>

              {/* ゲームメインエリア */}
              <div className="h-32 flex flex-col items-center justify-center relative">
                {gameState === 'idle' && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="text-4xl animate-bounce-subtle">🌊🎣</div>
                    <p className="text-xs text-sky-200 font-bold">
                      {remainingFreeAttempts > 0
                        ? '準備はいいかい？糸を垂らしてみよう！'
                        : '今日の挑戦は終了したよ！また明日来てね！'}
                    </p>
                  </div>
                )}

                {gameState === 'aiming' && (
                  <div className="w-full space-y-3 animate-fade-in">
                    <div className="text-xs font-black text-amber-300 flex items-center justify-center space-x-1 animate-pulse">
                      <span>🎯 タイミングよく中央のHITゾーンで引け！</span>
                    </div>

                    {/* タイミングゲージバー */}
                    <div className="relative w-full h-7 bg-slate-950 rounded-full border-2 border-sky-400/60 overflow-hidden shadow-inner">
                      {/* HITゾーン（35% - 65%） */}
                      <div className="absolute top-0 bottom-0 left-[35%] w-[30%] bg-emerald-500/40 border-x border-emerald-400" />
                      {/* GREATゾーン（46% - 54%） */}
                      <div className="absolute top-0 bottom-0 left-[46%] w-[8%] bg-amber-400/70 border-x border-amber-300 animate-pulse" />

                      {/* 動くインジケーター */}
                      <div
                        className="absolute top-0 bottom-0 w-2.5 bg-white rounded-full shadow-[0_0_8px_#ffffff] -ml-1 transition-[left] ease-linear duration-16"
                        style={{ left: `${gaugePos}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400 px-1 font-bold">
                      <span>MISS</span>
                      <span className="text-emerald-300">HIT</span>
                      <span className="text-amber-300 font-black">★GREAT★</span>
                      <span className="text-emerald-300">HIT</span>
                      <span>MISS</span>
                    </div>
                  </div>
                )}

                {gameState === 'hooked' && (
                  <div className="space-y-2 animate-bounce">
                    <div className="text-5xl">⚡💦</div>
                    <p className="text-sm font-black text-amber-300 animate-pulse">
                      かかったぞ…！ 慎重に引き上げるんだ！
                    </p>
                  </div>
                )}

                {gameState === 'result' && (
                  <div className="space-y-1.5 animate-complete-pop">
                    {resultType === 'miss' ? (
                      <>
                        <div className="text-4xl">🌿🪵</div>
                        <h4 className="text-sm font-black text-slate-300">逃げられた…！</h4>
                        <p className="text-[11px] text-slate-400">水草と流木を拾ったよ（木材 +20）</p>
                      </>
                    ) : (
                      <>
                        <div className="text-5xl animate-bounce-subtle">{resultFish?.icon}</div>
                        <h4 className="text-base font-black bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text text-transparent">
                          {resultType === 'great' ? '大漁！' : 'HIT！'} {resultFish?.name}
                        </h4>
                        <div className="inline-block bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-black px-2.5 py-0.5 rounded-full">
                          木材 +{resultFish?.woodReward} GET! 🪵
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 操作ボタン */}
              <div>
                {gameState === 'idle' && (
                  <button
                    onClick={handleCastLine}
                    disabled={remainingFreeAttempts <= 0}
                    className={`w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg active:scale-98 ${
                      remainingFreeAttempts > 0
                        ? 'bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-400 hover:brightness-110 text-slate-950 shadow-cyan-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>竿を投げる（無料あと {remainingFreeAttempts} 回） 🎣</span>
                  </button>
                )}

                {gameState === 'aiming' && (
                  <button
                    onClick={handleReelIn}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 hover:brightness-110 text-slate-950 font-black text-base rounded-2xl shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all cursor-pointer animate-pulse"
                  >
                    <span>竿を引く！！ 🎣</span>
                  </button>
                )}

                {gameState === 'hooked' && (
                  <button
                    disabled
                    className="w-full py-3 bg-slate-800 text-slate-400 font-black text-sm rounded-2xl cursor-wait"
                  >
                    引き上げ中... 💦
                  </button>
                )}

                {gameState === 'result' && (
                  <button
                    onClick={() => setGameState('idle')}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>もう一度釣る</span>
                  </button>
                )}
              </div>
            </div>

            {/* 釣った魚の魚拓図鑑 */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs font-black text-sky-200">
                <span className="flex items-center space-x-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>魚拓図鑑</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  釣った種類: {caughtFishIds.length} / {FISH_TYPES.length}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {FISH_TYPES.map((fish) => {
                  const isCaught = caughtFishIds.includes(fish.id);
                  return (
                    <div
                      key={fish.id}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        isCaught
                          ? 'bg-sky-950/40 border-sky-500/30'
                          : 'bg-slate-900/60 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xl">{isCaught ? fish.icon : '❓'}</span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-black truncate text-slate-200">
                            {isCaught ? fish.name : '？？？'}
                          </div>
                          <div className="text-[9px] text-amber-400 font-bold">
                            {isCaught ? `木材 +${fish.woodReward}` : '未発見'}
                          </div>
                        </div>
                      </div>
                    </div>
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
