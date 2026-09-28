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
  AlertTriangle,
  Sparkles,
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
  onResetAll?: () => void;
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
  onResetAll,
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
          mapScrollRef.current.scrollTop = mapScrollRef.current.scrollHeight;
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [viewMode]);

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

    // 選択中エリアの状態も即時同期
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
      '丸太を集めて、荒れ果てた川を蘇らせよう！🦫✨',
      '霧が晴れた場所にはガレキがあるよ。木材で修復しよう！🥀➔🌿',
      'エリアを1つ復活させるとバッジが手に入り、奥の霧が晴れるよ！🏅',
      '水車小屋を建て直したら、パンを焼いてピクニックしよう！🥐',
      'ふたりの川、どんどん命が吹き込まれてきたね！🪵💖',
    ];
    setBeaverDialogue(dialogues[Math.floor(Math.random() * dialogues.length)]);
    setTimeout(() => setBeaverDialogue(null), 3000);
  };

  const handleToggleMute = () => {
    const nextMuted = sounds.toggleMute();
    setIsMuted(nextMuted);
  };

  const completedAreasCount = areas.filter((a) => a.status === 'completed').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col max-w-md mx-auto relative shadow-2xl overflow-hidden pb-20 select-none">
      {/* 1. トップステータスバー */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5">
        <div className="flex items-center justify-between">
          {/* ビーバー棟梁 & レベル */}
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
                <span>再生完了: {completedAreasCount}/{areas.length}</span>
              </div>
            </div>
          </div>

          {/* サウンド & Devセレクター */}
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

            <DevStageSelector
              currentStageId={currentStageId}
              onSelectStage={onSelectStage}
              onAddWood={onAddWood}
              onUnlockAllAreas={onUnlockAllAreas}
              onResetAll={onResetAll}
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

          {/* ビュー切り替え */}
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

        {/* ビーバーのセリフ */}
        {beaverDialogue && (
          <div className="mt-2 p-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/40 rounded-xl text-center text-xs font-bold text-amber-200 animate-pop-in">
            {beaverDialogue}
          </div>
        )}
      </header>

      {/* 2. メインコンテンツエリア */}
      {viewMode === 'panorama' ? (
        /* パノラマ箱庭自然マップビュー */
        <div
          ref={mapScrollRef}
          className="relative w-full overflow-y-auto no-scrollbar scroll-smooth"
          style={{ maxHeight: 'calc(100vh - 140px)' }}
        >
          <div className="relative w-full aspect-[9/16] min-h-[760px] bg-slate-900 select-none">
            {/* メイン自然俯瞰背景 */}
            <img
              src="/assets/river_map.jpg"
              alt="川と森のパノラママップ"
              className="w-full h-full object-cover"
            />

            {/* 水面のきらめきエフェクト */}
            <div className="absolute top-[52%] left-[45%] w-12 h-12 bg-white/20 rounded-full blur-md animate-water-shimmer pointer-events-none" />
            <div className="absolute top-[82%] left-[55%] w-16 h-16 bg-cyan-200/20 rounded-full blur-lg animate-water-shimmer pointer-events-none" />

            {/* ========================================================
                各エリアごとの「楕円の霧」「荒廃ビジュアル」「復旧・復活パーツ」
                ======================================================== */}
            {areas.map((area) => {
              const isLocked = area.status === 'locked_fog';
              const isCleared = area.status === 'cleared_fog';
              const isCompleted = area.status === 'completed';
              const coords = area.mapCoords || { x: 50, y: 50 };
              const completedTasksCount = area.tasks.filter((t) => t.isCompleted).length;

              return (
                <React.Fragment key={`area_render_${area.id}`}>
                  {/* ----------------------------------------------------
                      A. 未踏エリア: 有機的な楕円の雲（モクモクした霧塊）
                      ---------------------------------------------------- */}
                  {isLocked && (
                    <div
                      style={{ top: `${coords.y}%`, left: `${coords.x}%` }}
                      onClick={() => setSelectedArea(area)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-25 cursor-pointer flex flex-col items-center group"
                    >
                      {/* 重なり合う3層の楕円形の白い雲塊 */}
                      <div className="relative w-40 h-28 flex items-center justify-center pointer-events-none">
                        {/* 雲層1: 大きな横長楕円 */}
                        <div className="absolute w-36 h-22 bg-gradient-to-br from-slate-100/90 via-slate-200/85 to-slate-300/80 rounded-[50%] blur-sm shadow-xl border border-white/60 animate-fog-cloud-1" />
                        {/* 雲層2: やや斜めの楕円 */}
                        <div className="absolute w-32 h-24 bg-gradient-to-tr from-white/90 via-slate-100/80 to-slate-200/70 rounded-[55%] blur-sm shadow-md animate-fog-cloud-2" />
                        {/* 雲層3: ふんわり中心のハイライト雲 */}
                        <div className="absolute w-24 h-18 bg-white/95 rounded-[50%] blur-xs animate-fog-cloud-3" />

                        {/* 霧の中心に浮かぶロック標識 */}
                        <div className="relative z-10 flex flex-col items-center pointer-events-auto group-hover:scale-105 active:scale-95 transition-transform">
                          <div className="w-8 h-8 rounded-full bg-slate-900/80 border border-slate-400 flex items-center justify-center shadow-md">
                            <Lock className="w-4 h-4 text-slate-300" />
                          </div>
                          <span className="mt-1 px-2 py-0.5 bg-slate-950/80 backdrop-blur-xs border border-slate-700 text-[8px] font-black text-slate-200 rounded-full shadow-md whitespace-nowrap">
                            🏅 あと{Math.max(1, area.requiredBadges - badgesCount)}個で晴れる
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ----------------------------------------------------
                      B. 霧が晴れた開拓エリア: 【荒廃（Before）➔ 復旧中】
                      ---------------------------------------------------- */}
                  {isCleared && (
                    <>
                      {/* 荒廃状態のマップ上ビジュアル（倒木・濁り水・崩れた土手） */}
                      {completedTasksCount === 0 && (
                        <div
                          style={{ top: `${coords.y + 3}%`, left: `${coords.x}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center animate-fade-in"
                        >
                          {/* 泥・荒れ地の茶色いスポット */}
                          <div className="w-16 h-8 bg-amber-950/70 rounded-[50%] blur-xs border border-amber-900/50" />
                          <span className="text-xs opacity-90 -mt-3 filter drop-shadow-md">
                            {(area.ruinedIcon || "🥀")}
                          </span>
                        </div>
                      )}

                      {/* タスク1完了時: 荒廃が片付き、半復旧したパーツ */}
                      {completedTasksCount === 1 && (
                        <div
                          style={{ top: `${coords.y + 2}%`, left: `${coords.x}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center animate-pop-in"
                        >
                          <div className="w-14 h-7 bg-teal-950/60 rounded-[50%] blur-xs border border-teal-500/40" />
                          <span className="text-xs -mt-3 filter drop-shadow-md">
                            🪵✨
                          </span>
                        </div>
                      )}

                      {/* 開拓インタラクションピン（荒廃アラート表示） */}
                      <div
                        ref={activePinRef}
                        style={{ top: `${coords.y}%`, left: `${coords.x}%` }}
                        onClick={() => setSelectedArea(area)}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer flex flex-col items-center group"
                      >
                        {/* 荒廃を知らせる琥珀色パルス */}
                        <div className="absolute -inset-2 bg-amber-500/30 rounded-full blur-md animate-ping pointer-events-none" />

                        <div className="relative w-12 h-12 bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 border-2 border-white rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 active:scale-95 transition-transform animate-ruined-alert">
                          <span className="text-xl animate-bounce-subtle">
                            {completedTasksCount === 0 ? ((area.ruinedIcon || "🥀") ? (area.ruinedIcon || "🥀").slice(0, 2) : "🥀") : area.icon}
                          </span>
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                        </div>

                        {/* エリア名ラベル（荒廃時は荒廃名表示） */}
                        <span className="mt-1 px-2.5 py-0.5 bg-amber-950/95 border border-amber-400 text-[10px] font-black text-amber-200 rounded-full shadow-lg flex items-center space-x-1 whitespace-nowrap">
                          {completedTasksCount === 0 ? (
                            <>
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                              <span>{(area.ruinedName || (area.name + " (荒廃)"))}</span>
                            </>
                          ) : (
                            <>
                              <Hammer className="w-2.5 h-2.5 text-amber-400" />
                              <span>{area.name} (修復中)</span>
                            </>
                          )}
                        </span>
                      </div>
                    </>
                  )}

                  {/* ----------------------------------------------------
                      C. 開拓コンプリート: 【完全復活（After）美・命が宿る】
                      ---------------------------------------------------- */}
                  {isCompleted && (
                    <>
                      {/* 各エリアの完全復活建築物・自然オブジェクト */}
                      {area.id === 'stream_entry' && (
                        <div
                          style={{ top: `${coords.y + 3}%`, left: `${coords.x}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none animate-pop-in flex flex-col items-center"
                        >
                          <span className="text-xs">🪨🪵✨ 飛び石と清流</span>
                        </div>
                      )}

                      {area.id === 'small_dam' && (
                        <div
                          style={{ top: `${coords.y + 4}%`, left: `${coords.x}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none animate-pop-in px-2 py-0.5 bg-teal-950/80 border border-teal-400/50 rounded-xl text-[9px] text-teal-200 font-black shadow-md flex items-center space-x-1"
                        >
                          <span>🪵🌊 小枝ダム</span>
                        </div>
                      )}

                      {area.id === 'beaver_lodge' && (
                        <div
                          style={{ top: `${coords.y - 4}%`, left: `${coords.x + 3}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none animate-pop-in flex flex-col items-center"
                        >
                          <span className="text-xl animate-bounce-subtle">🏡💭</span>
                          <span className="text-[8px] bg-amber-950/90 text-amber-200 font-black px-1.5 rounded-full border border-amber-400">
                            温かいロッジ
                          </span>
                        </div>
                      )}

                      {area.id === 'fishing_pier' && (
                        <div
                          style={{ top: `${coords.y + 3}%`, left: `${coords.x - 3}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none animate-pop-in text-sm"
                        >
                          🪵🎣 釣りテラス
                        </div>
                      )}

                      {area.id === 'watermill_zone' && (
                        <div
                          style={{ top: `${coords.y + 3}%`, left: `${coords.x}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none animate-pop-in flex items-center space-x-1 px-2 py-0.5 bg-blue-950/80 border border-blue-400/50 rounded-xl text-[9px] text-blue-200 font-black shadow-md"
                        >
                          <span className="text-base inline-block animate-spin-slow">⚙️</span>
                          <span>水車パン工房</span>
                        </div>
                      )}

                      {area.id === 'flower_garden' && (
                        <div
                          style={{ top: `${coords.y + 2}%`, left: `${coords.x}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none animate-pop-in text-xs flex items-center space-x-1"
                        >
                          <span className="animate-pulse">🌸🌺✨ ホタルの花園</span>
                        </div>
                      )}

                      {area.id === 'emerald_lake' && (
                        <div
                          style={{ top: `${coords.y - 4}%`, left: `${coords.x}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none animate-pop-in flex flex-col items-center"
                        >
                          <span className="text-2xl animate-bounce-subtle">👑🏰✨</span>
                          <span className="text-[8px] bg-purple-950/90 text-purple-200 font-black px-1.5 rounded-full border border-purple-400">
                            桃源郷グランドダム
                          </span>
                        </div>
                      )}

                      {/* コンプリートピン（エメラルドの輝き） */}
                      <div
                        style={{ top: `${coords.y}%`, left: `${coords.x}%` }}
                        onClick={() => setSelectedArea(area)}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer flex flex-col items-center group"
                      >
                        <div className="relative w-11 h-11 bg-gradient-to-tr from-emerald-500 to-teal-400 border-2 border-emerald-200 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 active:scale-95 transition-transform">
                          <span className="text-lg">{area.creature.icon}</span>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center text-[8px] text-white border border-white">
                            🏅
                          </div>
                        </div>

                        <span className="mt-1 px-2 py-0.5 bg-emerald-950/90 border border-emerald-400/60 text-[9px] font-black text-emerald-200 rounded-full shadow-md flex items-center space-x-0.5 whitespace-nowrap">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                          <span>{area.name}</span>
                        </span>
                      </div>
                    </>
                  )}
                </React.Fragment>
              );
            })}

            {/* ========================================================
                開拓コンプリートで戻ってきた生き物たちのアニメーション
                ======================================================== */}
            {areas.map((area) => {
              if (area.status !== 'completed') return null;
              const creature = area.creature;
              const coords = area.mapCoords || { x: 50, y: 50 };

              if (creature.id === 'mallard_duck') {
                return (
                  <div
                    key={creature.id}
                    onClick={() => handleCreatureTap(creature)}
                    style={{ top: `${coords.y + 6}%`, left: `${coords.x - 12}%` }}
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
                    style={{ top: `${coords.y + 2}%`, left: `${coords.x + 12}%` }}
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
                    style={{ top: `${coords.y + 4}%`, left: `${coords.x + 14}%` }}
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
                    style={{ top: `${coords.y - 5}%`, left: `${coords.x + 12}%` }}
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
          </div>
        </div>
      ) : (
        /* リスト詳細ビュー（一覧形式） */
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
                      {isLocked ? '🔒' : isCompleted ? area.icon : ((area.ruinedIcon || "🥀") ? (area.ruinedIcon || "🥀").slice(0, 2) : "🥀")}
                    </span>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-black text-white">
                          {isCompleted ? area.name : (area.ruinedName || (area.name + " (荒廃)"))}
                        </span>
                        {isCompleted && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-md font-bold">
                            復活完了
                          </span>
                        )}
                        {!isLocked && !isCompleted && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-md font-bold flex items-center space-x-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>荒廃中</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {isLocked
                          ? `バッジあと${Math.max(1, area.requiredBadges - badgesCount)}個で霧が晴れる`
                          : isCompleted
                          ? area.description
                          : (area.ruinedDescription || area.description)}
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
                  {selectedArea.status === 'locked_fog'
                    ? '🔒'
                    : selectedArea.status === 'completed'
                    ? selectedArea.icon
                    : selectedArea.ruinedIcon.slice(0, 2)}
                </span>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm font-black text-white">
                      {selectedArea.status === 'completed' ? selectedArea.name : selectedArea.ruinedName}
                    </span>
                    {selectedArea.status === 'completed' ? (
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-bold flex items-center space-x-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>復活完了 🏅</span>
                      </span>
                    ) : selectedArea.status === 'cleared_fog' ? (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-bold flex items-center space-x-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>荒廃中（要復旧）</span>
                      </span>
                    ) : (
                      <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-bold">
                        濃い霧の奥
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {selectedArea.status === 'completed'
                      ? selectedArea.description
                      : selectedArea.ruinedDescription}
                  </p>
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
                <div className="relative w-12 h-12 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-md animate-fog-cloud-1" />
                  <Lock className="w-6 h-6 text-slate-300 relative z-10" />
                </div>
                <h4 className="text-xs font-black text-slate-300">
                  このエリアは濃い朝霧で覆われています
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  手前のエリアを復旧して**バッジを{selectedArea.requiredBadges}個**集めると、この楕円の霧がサーッと晴れて荒廃した川辺が出現します！
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
                  <span>修復・再生タスク</span>
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
                              <span>復旧 (🪵{task.woodCost})</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 戻ってくる生き物プレビュー */}
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
                        {selectedArea.status !== 'completed' && (
                          <span className="ml-1 text-[9px] text-amber-400 bg-amber-500/20 px-1.5 py-0.2 rounded-md">
                            復旧すると戻ってくる
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
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs rounded-xl cursor-pointer"
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
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs rounded-xl"
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
