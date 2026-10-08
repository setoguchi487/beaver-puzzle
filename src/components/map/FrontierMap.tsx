import React, { useState, useEffect, useRef } from 'react';
import type { FrontierArea, Creature } from '../../types';
import { DevStageSelector } from '../common/DevStageSelector';
import { CreatureBadgeModal } from '../common/CreatureBadgeModal';
import { StageSelectModal } from '../common/StageSelectModal';
import { StarRoadModal } from '../common/StarRoadModal';
import { DailyPuzzleModal } from '../common/DailyPuzzleModal';
import { DecorationModal } from '../common/DecorationModal';
import { type DecorationItem } from '../../data/decorations';
import { Calendar } from 'lucide-react';
import type { StarMilestone } from '../../data/starRoadMilestones';
import type { StageRecord } from '../../types';
import { Star } from 'lucide-react';
import { sounds } from '../../utils/soundEffects';
import { getAssetUrl } from '../../utils/assetPath';
import { preloadImages } from '../../utils/imagePreloader';
import {
  Home,
  Lock,
  CheckCircle2,
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
  onGoToHome?: () => void;
  areas: FrontierArea[];
  woodPoints: number;
  badgesCount: number;
  creaturesCount: number;
  badges?: string[];
  unlockedCreatures?: string[];
  unlockedStageId?: number;
  stageRecords?: { [stageId: number]: StageRecord };
  totalStars?: number;
  selectedBuddyId?: string;
  onSelectBuddy?: (buddyId: string) => void;
  claimedStarMilestones?: number[];
  onClaimStarMilestone?: (milestone: StarMilestone) => void;
  ownedDecorationIds?: string[];
  activePlacements?: string[];
  onCraftDecoration?: (item: DecorationItem) => void;
  onTogglePlacement?: (itemId: string) => void;
  onStartDailyPuzzle?: () => void;
  onStartPuzzle: (stageId: number) => void;
  onCompleteTask: (areaId: string, taskId: string, cost: number) => void;
  onCompleteArea: (area: FrontierArea) => void;
  currentStageId: number;
  onSelectStage: (stageId: number) => void;
  onAddWood: (amount: number) => void;
  onSetWood?: (amount: number) => void;
  onUnlockAllAreas: () => void;
  onResetAreas?: () => void;
  onResetAll?: () => void;
  onNavigateToAreaDetail?: (areaId: string) => void;
}

export const FrontierMap: React.FC<FrontierMapProps> = ({
  onGoToHome,
  areas,
  woodPoints,
  badgesCount,
  creaturesCount,
  badges = [],
  unlockedCreatures = [],
  unlockedStageId = 1,
  stageRecords = {},
  totalStars = 0,
  selectedBuddyId = 'mallard_duck',
  onSelectBuddy,
  claimedStarMilestones = [],
  onClaimStarMilestone,
  ownedDecorationIds = [],
  activePlacements = [],
  onCraftDecoration,
  onTogglePlacement,
  onStartDailyPuzzle,
  onStartPuzzle,
  onCompleteTask,
  onCompleteArea,
  currentStageId,
  onSelectStage,
  onAddWood,
  onSetWood,
  onUnlockAllAreas,
  onResetAreas,
  onResetAll,
  onNavigateToAreaDetail,
}) => {
  const [viewMode, setViewMode] = useState<'panorama' | 'list'>('panorama');
  const [selectedArea, setSelectedArea] = useState<FrontierArea | null>(null);
  const [selectedCreature, setSelectedCreature] = useState<Creature | null>(null);
  const [creatureReaction, setCreatureReaction] = useState<string | null>(null);
  const [beaverDialogue, setBeaverDialogue] = useState<string | null>(null);
  const [isBookModalOpen, setIsBookModalOpen] = useState<boolean>(false);
  const [isStageSelectOpen, setIsStageSelectOpen] = useState<boolean>(false);
  const [isStarRoadOpen, setIsStarRoadOpen] = useState<boolean>(false);
  const [isDailyModalOpen, setIsDailyModalOpen] = useState<boolean>(false);
  const [isDecoModalOpen, setIsDecoModalOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());

  const mapScrollRef = useRef<HTMLDivElement>(null);
  const activePinRef = useRef<HTMLDivElement>(null);

  // マップ表示時に環境音（せせらぎ & 小鳥）を開始
  // 開拓中・解放済みエリアの画像をバックグラウンドで先行読み込み（切り替え高速化）
  useEffect(() => {
    const unlockedAreas = areas.filter((a) => a.status !== 'locked_fog');
    unlockedAreas.forEach((a) => {
      if (a.detailImages) {
        preloadImages(a.detailImages.map((img) => getAssetUrl(img)));
      }
    });
  }, [areas]);

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

  void onCompleteTask;
  void onCompleteArea;

  const handleCreatureTap = (c: Creature) => {
    setSelectedCreature(c);
    const reactions = [
      'ピィッ！♪', 'クエックエッ✨', 'るんるん❤️', 'カリカリ…🌰',
      'パタパタ〜🌿', 'グルル〜♪', 'ホーホー🦉✨', 'キィキィ〜！🐒',
      'クワッ！🦢', 'ガサゴソ🦝', 'コンコン🦊✨', 'ガオーッ！🐻'
    ];
    setCreatureReaction(reactions[Math.floor(Math.random() * reactions.length)]);
    setTimeout(() => setCreatureReaction(null), 2200);
  };

  const [beaverTapCount, setBeaverTapCount] = useState<number>(0);
  const lastBeaverTapTimeRef = useRef<number>(0);

  const handleBeaverTap = () => {
    const now = Date.now();
    let nextCount = 1;
    if (now - lastBeaverTapTimeRef.current < 2000) {
      nextCount = beaverTapCount + 1;
    }
    setBeaverTapCount(nextCount);
    lastBeaverTapTimeRef.current = now;

    if (nextCount >= 5) {
      sounds.playBonusItem();
      window.dispatchEvent(new CustomEvent('open-beaver-dev-mode'));
      setBeaverDialogue('🛠️ 秘密の開発者モードを起動したよ！✨');
      setTimeout(() => setBeaverDialogue(null), 3000);
      setBeaverTapCount(0);
      return;
    }

    const dialogues = [
      '丸太を集めて、ふんわりとした雲の奥を開拓しよう！🦫✨',
      'エリアを1つ復活させるとバッジが手に入り、次の巨大な雲が晴れるよ！🏅',
      '荒廃した川辺を修復すると、森の仲間たちがどんどん戻ってくるよ！🦆🐟',
      '全15エリアの最上流には、伝説の「ビーバーの桃源郷」が待っているよ！👑',
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
                src={getAssetUrl("/assets/beaver_hero.jpg")}
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

          {/* ホーム・日替わり・クラフト・サウンド・Devセレクター */}
          <div className="flex items-center space-x-1.5">
            {onGoToHome && (
              <button
                onClick={onGoToHome}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg bg-slate-800/80 border border-slate-700 active:scale-95 transition-all cursor-pointer"
                title="タイトル画面へ戻る"
              >
                <Home className="w-3.5 h-3.5 text-amber-300" />
              </button>
            )}
            {/* 日替わりパズルボタン */}
            <button
              onClick={() => setIsDailyModalOpen(true)}
              className="px-2 py-1 bg-gradient-to-r from-cyan-500/25 to-blue-500/25 hover:from-cyan-500/35 hover:to-blue-500/35 border border-cyan-400/50 text-cyan-300 rounded-xl text-[10px] font-black flex items-center space-x-1 shadow-xs active:scale-95 transition-all cursor-pointer"
              title="日替わり渓流パズルを開く"
            >
              <Calendar className="w-3 h-3 text-cyan-400" />
              <span>日替わり</span>
            </button>

            {/* クラフト・デコレーションボタン */}
            <button
              onClick={() => setIsDecoModalOpen(true)}
              className="px-2 py-1 bg-gradient-to-r from-emerald-500/25 to-teal-500/25 hover:from-emerald-500/35 hover:to-teal-500/35 border border-emerald-400/50 text-emerald-300 rounded-xl text-[10px] font-black flex items-center space-x-1 shadow-xs active:scale-95 transition-all cursor-pointer"
              title="木工デコレーション工房を開く"
            >
              <Hammer className="w-3 h-3 text-emerald-400" />
              <span>クラフト</span>
            </button>
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
              onSetWood={onSetWood}
              onUnlockAllAreas={onUnlockAllAreas}
              onResetAreas={onResetAreas}
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

            {/* 獲得星数カウンター（タップでステージ選択を開く） */}
            <button
              onClick={() => setIsStageSelectOpen(true)}
              className="flex items-center space-x-1.5 bg-yellow-950/45 hover:bg-yellow-900/60 border border-yellow-500/45 hover:border-yellow-400 px-2.5 py-1 rounded-xl cursor-pointer active:scale-95 transition-all shadow-xs"
              title="獲得スター数（タップでステージ選択へ）"
            >
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-300" />
              <span className="text-yellow-300 font-mono text-xs font-black">{totalStars}</span>
              <span className="text-[10px] text-yellow-500/80 font-bold">/300</span>
            </button>

            {/* 仲間・勲章図鑑ボタン（メダル・生き物・図鑑を集約） */}
            <button
              onClick={() => setIsBookModalOpen(true)}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-950/60 to-teal-950/60 hover:from-emerald-900/70 hover:to-teal-900/70 border border-emerald-500/45 hover:border-emerald-400 px-2.5 py-1 rounded-xl cursor-pointer active:scale-95 transition-all shadow-xs"
              title="仲間と勲章の図鑑を開く"
            >
              <span className="text-xs">🐾🏅</span>
              <span className="text-emerald-300 font-mono text-xs font-black">
                {creaturesCount}/{areas.length}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold hidden sm:inline">図鑑</span>
            </button>
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
        /* パノラマ箱庭自然マップビュー (15エリア探索用の縦長スケール: min-h-1400px) */
        <div
          ref={mapScrollRef}
          className="relative w-full overflow-y-auto no-scrollbar scroll-smooth"
          style={{ maxHeight: 'calc(100vh - 140px)' }}
        >
          <div className="relative w-full aspect-[9/16] min-h-[760px] bg-slate-900 select-none">
            {/* メイン自然俯瞰背景 */}
            <img
              src={getAssetUrl("/assets/river_map.jpg")}
              alt="川と森のパノラママップ"
              className="w-full h-full object-cover"
            />

            {/* 水面のきらめきエフェクト */}
            <div className="absolute top-[52%] left-[45%] w-14 h-14 bg-white/20 rounded-full blur-md animate-water-shimmer pointer-events-none" />
            <div className="absolute top-[82%] left-[55%] w-20 h-20 bg-cyan-200/20 rounded-full blur-lg animate-water-shimmer pointer-events-none" />

            {/* ========================================================
                全15エリアの「完全不透明・超巨大楕円雲海」「荒廃」「復活パーツ」
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
                      A. 未踏エリア: 【完全不透明（100%遮断）＆超巨大楕円雲塊】
                      ---------------------------------------------------- */}
                  {isLocked && (
                    <div
                      style={{ top: `${coords.y}%`, left: `${coords.x}%` }}
                      onClick={() => setSelectedArea(area)}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-25 cursor-pointer flex flex-col items-center group"
                    >
                      {/* AI生成した絵本調のふんわり巨大雲塊イラスト (完全目隠し・世界観連動) */}
                      <div className="relative w-64 h-48 flex items-center justify-center pointer-events-none select-none">
                        {/* 雲のイラスト (中央は100%ソリッド不透明で完全に目隠し) */}
                        <img
                          src={getAssetUrl("/assets/fog_cloud.png")}
                          alt="朝霧の雲"
                          className="w-full h-full object-contain filter drop-shadow-2xl animate-fog-cloud-1"
                        />

                        {/* 雲の中央に浮かぶロック標識 */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto group-hover:scale-105 active:scale-95 transition-transform">
                          <div className="w-9 h-9 rounded-full bg-slate-900/95 border-2 border-amber-400 flex items-center justify-center shadow-2xl">
                            <Lock className="w-4 h-4 text-amber-300" />
                          </div>
                          <span className="mt-1 px-2.5 py-0.5 bg-slate-950/90 backdrop-blur-xs border border-slate-700 text-[8px] font-black text-slate-200 rounded-full shadow-2xl whitespace-nowrap">
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
                      {/* 荒廃時のマップ上ビジュアル（泥水、倒木、崩れたガレキ） */}
                      {completedTasksCount === 0 && (
                        <div
                          style={{ top: `${coords.y + 3}%`, left: `${coords.x}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none flex flex-col items-center animate-fade-in"
                        >
                          <div className="w-16 h-8 bg-amber-950/70 rounded-[50%] blur-xs border border-amber-900/50" />
                          <span className="text-xs opacity-90 -mt-3 filter drop-shadow-md">
                            {area.ruinedIcon?.slice(0, 2) || '🥀'}
                          </span>
                        </div>
                      )}

                      {/* タスク1完了時: 半復旧パーツ */}
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

                      {/* 開拓ピン（荒廃アラート表示） */}
                      <div
                        ref={activePinRef}
                        style={{ top: `${coords.y}%`, left: `${coords.x}%` }}
                        onClick={() => setSelectedArea(area)}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer flex flex-col items-center group"
                      >
                        <div className="absolute -inset-2 bg-amber-500/30 rounded-full blur-md animate-ping pointer-events-none" />

                        <div className="relative w-12 h-12 bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 border-2 border-white rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 active:scale-95 transition-transform animate-ruined-alert">
                          <span className="text-xl animate-bounce-subtle">
                            {completedTasksCount === 0 ? (area.ruinedIcon ? area.ruinedIcon.slice(0, 2) : '🥀') : area.icon}
                          </span>
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                        </div>

                        {/* エリア名ラベル */}
                        <span className="mt-1 px-2.5 py-0.5 bg-amber-950/95 border border-amber-400 text-[10px] font-black text-amber-200 rounded-full shadow-lg flex items-center space-x-1 whitespace-nowrap">
                          {completedTasksCount === 0 ? (
                            <>
                              <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                              <span>{area.ruinedName || area.name}</span>
                            </>
                          ) : (
                            <>
                              <Hammer className="w-2.5 h-2.5 text-amber-400" />
                              <span>{area.name} ({completedTasksCount}/5)</span>
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
                開拓完了した生き物たちのダイナミック活動演出
                ======================================================== */}
            {areas.map((area) => {
              if (area.status !== 'completed') return null;
              const creature = area.creature;
              const coords = area.mapCoords || { x: 50, y: 50 };

              return (
                <div
                  key={creature.id}
                  onClick={() => handleCreatureTap(creature)}
                  style={{ top: `${coords.y + 4}%`, left: `${coords.x + 8}%` }}
                  className="absolute z-15 cursor-pointer animate-creature-hop"
                  title={creature.name}
                >
                  <span className="text-2xl filter drop-shadow-md inline-block">
                    {creature.icon}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* リスト詳細ビュー（一覧形式: 全15エリア） */
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
                      {isLocked ? '🔒' : isCompleted ? area.icon : (area.ruinedIcon ? area.ruinedIcon.slice(0, 2) : '🥀')}
                    </span>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-black text-white">
                          {isCompleted ? area.name : (area.ruinedName || area.name)}
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
                          ? `バッジあと${Math.max(1, area.requiredBadges - badgesCount)}個で新エリア開放`
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

      {/* 3. エリア詳細ボトムシート（エリアタップ時に開く） */}
      {selectedArea && (() => {
        const completedTasksCount = selectedArea.tasks.filter((t) => t.isCompleted).length;
        const totalTasksCount = selectedArea.tasks.length || 5;
        const isLocked = selectedArea.status === 'locked_fog';
        const isCompleted = selectedArea.status === 'completed';

        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 backdrop-blur-xs animate-fade-in">
            <div className="w-full max-w-md bg-slate-900 border-t-2 border-amber-500/80 rounded-t-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto no-scrollbar animate-pop-in">
              {/* ヘッダー */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl p-2.5 bg-slate-800 rounded-2xl border border-slate-700">
                    {isLocked
                      ? '🔒'
                      : isCompleted
                      ? selectedArea.icon
                      : (selectedArea.ruinedIcon ? selectedArea.ruinedIcon.slice(0, 2) : '🥀')}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-black text-amber-400">
                        エリア {selectedArea.id}
                      </span>
                      {isCompleted ? (
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center space-x-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>復活完了 🏅</span>
                        </span>
                      ) : !isLocked ? (
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold flex items-center space-x-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>荒廃中（要修復）</span>
                        </span>
                      ) : (
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                          雲に覆われています
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-white mt-0.5">
                      {isCompleted
                        ? selectedArea.name
                        : (selectedArea.ruinedName || selectedArea.name)}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedArea(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. ロック中の説明 */}
              {isLocked ? (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-center space-y-3">
                  <div className="relative w-20 h-14 mx-auto flex items-center justify-center">
                    <img
                      src={getAssetUrl("/assets/fog_cloud.png")}
                      alt="雲"
                      className="w-full h-full object-contain filter drop-shadow-md animate-fog-cloud-1"
                    />
                    <Lock className="w-6 h-6 text-amber-300 absolute z-10" />
                  </div>
                  <h4 className="text-sm font-black text-slate-200">
                    エリア {selectedArea.id} はまだ雲で覆われています
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    手前のエリアをきれいに復旧して**バッジを{selectedArea.requiredBadges}個**集めると、雲が晴れてこのエリアの開拓が始まります！
                  </p>
                  <div className="text-xs font-mono font-bold text-amber-400 bg-amber-950/40 py-2 rounded-xl border border-amber-500/20">
                    現在の獲得バッジ: {badgesCount} / {selectedArea.requiredBadges} 個
                  </div>
                </div>
              ) : (
                /* 2. 開放済み（荒廃または復旧中・完了）の場合：ステージ説明＋進むボタン */
                <div className="space-y-4">
                  {/* ステージ復旧段階ビジュアルプレビュー */}
                  {selectedArea.detailImages && selectedArea.detailImages[completedTasksCount] && (
                    <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-slate-700/80 shadow-md">
                      <img
                        src={getAssetUrl(selectedArea.detailImages[completedTasksCount])}
                        alt={selectedArea.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-950/75 backdrop-blur-xs text-[10px] font-bold text-amber-300 border border-amber-500/30 flex items-center space-x-1">
                        <span>📷 現在の様子</span>
                        <span>({completedTasksCount}/5段階)</span>
                      </div>
                    </div>
                  )}

                  {/* ステージの説明カード */}
                  <div className="p-4 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300 flex items-center space-x-1">
                        <span>📖 ステージの様子</span>
                      </span>
                      <span className="text-[11px] font-black text-amber-400">
                        きれいな場所: {completedTasksCount} / {totalTasksCount} 箇所
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {isCompleted
                        ? selectedArea.description
                        : (selectedArea.ruinedDescription || selectedArea.description)}
                    </p>

                    {/* 修復プログレスバー */}
                    <div className="w-full bg-slate-900/60 h-2 rounded-full overflow-hidden mt-1">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full transition-all duration-500"
                        style={{ width: `${(completedTasksCount / totalTasksCount) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* 戻ってくる生き物の紹介 */}
                  <div
                    onClick={() => handleCreatureTap(selectedArea.creature)}
                    className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-emerald-950/60 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="text-3xl animate-bounce-subtle inline-block">
                        {selectedArea.creature.icon}
                      </span>
                      <div>
                        <div className="text-xs font-black text-emerald-200 flex items-center">
                          <span>{selectedArea.creature.name}</span>
                          {isCompleted ? (
                            <span className="ml-1 text-[9px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded-md">
                              元気に暮らしているよ
                            </span>
                          ) : (
                            <span className="ml-1 text-[9px] text-amber-400 bg-amber-500/20 px-1.5 py-0.2 rounded-md">
                              5箇所きれいにするとやってくる
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

                  {/* エリアに進むボタン */}
                  {onNavigateToAreaDetail && (
                    <button
                      onClick={() => {
                        onNavigateToAreaDetail(selectedArea.id);
                        setSelectedArea(null);
                      }}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:brightness-110 text-amber-950 font-black text-base rounded-2xl shadow-xl flex items-center justify-center space-x-2 active:scale-98 transition-all cursor-pointer"
                    >
                      <Hammer className="w-4 h-4" />
                      <span>エリア{selectedArea.id}に進む</span>
                    </button>
                  )}
                </div>
              )}

              <button
                onClick={() => setSelectedArea(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        );
      })()}

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
          onClick={() => setIsStageSelectOpen(true)}
          className="flex-1 ml-4 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-amber-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 active:scale-98 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 fill-current" />
          <span>ステージ選択へ進む 🗺️</span>
        </button>
      </footer>
      {/* 一般ユーザー向けステージ選択モーダル */}
      {isStageSelectOpen && (
        <StageSelectModal
          unlockedStageId={unlockedStageId || currentStageId}
          currentStageId={currentStageId}
          stageRecords={stageRecords}
          onSelectStage={(sId) => {
            setIsStageSelectOpen(false);
            onStartPuzzle(sId);
          }}
          onOpenStarRoad={() => setIsStarRoadOpen(true)}
          onClose={() => setIsStageSelectOpen(false)}
        />
      )}

      {/* スターロード（星集め報酬）モーダル */}
      {isStarRoadOpen && (
        <StarRoadModal
          totalStars={totalStars}
          claimedMilestones={claimedStarMilestones}
          onClaimMilestone={(m) => {
            if (onClaimStarMilestone) onClaimStarMilestone(m);
          }}
          onClose={() => setIsStarRoadOpen(false)}
        />
      )}

      {/* 日替わりパズルモーダル */}
      {isDailyModalOpen && (
        <DailyPuzzleModal
          onStartDaily={() => {
            setIsDailyModalOpen(false);
            if (onStartDailyPuzzle) onStartDailyPuzzle();
          }}
          onClose={() => setIsDailyModalOpen(false)}
        />
      )}

      {/* 木工デコレーションモーダル */}
      {isDecoModalOpen && (
        <DecorationModal
          woodPoints={woodPoints}
          ownedDecorationIds={ownedDecorationIds}
          activePlacements={activePlacements}
          onCraftDecoration={(item) => {
            if (onCraftDecoration) onCraftDecoration(item);
          }}
          onTogglePlacement={(itemId) => {
            if (onTogglePlacement) onTogglePlacement(itemId);
          }}
          onClose={() => setIsDecoModalOpen(false)}
        />
      )}

      {/* 生き物図鑑＆開拓バッジモーダル（相棒選択対応） */}
      {isBookModalOpen && (
        <CreatureBadgeModal
          areas={areas}
          badges={badges}
          unlockedCreatures={unlockedCreatures}
          woodPoints={woodPoints}
          currentStageId={currentStageId}
          selectedBuddyId={selectedBuddyId}
          onSelectBuddy={onSelectBuddy}
          onClose={() => setIsBookModalOpen(false)}
          onNavigateToArea={(areaId) => {
            setIsBookModalOpen(false);
            if (onNavigateToAreaDetail) {
              onNavigateToAreaDetail(areaId);
            }
          }}
        />
      )}
    </div>
  );
};
