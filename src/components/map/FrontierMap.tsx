import React, { useState, useEffect, useRef } from 'react';
import type { FrontierArea, Creature } from '../../types';
import { DevStageSelector } from '../common/DevStageSelector';
import { sounds } from '../../utils/soundEffects';
import confetti from 'canvas-confetti';
import {
  Lock,
  CheckCircle2,
  Play,
  Heart,
  Hammer,
  Map as MapIcon,
  List,
  ChevronRight,
  X,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface FrontierMapProps {
  areas: FrontierArea[];
  woodPoints: number;
  badgesCount: number;
  creaturesCount: number;
  onStartPuzzle: (stageId: number) => void;
  onCompleteTask: (areaId: string, taskId: string, cost: number) => void;
  onCompleteArea: (area: FrontierArea) => void;
  currentStageId: number;
  onSelectStage: (stageId: number) => void;
  onAddWood: (amount: number) => void;
  onUnlockAllAreas: () => void;
}

export const FrontierMap: React.FC<FrontierMapProps> = ({
  areas,
  woodPoints,
  badgesCount,
  creaturesCount,
  onStartPuzzle,
  onCompleteTask,
  onCompleteArea,
  currentStageId,
  onSelectStage,
  onAddWood,
  onUnlockAllAreas,
}) => {
  const [viewMode, setViewMode] = useState<'panorama' | 'list'>('panorama');
  const [selectedArea, setSelectedArea] = useState<FrontierArea | null>(null);
  const [selectedCreature, setSelectedCreature] = useState<Creature | null>(null);
  const [creatureReaction, setCreatureReaction] = useState<string | null>(null);
  const [beaverDialogue, setBeaverDialogue] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());

  const mapScrollRef = useRef<HTMLDivElement>(null);
  const activePinRef = useRef<HTMLDivElement>(null);

  // マップ表示時に環境音（せせらぎ & 小鳥）を開始
  useEffect(() => {
    sounds.startAmbient();
    return () => {
      sounds.stopAmbient();
    };
  }, []);

  // 初回マウント時、現在開拓中のエリアへスムーズスクロール
  useEffect(() => {
    if (viewMode === 'panorama') {
      const timer = setTimeout(() => {
        if (activePinRef.current) {
          activePinRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (mapScrollRef.current) {
          // 下流（下部）へスクロール
          mapScrollRef.current.scrollTop = mapScrollRef.current.scrollHeight;
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [viewMode]);

  // 紙吹雪エフェクト
  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const handleTaskClick = (area: FrontierArea, taskId: string, cost: number) => {
    if (woodPoints < cost) return;

    sounds.playBuild();
    onCompleteTask(area.id, taskId, cost);

    // 選択中エリアの状態も更新
    if (selectedArea && selectedArea.id === area.id) {
      setSelectedArea({
        ...selectedArea,
        tasks: selectedArea.tasks.map((t) => (t.id === taskId ? { ...t, isCompleted: true } : t)),
      });
    }

    const remainingTasks = area.tasks.filter((t) => t.id !== taskId && !t.isCompleted);
    if (remainingTasks.length === 0) {
      onCompleteArea(area);
      triggerConfetti();
    }
  };

  const handleCreatureTap = (c: Creature) => {
    setSelectedCreature(c);
    const reactions = ['ピィッ！♪', 'クエックエッ✨', 'るんるん❤️', 'カリカリ…🌰', 'パタパタ〜🌿', 'グルル〜♪', 'ホーホー🦉✨'];
    setCreatureReaction(reactions[Math.floor(Math.random() * reactions.length)]);
    setTimeout(() => setCreatureReaction(null), 2200);
  };

  const handleBeaverTap = () => {
    const dialogues = [
      '丸太を集めて、森の仲間たちの楽園を作ろう！🦫✨',
      '川を綺麗にすると、色んな生き物が戻ってくるよ！🦆🐟',
      '水車小屋を建てたら、パンを焼いてピクニックしよう！🥐',
      '開拓バッジを集めると、もっと上流の朝霧が晴れるよ！🏞️',
      'ふたりのダム、どんどん立派になってきたね！🪵💖',
    ];
    setBeaverDialogue(dialogues[Math.floor(Math.random() * dialogues.length)]);
    setTimeout(() => setBeaverDialogue(null), 3000);
  };

  const handleToggleMute = () => {
    const nextMuted = sounds.toggleMute();
    setIsMuted(nextMuted);
  };

  const completedAreasCount = areas.filter((a) => a.status === 'completed').length;

  // 広域の霧の高さ（バッジ数に応じて上流へ後退）
  // バッジ0: 上部65%が霧、バッジ1: 52%、バッジ2: 40%、バッジ3: 30%、バッジ4: 18%、バッジ5: 0%（全晴れ）
  const fogCoverHeightPercent = Math.max(0, 68 - badgesCount * 14);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden pb-20 select-none">
      {/* 1. トップステータスバー */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5">
        <div className="flex items-center justify-between">
          {/* ビーバーアイコン & タイトル */}
          <div
            onClick={handleBeaverTap}
            className="flex items-center space-x-2 cursor-pointer active:scale-95 transition-transform"
          >
            <div className="relative">
              <img
                src="/assets/beaver_hero.jpg"
                alt="ビーバー棟梁"
                className="w-10 h-10 rounded-full border-2 border-amber-400 object-cover shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-[10px] text-amber-950 font-black px-1 rounded-full">
                Lv.{completedAreasCount + 1}
              </span>
            </div>
            <div>
              <h1 className="text-xs font-black tracking-tight text-white flex items-center">
                <span>ダム開拓フロンティア</span>
                <span className="ml-1 text-[10px] text-amber-400">🦫🪵</span>
              </h1>
              <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                <span>開拓度: {completedAreasCount}/{areas.length}</span>
              </div>
            </div>
          </div>

          {/* 右側アクション（環境音ON/OFF & Devセレクター） */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleToggleMute}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800/80 border border-slate-700 active:scale-95"
              title={isMuted ? 'サウンドON' : 'ミュート'}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <div className="relative flex items-center">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                </div>
              )}
            </button>

            {/* 開発者用ステージセレクター */}
            <DevStageSelector
              currentStageId={currentStageId}
              onSelectStage={onSelectStage}
              onAddWood={onAddWood}
              onUnlockAllAreas={onUnlockAllAreas}
            />
          </div>
        </div>

        {/* 資源カウンター & 表示切り替えタブ */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center space-x-3 text-xs font-black">
            {/* 木材ポイント */}
            <div className="flex items-center space-x-1.5 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-xl shadow-xs">
              <span className="text-base leading-none">🪵</span>
              <span className="text-amber-300 font-mono text-sm">{woodPoints}</span>
            </div>

            {/* バッジ数 */}
            <div className="flex items-center space-x-1 bg-purple-950/40 border border-purple-500/30 px-2 py-1 rounded-xl">
              <span className="text-xs">🏅</span>
              <span className="text-purple-300 font-mono text-xs">{badgesCount}</span>
            </div>

            {/* 生き物数 */}
            <div className="flex items-center space-x-1 bg-emerald-950/40 border border-emerald-500/30 px-2 py-1 rounded-xl">
              <span className="text-xs">🦆</span>
              <span className="text-emerald-300 font-mono text-xs">{creaturesCount}</span>
            </div>
          </div>

          {/* パノラママップ / 一覧リスト切り替え */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('panorama')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                viewMode === 'panorama'
                  ? 'bg-amber-500 text-amber-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3 h-3" />
              <span>箱庭マップ</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                viewMode === 'list'
                  ? 'bg-amber-500 text-amber-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3 h-3" />
              <span>一覧</span>
            </button>
          </div>
        </div>

        {/* ビーバーのおしゃべり吹き出し */}
        {beaverDialogue && (
          <div className="mt-2 p-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/40 rounded-xl text-center text-xs font-bold text-amber-200 animate-pop-in">
            {beaverDialogue}
          </div>
        )}
      </header>

      {/* 2. メインコンテンツエリア */}
      {viewMode === 'panorama' ? (
        /* パノラマ箱庭自然マップビュー（自動スクロール対応） */
        <div
          ref={mapScrollRef}
          className="relative w-full overflow-y-auto no-scrollbar scroll-smooth"
          style={{ maxHeight: 'calc(100vh - 140px)' }}
        >
          {/* 縦長パノラママップ画像 */}
          <div className="relative w-full aspect-[9/16] min-h-[760px] bg-slate-900 select-none">
            <img
              src="/assets/river_map.jpg"
              alt="川と森のパノラママップ"
              className="w-full h-full object-cover"
            />

            {/* 広域朝霧レイヤー (バッジ数に応じて上流へ後退) */}
            {fogCoverHeightPercent > 0 && (
              <div
                style={{ height: `${fogCoverHeightPercent}%` }}
                className="absolute top-0 left-0 right-0 z-10 pointer-events-none transition-all duration-1000 ease-out overflow-hidden"
              >
                {/* 霧のグラデーション */}
                <div className="w-full h-full bg-gradient-to-b from-slate-200/80 via-slate-100/60 to-transparent backdrop-blur-md animate-wide-fog border-b border-white/30" />
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-950/70 backdrop-blur-xs rounded-full border border-white/30 text-[10px] font-black text-slate-200 shadow-lg flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-slate-300" />
                  <span>未踏の上流エリア（濃い朝霧）</span>
                </div>
              </div>
            )}

            {/* 水面のきらめきエフェクト */}
            <div className="absolute top-[52%] left-[45%] w-12 h-12 bg-white/20 rounded-full blur-md animate-water-shimmer pointer-events-none" />
            <div className="absolute top-[82%] left-[55%] w-16 h-16 bg-cyan-200/20 rounded-full blur-lg animate-water-shimmer pointer-events-none" />

            {/* =========================================
                レイヤード・ビルディング（開拓物のマップ反映）
                ========================================= */}
            {areas.map((area) => {
              const coords = area.mapCoords || { x: 50, y: 50 };

              return (
                <React.Fragment key={`decorations_${area.id}`}>
                  {/* エリア1: はじまりのせせらぎ (stream_entry) */}
                  {area.id === 'stream_entry' && (
                    <>
                      {/* タスク1完了: 小川の透き通る水面 */}
                      {area.tasks[0].isCompleted && (
                        <div
                          style={{ top: `${coords.y - 2}%`, left: `${coords.x + 8}%` }}
                          className="absolute z-12 animate-pop-in pointer-events-none"
                        >
                          <span className="text-sm">✨</span>
                        </div>
                      )}
                      {/* タスク2完了: 小石の歩きやすい足場 */}
                      {area.tasks[1].isCompleted && (
                        <div
                          style={{ top: `${coords.y + 4}%`, left: `${coords.x - 6}%` }}
                          className="absolute z-12 animate-pop-in pointer-events-none px-1.5 py-0.5 bg-amber-900/60 rounded-md border border-amber-400/40 text-[9px] text-amber-200 font-black shadow-xs"
                        >
                          🪵 整備された足場
                        </div>
                      )}
                    </>
                  )}

                  {/* エリア2: 小枝ダムの浅瀬 (small_dam) */}
                  {area.id === 'small_dam' && (
                    <>
                      {/* タスク1完了: 骨組み */}
                      {area.tasks[0].isCompleted && (
                        <div
                          style={{ top: `${coords.y + 3}%`, left: `${coords.x - 10}%` }}
                          className="absolute z-12 animate-pop-in pointer-events-none text-base"
                        >
                          🪵
                        </div>
                      )}
                      {/* タスク2完了: 完成した小枝ダム */}
                      {area.tasks[1].isCompleted && (
                        <div
                          style={{ top: `${coords.y + 3}%`, left: `${coords.x + 2}%` }}
                          className="absolute z-12 animate-pop-in pointer-events-none px-2 py-0.5 bg-teal-950/80 border border-teal-400/50 rounded-xl text-[9px] text-teal-200 font-black shadow-md flex items-center space-x-1"
                        >
                          <span>🪵🌊 小枝ダム完成</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* エリア3: 木漏れ日のロッジ (beaver_lodge) */}
                  {area.id === 'beaver_lodge' && (
                    <>
                      {/* タスク1完了: ベッド */}
                      {area.tasks[0].isCompleted && (
                        <div
                          style={{ top: `${coords.y + 4}%`, left: `${coords.x - 8}%` }}
                          className="absolute z-12 animate-pop-in pointer-events-none text-xs"
                        >
                          🛏️
                        </div>
                      )}
                      {/* タスク2完了: ビーバーロッジ本体 */}
                      {area.tasks[1].isCompleted && (
                        <div
                          style={{ top: `${coords.y - 5}%`, left: `${coords.x}%` }}
                          className="absolute z-12 animate-pop-in pointer-events-none flex flex-col items-center"
                        >
                          <span className="text-xl animate-bounce-subtle">🏡</span>
                          <span className="text-[8px] bg-amber-950/90 text-amber-200 font-black px-1.5 rounded-full border border-amber-400">
                            温かいロッジ
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* エリア4: 釣りテラス＆桟橋 (fishing_pier) */}
                  {area.id === 'fishing_pier' && (
                    <>
                      {area.tasks[0].isCompleted && (
                        <div
                          style={{ top: `${coords.y + 4}%`, left: `${coords.x - 5}%` }}
                          className="absolute z-12 animate-pop-in pointer-events-none text-sm"
                        >
                          🪵🎣
                        </div>
                      )}
                    </>
                  )}

                  {/* エリア5: 古い水車小屋 (watermill_zone) */}
                  {area.id === 'watermill_zone' && (
                    <>
                      {/* タスク1完了: 回転水車 */}
                      {area.tasks[0].isCompleted && (
                        <div
                          style={{ top: `${coords.y + 3}%`, left: `${coords.x - 8}%` }}
                          className="absolute z-12 animate-pop-in pointer-events-none"
                        >
                          <span className="text-lg inline-block animate-spin-slow">⚙️</span>
                        </div>
                      )}
                      {/* タスク2完了: 工房完成 */}
                      {area.tasks[1].isCompleted && (
                        <div
                          style={{ top: `${coords.y - 5}%`, left: `${coords.x - 2}%` }}
                          className="absolute z-12 animate-pop-in pointer-events-none px-2 py-0.5 bg-blue-950/80 border border-blue-400/50 rounded-xl text-[9px] text-blue-200 font-black shadow-md flex items-center space-x-1"
                        >
                          <span>🥖 水車パン工房</span>
                        </div>
                      )}
                    </>
                  )}

                  {/* エリア6: ホタルの花園 (flower_garden) */}
                  {area.id === 'flower_garden' && (
                    <>
                      {area.tasks[0].isCompleted && (
                        <div
                          style={{ top: `${coords.y + 4}%`, left: `${coords.x + 4}%` }}
                          className="absolute z-12 animate-pop-in pointer-events-none text-xs"
                        >
                          🌸🌺
                        </div>
                      )}
                      {area.tasks[1].isCompleted && (
                        <div
                          style={{ top: `${coords.y - 4}%`, left: `${coords.x + 2}%` }}
                          className="absolute z-12 animate-pop-in pointer-events-none text-sm animate-pulse"
                        >
                          ✨🌟
                        </div>
                      )}
                    </>
                  )}

                  {/* エリア7: ビーバーの桃源郷 (emerald_lake) */}
                  {area.id === 'emerald_lake' && (
                    <>
                      {area.tasks[0].isCompleted && (
                        <div
                          style={{ top: `${coords.y + 4}%`, left: `${coords.x - 6}%` }}
                          className="absolute z-12 animate-pop-in pointer-events-none text-base"
                        >
                          🏰
                        </div>
                      )}
                      {area.tasks[1].isCompleted && (
                        <div
                          style={{ top: `${coords.y - 5}%`, left: `${coords.x}%` }}
                          className="absolute z-12 animate-pop-in pointer-events-none flex flex-col items-center"
                        >
                          <span className="text-xl animate-bounce-subtle">👑✨</span>
                          <span className="text-[8px] bg-purple-950/90 text-purple-200 font-black px-1.5 rounded-full border border-purple-400">
                            桃源郷モニュメント
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </React.Fragment>
              );
            })}

            {/* =========================================
                開拓完了した生き物たちのダイナミック活動演出
                ========================================= */}
            {areas.map((area) => {
              if (area.status !== 'completed') return null;
              const creature = area.creature;
              const coords = area.mapCoords || { x: 50, y: 50 };

              if (creature.id === 'mallard_duck') {
                return (
                  <div
                    key={creature.id}
                    onClick={() => handleCreatureTap(creature)}
                    style={{ top: `${coords.y + 5}%`, left: `${coords.x - 12}%` }}
                    className="absolute z-15 cursor-pointer animate-duck-swim"
                    title={creature.name}
                  >
                    <span className="text-2xl filter drop-shadow-md inline-block">🦆</span>
                  </div>
                );
              }

              if (creature.id === 'sweetfish') {
                return (
                  <div
                    key={creature.id}
                    onClick={() => handleCreatureTap(creature)}
                    style={{ top: `${coords.y + 2}%`, left: `${coords.x + 10}%` }}
                    className="absolute z-15 cursor-pointer animate-fish-jump"
                    title={creature.name}
                  >
                    <span className="text-lg filter drop-shadow-md inline-block">🐟</span>
                  </div>
                );
              }

              if (creature.id === 'chipmunk') {
                return (
                  <div
                    key={creature.id}
                    onClick={() => handleCreatureTap(creature)}
                    style={{ top: `${coords.y + 3}%`, left: `${coords.x + 12}%` }}
                    className="absolute z-15 cursor-pointer animate-creature-hop"
                    title={creature.name}
                  >
                    <span className="text-xl filter drop-shadow-md inline-block">🐿️</span>
                  </div>
                );
              }

              if (creature.id === 'kingfisher') {
                return (
                  <div
                    key={creature.id}
                    onClick={() => handleCreatureTap(creature)}
                    style={{ top: `${coords.y - 4}%`, left: `${coords.x - 10}%` }}
                    className="absolute z-15 cursor-pointer animate-bird-hover"
                    title={creature.name}
                  >
                    <span className="text-xl filter drop-shadow-md inline-block">🐦</span>
                  </div>
                );
              }

              if (creature.id === 'owl') {
                return (
                  <div
                    key={creature.id}
                    onClick={() => handleCreatureTap(creature)}
                    style={{ top: `${coords.y - 5}%`, left: `${coords.x + 10}%` }}
                    className="absolute z-15 cursor-pointer animate-bounce-subtle"
                    title={creature.name}
                  >
                    <span className="text-xl filter drop-shadow-md inline-block">🦉</span>
                  </div>
                );
              }

              if (creature.id === 'deer') {
                return (
                  <div
                    key={creature.id}
                    onClick={() => handleCreatureTap(creature)}
                    style={{ top: `${coords.y + 2}%`, left: `${coords.x - 12}%` }}
                    className="absolute z-15 cursor-pointer animate-bounce-subtle"
                    title={creature.name}
                  >
                    <span className="text-2xl filter drop-shadow-md inline-block">🦌</span>
                  </div>
                );
              }

              if (creature.id === 'bear_family') {
                return (
                  <div
                    key={creature.id}
                    onClick={() => handleCreatureTap(creature)}
                    style={{ top: `${coords.y + 2}%`, left: `${coords.x + 12}%` }}
                    className="absolute z-15 cursor-pointer animate-bounce-subtle"
                    title={creature.name}
                  >
                    <span className="text-3xl filter drop-shadow-md inline-block">🐻</span>
                  </div>
                );
              }

              return null;
            })}

            {/* =========================================
                各エリアのスポットピン＆インタラクション
                ========================================= */}
            {areas.map((area) => {
              const isLocked = area.status === 'locked_fog';
              const isCleared = area.status === 'cleared_fog';
              const isCompleted = area.status === 'completed';
              const coords = area.mapCoords || { x: 50, y: 50 };

              // フォーカス対象のアクティブピン判定（最前線の cleared_fog エリア）
              const isActivePin = isCleared;

              return (
                <div
                  key={area.id}
                  ref={isActivePin ? activePinRef : null}
                  style={{ top: `${coords.y}%`, left: `${coords.x}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                >
                  {/* 1. 霧に覆われたエリア (locked_fog) */}
                  {isLocked && (
                    <div
                      onClick={() => setSelectedArea(area)}
                      className="group cursor-pointer flex flex-col items-center"
                    >
                      {/* 朝霧エフェクト */}
                      <div className="absolute -inset-6 bg-slate-100/50 backdrop-blur-md rounded-full blur-sm animate-fog pointer-events-none border border-white/40" />

                      {/* ロックピン */}
                      <div className="relative w-11 h-11 bg-slate-900/90 border-2 border-slate-400/80 rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 active:scale-95 transition-transform">
                        <Lock className="w-5 h-5 text-slate-300" />
                      </div>

                      {/* バッジ必要数ラベル */}
                      <span className="relative mt-1 px-2 py-0.5 bg-slate-950/80 backdrop-blur-xs border border-slate-700 text-[9px] font-black text-slate-300 rounded-full shadow-md flex items-center space-x-0.5">
                        <span>🏅</span>
                        <span>{area.requiredBadges}個で晴れる</span>
                      </span>
                    </div>
                  )}

                  {/* 2. 霧が晴れて開拓可能なエリア (cleared_fog) */}
                  {isCleared && (
                    <div
                      onClick={() => setSelectedArea(area)}
                      className="group cursor-pointer flex flex-col items-center"
                    >
                      {/* 黄金の光パルス */}
                      <div className="absolute -inset-2 bg-amber-400/30 rounded-full blur-md animate-ping pointer-events-none" />

                      {/* 開拓可能ピン */}
                      <div className="relative w-12 h-12 bg-gradient-to-tr from-amber-500 to-yellow-400 border-2 border-white rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 active:scale-95 transition-transform">
                        <span className="text-xl animate-bounce-subtle">{area.icon}</span>
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                      </div>

                      {/* エリア名ラベル */}
                      <span className="mt-1 px-2 py-0.5 bg-amber-950/90 border border-amber-400 text-[10px] font-black text-amber-200 rounded-full shadow-lg flex items-center space-x-1">
                        <Hammer className="w-2.5 h-2.5 text-amber-400" />
                        <span>{area.name}</span>
                      </span>
                    </div>
                  )}

                  {/* 3. 開拓コンプリート済みエリア (completed) */}
                  {isCompleted && (
                    <div
                      onClick={() => setSelectedArea(area)}
                      className="group cursor-pointer flex flex-col items-center"
                    >
                      {/* コンプリートピン */}
                      <div className="relative w-11 h-11 bg-gradient-to-tr from-emerald-500 to-teal-400 border-2 border-emerald-200 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 active:scale-95 transition-transform">
                        <span className="text-lg">{area.creature.icon}</span>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center text-[8px] text-white border border-white">
                          🏅
                        </div>
                      </div>

                      {/* コンプリートラベル */}
                      <span className="mt-1 px-2 py-0.5 bg-emerald-950/90 border border-emerald-400/60 text-[9px] font-black text-emerald-200 rounded-full shadow-md flex items-center space-x-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                        <span>{area.name}</span>
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* リスト詳細ビュー（従来の安心一覧形式） */
        <div className="p-4 space-y-3 overflow-y-auto no-scrollbar" style={{ maxHeight: 'calc(100vh - 140px)' }}>
          <div className="text-xs font-bold text-slate-400 flex items-center justify-between pb-1">
            <span>開拓エリア一覧（全{areas.length}箇所）</span>
            <span className="text-amber-400">獲得バッジ: {badgesCount}個</span>
          </div>

          {areas.map((area) => {
            const isLocked = area.status === 'locked_fog';
            const isCompleted = area.status === 'completed';

            return (
              <div
                key={area.id}
                onClick={() => setSelectedArea(area)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isLocked
                    ? 'bg-slate-900/60 border-slate-800 opacity-60'
                    : isCompleted
                    ? 'bg-emerald-950/30 border-emerald-500/40'
                    : 'bg-slate-800/90 border-amber-500/40 shadow-sm hover:border-amber-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl p-2 bg-slate-900/80 rounded-xl border border-slate-700">
                      {isLocked ? '🔒' : area.icon}
                    </span>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-black text-white">{area.name}</span>
                        {isCompleted && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-md font-bold">
                            開拓完了
                          </span>
                        )}
                        {!isLocked && !isCompleted && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-md font-bold">
                            開拓可能
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {isLocked ? `バッジあと${Math.max(0, area.requiredBadges - badgesCount)}個で解放` : area.description}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. エリア詳細 & 開拓ボトムシート（エリアタップ時に開く） */}
      {selectedArea && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border-t-2 border-amber-500/80 rounded-t-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar animate-pop-in">
            {/* ヘッダー */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <span className="text-3xl p-2 bg-slate-800 rounded-2xl border border-slate-700">
                  {selectedArea.status === 'locked_fog' ? '🔒' : selectedArea.icon}
                </span>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm font-black text-white">{selectedArea.name}</span>
                    {selectedArea.status === 'completed' ? (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-bold">
                        コンプリート済み 🏅
                      </span>
                    ) : selectedArea.status === 'cleared_fog' ? (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-bold">
                        開拓可能 🪵
                      </span>
                    ) : (
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-bold">
                        朝霧に包まれている
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{selectedArea.description}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedArea(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. ロック中の説明 */}
            {selectedArea.status === 'locked_fog' && (
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-center space-y-2">
                <Lock className="w-8 h-8 text-slate-500 mx-auto" />
                <h4 className="text-xs font-black text-slate-300">
                  このエリアは朝霧で覆われています
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  他のエリアの開拓を完了して**バッジを{selectedArea.requiredBadges}個**集めると、朝霧がサーッと晴れて開拓できるようになります！
                </p>
                <div className="text-xs font-mono font-bold text-amber-400 bg-amber-950/30 py-1.5 rounded-xl border border-amber-500/20">
                  現在の獲得バッジ: {badgesCount} / {selectedArea.requiredBadges}
                </div>
              </div>
            )}

            {/* 2. 開拓中・コンプリート済みのタスク一覧 */}
            {selectedArea.status !== 'locked_fog' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black text-slate-300">
                  <span>開拓タスク</span>
                  <span className="text-[11px] text-amber-400">所持木材: 🪵{woodPoints}</span>
                </div>

                <div className="space-y-2">
                  {selectedArea.tasks.map((task) => {
                    const canAfford = woodPoints >= task.woodCost;

                    return (
                      <div
                        key={task.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                          task.isCompleted
                            ? 'bg-emerald-950/30 border-emerald-500/30 opacity-70'
                            : 'bg-slate-800/80 border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="text-2xl">{task.icon}</span>
                          <div>
                            <div className="text-xs font-black text-white">{task.title}</div>
                            <div className="text-[10px] text-slate-400">
                              効果: {task.visualLabel}
                            </div>
                          </div>
                        </div>

                        <div>
                          {task.isCompleted ? (
                            <span className="flex items-center text-[11px] font-black text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-xl">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              完了
                            </span>
                          ) : (
                            <button
                              onClick={() => handleTaskClick(selectedArea, task.id, task.woodCost)}
                              disabled={!canAfford}
                              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1 shadow-sm transition-all ${
                                canAfford
                                  ? 'bg-amber-500 hover:bg-amber-600 text-amber-950 active:scale-95 cursor-pointer'
                                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              <Hammer className="w-3 h-3" />
                              <span>開拓 (🪵{task.woodCost})</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 住み着いた生き物情報 */}
                <div
                  onClick={() => handleCreatureTap(selectedArea.creature)}
                  className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-emerald-950/60 transition-colors mt-3"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-3xl animate-bounce-subtle inline-block">
                      {selectedArea.creature.icon}
                    </span>
                    <div>
                      <div className="text-xs font-black text-emerald-200 flex items-center">
                        <span>{selectedArea.creature.name}</span>
                        {selectedArea.status === 'completed' && (
                          <span className="ml-1 text-[9px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded-md">
                            暮らしているよ
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {selectedArea.creature.description}
                      </div>
                    </div>
                  </div>

                  <div className="text-rose-400 p-1">
                    <Heart className="w-4 h-4 fill-current animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedArea(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs rounded-xl"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* 4. 生き物詳細モーダル */}
      {selectedCreature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs bg-slate-900 border border-emerald-500/50 rounded-3xl p-5 shadow-2xl text-center space-y-3">
            <span className="text-6xl inline-block drop-shadow-md animate-bounce-subtle">
              {selectedCreature.icon}
            </span>
            <h3 className="text-base font-black text-white">{selectedCreature.name}</h3>
            {creatureReaction && (
              <div className="text-xs font-black text-emerald-300 bg-emerald-500/20 py-1 rounded-xl">
                {creatureReaction}
              </div>
            )}
            <p className="text-xs text-slate-400 bg-slate-800 p-3 rounded-2xl">
              {selectedCreature.description}
            </p>
            <div className="text-xs text-rose-300 font-bold bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
              {selectedCreature.comment}
            </div>
            <button
              onClick={() => setSelectedCreature(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* 5. 画面下部固定アクションバー（パズルへ出発！） */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center space-x-2">
          <div className="text-left">
            <div className="text-[10px] text-slate-400 font-bold">次の開拓ステージ</div>
            <div className="text-xs font-black text-amber-400">Stage {currentStageId}</div>
          </div>
        </div>

        <button
          onClick={() => onStartPuzzle(currentStageId)}
          className="flex-1 ml-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-black text-sm rounded-2xl shadow-lg flex items-center justify-center space-x-2 active:scale-98 transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>パズルで木材を集める！ 🪵</span>
        </button>
      </footer>
    </div>
  );
};
