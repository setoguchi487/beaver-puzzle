import React, { useState, useEffect } from 'react';
import type { FrontierArea, StageRecord, PlayerBoosters } from './types';
import type { StarMilestone } from './data/starRoadMilestones';
import type { DecorationItem } from './data/decorations';
import { getDailyPuzzleStage, getDailyRewardInfo, markDailyClearedToday } from './utils/dailyPuzzle';
import { STAGES, INITIAL_AREAS } from './data/masterData';
import { TitleHomeScreen } from './components/home/TitleHomeScreen';
import { FrontierMap } from './components/map/FrontierMap';
import { Match3Board } from './components/puzzle/Match3Board';
import { AreaDetailScreen } from './components/area/AreaDetailScreen';
import { AreaCompleteModal } from './components/common/AreaCompleteModal';
import { GrandEndingModal } from './components/common/GrandEndingModal';

const STORAGE_KEY = 'beaver_puzzle_state_v1';

export const App: React.FC = () => {
  const [screenMode, setScreenMode] = useState<'title' | 'map' | 'area_detail' | 'puzzle'>('title');
  const [selectedAreaIdForDetail, setSelectedAreaIdForDetail] = useState<string | null>(null);
  const [previousScreenMode, setPreviousScreenMode] = useState<'map' | 'area_detail'>('map');
  const [currentStageId, setCurrentStageId] = useState<number>(1);
  const [completedAreaModalData, setCompletedAreaModalData] = useState<FrontierArea | null>(null);
  const [isGrandEndingOpen, setIsGrandEndingOpen] = useState<boolean>(false);

  // ローカルストレージからの復元
  const [woodPoints, setWoodPoints] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_wood');
    return saved ? Number(saved) : 60; // 初期木材60
  });

  const [areas, setAreas] = useState<FrontierArea[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_areas');
    if (!saved) return INITIAL_AREAS;
    try {
      const parsed: FrontierArea[] = JSON.parse(saved);
      return INITIAL_AREAS.map((def) => {
        const found = parsed.find((p) => p.id === def.id);
        if (!found) return def;
        return {
          ...def,
          status: found.status,
          tasks: def.tasks.map((taskDef) => {
            const savedTask = found.tasks?.find((st) => st.id === taskDef.id);
            return savedTask ? { ...taskDef, isCompleted: savedTask.isCompleted } : taskDef;
          }),
        };
      });
    } catch {
      return INITIAL_AREAS;
    }
  });

  const [badges, setBadges] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_badges');
    return saved ? JSON.parse(saved) : [];
  });

  const [unlockedCreatures, setUnlockedCreatures] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_creatures');
    return saved ? JSON.parse(saved) : [];
  });

  // デイリーパズルプレイ中フラグ
  const [isDailyPlaying, setIsDailyPlaying] = useState<boolean>(false);

  // 所持デコレーションアイテムID
  const [ownedDecorationIds, setOwnedDecorationIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_owned_decorations');
    return saved ? JSON.parse(saved) : ['deco_bench'];
  });

  // 広場配置中デコレーション（最大3個）
  const [activePlacements, setActivePlacements] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_active_decorations');
    return saved ? JSON.parse(saved) : ['deco_bench'];
  });

  // パズルの相棒（バディ）生き物ID
  const [selectedBuddyId, setSelectedBuddyId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_buddy');
    return saved || 'mallard_duck';
  });

  // スターロード受取済みマイルストーン
  const [claimedStarMilestones, setClaimedStarMilestones] = useState<number[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_star_milestones');
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  // 到達・解放済みステージ番号（1〜100）
  const [unlockedStageId, setUnlockedStageId] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_unlocked_stage');
    return saved ? Math.max(1, Number(saved)) : 1;
  });

  // 各ステージのクリア実績・最高獲得スター
  const [stageRecords, setStageRecords] = useState<{ [stageId: number]: StageRecord }>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_stage_records');
    if (!saved) return {};
    try {
      return JSON.parse(saved);
    } catch {
      return {};
    }
  });

  // 累計獲得スター数
  const totalStars = Object.values(stageRecords).reduce((acc, rec) => acc + (rec?.stars || 0), 0);

  // 自動保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_wood', String(woodPoints));
    localStorage.setItem(STORAGE_KEY + '_areas', JSON.stringify(areas));
    localStorage.setItem(STORAGE_KEY + '_badges', JSON.stringify(badges));
    localStorage.setItem(STORAGE_KEY + '_creatures', JSON.stringify(unlockedCreatures));
    localStorage.setItem(STORAGE_KEY + '_unlocked_stage', String(unlockedStageId));
    localStorage.setItem(STORAGE_KEY + '_stage_records', JSON.stringify(stageRecords));
    localStorage.setItem(STORAGE_KEY + '_buddy', selectedBuddyId);
    localStorage.setItem(STORAGE_KEY + '_star_milestones', JSON.stringify(claimedStarMilestones));
    localStorage.setItem(STORAGE_KEY + '_owned_decorations', JSON.stringify(ownedDecorationIds));
    localStorage.setItem(STORAGE_KEY + '_active_decorations', JSON.stringify(activePlacements));
  }, [woodPoints, areas, badges, unlockedCreatures, unlockedStageId, stageRecords, selectedBuddyId, claimedStarMilestones, ownedDecorationIds, activePlacements]);

  // 開発者用チート・ステージ選択
  const handleResetAll = () => {
    localStorage.removeItem(STORAGE_KEY + "_wood");
    localStorage.removeItem(STORAGE_KEY + "_areas");
    localStorage.removeItem(STORAGE_KEY + "_badges");
    localStorage.removeItem(STORAGE_KEY + "_creatures");
    localStorage.removeItem(STORAGE_KEY + "_unlocked_stage");
    localStorage.removeItem(STORAGE_KEY + "_stage_records");
    localStorage.removeItem(STORAGE_KEY + "_buddy");
    localStorage.removeItem(STORAGE_KEY + "_star_milestones");
    localStorage.removeItem(STORAGE_KEY + "_owned_decorations");
    localStorage.removeItem(STORAGE_KEY + "_active_decorations");
    const defaultBoosters = { hammer: 2, saw: 2, tail: 2, clock: 2 };
    localStorage.setItem('beaver_puzzle_boosters', JSON.stringify(defaultBoosters));
    window.dispatchEvent(new CustomEvent('beaver-boosters-updated', { detail: defaultBoosters }));

    setOwnedDecorationIds(['deco_bench']);
    setActivePlacements(['deco_bench']);
    setIsDailyPlaying(false);
    setSelectedBuddyId('mallard_duck');
    setClaimedStarMilestones([]);
    setWoodPoints(60);
    setAreas(INITIAL_AREAS);
    setBadges([]);
    setUnlockedCreatures([]);
    setUnlockedStageId(1);
    setStageRecords({});
    setCurrentStageId(1);
    setSelectedAreaIdForDetail(null);
    setScreenMode("map");
  };

  const handleSelectStage = (stageId: number) => {
    setIsDailyPlaying(false);
    setCurrentStageId(stageId);
    setPreviousScreenMode(screenMode === 'area_detail' ? 'area_detail' : 'map');
    setScreenMode('puzzle');
  };

  const handleAddWood = (amount: number) => {
    setWoodPoints((prev) => prev + amount);
  };

  const handleSetWood = (amount: number) => {
    setWoodPoints(amount);
  };

  const handleResetAreas = () => {
    setAreas(INITIAL_AREAS);
    setBadges([]);
    setUnlockedCreatures([]);
    setSelectedAreaIdForDetail(null);
  };

  // デイリーパズル開始
  const handleStartDailyPuzzle = () => {
    setIsDailyPlaying(true);
    setPreviousScreenMode('map');
    setScreenMode('puzzle');
  };

  // デコレーションのクラフト
  const handleCraftDecoration = (item: DecorationItem) => {
    if (woodPoints < item.woodCost || ownedDecorationIds.includes(item.id)) return;
    setWoodPoints((prev) => prev - item.woodCost);
    setOwnedDecorationIds((prev) => [...prev, item.id]);
    setActivePlacements((prev) => (prev.length < 3 ? [...prev, item.id] : prev));
  };

  // デコレーションの配置切り替え
  const handleTogglePlacement = (itemId: string) => {
    setActivePlacements((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      }
      if (prev.length < 3) {
        return [...prev, itemId];
      }
      return prev;
    });
  };

  // 相棒の選択切り替え
  const handleSelectBuddy = (buddyId: string) => {
    setSelectedBuddyId(buddyId);
  };

  // スターロード報酬の受け取り処理
  const handleClaimStarMilestone = (milestone: StarMilestone) => {
    if (claimedStarMilestones.includes(milestone.starsRequired)) return;

    // 1. 木材ポイント加算
    setWoodPoints((prev) => prev + milestone.rewardWood);

    // 2. お助けアイテム（ブースター）の付与
    if (milestone.boosters) {
      try {
        const savedBoosters = localStorage.getItem('beaver_puzzle_boosters');
        let currentBoosters: PlayerBoosters = savedBoosters
          ? JSON.parse(savedBoosters)
          : { hammer: 2, saw: 2, tail: 2, clock: 2 };

        currentBoosters = {
          hammer: currentBoosters.hammer + (milestone.boosters.hammer || 0),
          saw: currentBoosters.saw + (milestone.boosters.saw || 0),
          tail: currentBoosters.tail + (milestone.boosters.tail || 0),
          clock: currentBoosters.clock + (milestone.boosters.clock || 0),
        };
        localStorage.setItem('beaver_puzzle_boosters', JSON.stringify(currentBoosters));
      } catch (e) {
        console.error('Failed to update boosters:', e);
      }
    }

    // 3. 受取済みフラグの保存
    setClaimedStarMilestones((prev) => [...prev, milestone.starsRequired]);
  };

  const handleUnlockAllAreas = () => {
    setAreas((prev) =>
      prev.map((a) => ({
        ...a,
        status: a.status === 'completed' ? 'completed' : 'cleared_fog',
      }))
    );
    // デバッグ・開発者モード用：全100ステージも解放
    setUnlockedStageId(100);
  };

  // パズルクリア時の処理（木材ポイント獲得 & ★1〜3評価・進捗保存）
  const handleStageClear = (
    rewardWood: number,
    _unfogAreaIds: string[],
    stars: number = 1,
    remainingMoves: number = 0
  ) => {
    if (isDailyPlaying) {
      markDailyClearedToday();
      const dailyReward = getDailyRewardInfo();
      setWoodPoints((prev) => prev + dailyReward.wood);

      if (dailyReward.boosters) {
        try {
          const savedBoosters = localStorage.getItem('beaver_puzzle_boosters');
          let currentBoosters: PlayerBoosters = savedBoosters
            ? JSON.parse(savedBoosters)
            : { hammer: 2, saw: 2, tail: 2, clock: 2 };

          currentBoosters = {
            hammer: currentBoosters.hammer + (dailyReward.boosters.hammer || 0),
            saw: currentBoosters.saw + (dailyReward.boosters.saw || 0),
            tail: currentBoosters.tail + (dailyReward.boosters.tail || 0),
            clock: currentBoosters.clock + (dailyReward.boosters.clock || 0),
          };
          localStorage.setItem('beaver_puzzle_boosters', JSON.stringify(currentBoosters));
        } catch (e) {
          console.error(e);
        }
      }

      setIsDailyPlaying(false);
      setScreenMode('map');
      return;
    }
    // 1. 木材ポイント獲得
    setWoodPoints((prev) => prev + rewardWood);

    // 2. ステージ記録（最高スター数）の更新・保存
    setStageRecords((prev) => {
      const prevRec = prev[currentStageId];
      const bestStars = Math.max(prevRec?.stars || 0, stars);
      const bestRem = Math.max(prevRec?.bestRemainingMoves || 0, remainingMoves);
      return {
        ...prev,
        [currentStageId]: {
          stars: bestStars,
          bestRemainingMoves: bestRem,
          clearedAt: Date.now(),
        },
      };
    });

    // 3. 次のパズルステージへ進行 & 解放ステージ更新
    const nextStage = Math.min(STAGES.length, currentStageId + 1);
    setUnlockedStageId((prev) => Math.max(prev, nextStage));
    setCurrentStageId(nextStage);

    // 4. 元の画面へ戻る
    setScreenMode(previousScreenMode);
  };

  // タスク完了処理
  const handleCompleteTask = (areaId: string, taskId: string, cost: number) => {
    setWoodPoints((prev) => Math.max(0, prev - cost));

    setAreas((prev) =>
      prev.map((area) => {
        if (area.id !== areaId) return area;
        return {
          ...area,
          tasks: area.tasks.map((t) => (t.id === taskId ? { ...t, isCompleted: true } : t)),
        };
      })
    );
  };

  // エリア開拓コンプリート時の処理
  const handleCompleteArea = (completedArea: FrontierArea) => {
    const newBadgeId = completedArea.badge.id;
    const newCreatureId = completedArea.creature.id;

    const nextBadges = badges.includes(newBadgeId) ? badges : [...badges, newBadgeId];
    const nextBadgeCount = nextBadges.length;

    setBadges(nextBadges);
    setUnlockedCreatures((prev) =>
      prev.includes(newCreatureId) ? prev : [...prev, newCreatureId]
    );

    // エリアステータスを completed にし、バッジ条件を満たした次エリアの霧を晴らす！
    setAreas((prev) =>
      prev.map((a) => {
        if (a.id === completedArea.id) {
          return { ...a, status: 'completed' };
        }
        if (a.status === 'locked_fog' && nextBadgeCount >= a.requiredBadges) {
          return { ...a, status: 'cleared_fog' };
        }
        return a;
      })
    );

    // 🎁 エリア復興ボーナス！お助けアイテム全種（🔨🪚🦫⏱️）+1個プレゼント！
    try {
      const savedBoosters = localStorage.getItem('beaver_puzzle_boosters');
      const parsed = savedBoosters
        ? JSON.parse(savedBoosters)
        : { hammer: 2, saw: 2, tail: 2, clock: 2 };
      parsed.hammer = (parsed.hammer || 0) + 1;
      parsed.saw = (parsed.saw || 0) + 1;
      parsed.tail = (parsed.tail || 0) + 1;
      parsed.clock = (parsed.clock || 0) + 1;
      localStorage.setItem('beaver_puzzle_boosters', JSON.stringify(parsed));
    } catch (e) {
      console.error(e);
    }

    setCompletedAreaModalData(completedArea);

    // 全15エリア制覇判定
    const completedCount = areas.filter(
      (a) => a.id === completedArea.id || a.status === 'completed'
    ).length;
    if (completedCount >= areas.length) {
      setTimeout(() => {
        setIsGrandEndingOpen(true);
      }, 1800);
    }
  };

  const handleReloadState = () => {
    const savedWood = localStorage.getItem(STORAGE_KEY + '_wood');
    setWoodPoints(savedWood ? Number(savedWood) : 60);

    const savedAreas = localStorage.getItem(STORAGE_KEY + '_areas');
    if (savedAreas) {
      try {
        const parsed: FrontierArea[] = JSON.parse(savedAreas);
        setAreas(INITIAL_AREAS.map((def) => {
          const found = parsed.find((p) => p.id === def.id);
          if (!found) return def;
          return {
            ...def,
            status: found.status,
            tasks: def.tasks.map((taskDef) => {
              const savedTask = found.tasks?.find((st) => st.id === taskDef.id);
              return savedTask ? { ...taskDef, isCompleted: savedTask.isCompleted } : taskDef;
            }),
          };
        }));
      } catch {}
    }

    const savedBadges = localStorage.getItem(STORAGE_KEY + '_badges');
    setBadges(savedBadges ? JSON.parse(savedBadges) : []);

    const savedCreatures = localStorage.getItem(STORAGE_KEY + '_creatures');
    setUnlockedCreatures(savedCreatures ? JSON.parse(savedCreatures) : []);

    const savedStage = localStorage.getItem(STORAGE_KEY + '_unlocked_stage');
    setUnlockedStageId(savedStage ? Number(savedStage) : 1);

    const savedRecords = localStorage.getItem(STORAGE_KEY + '_stage_records');
    setStageRecords(savedRecords ? JSON.parse(savedRecords) : {});

    const savedBuddy = localStorage.getItem(STORAGE_KEY + '_buddy');
    if (savedBuddy) setSelectedBuddyId(savedBuddy);

    const savedMilestones = localStorage.getItem(STORAGE_KEY + '_star_milestones');
    setClaimedStarMilestones(savedMilestones ? JSON.parse(savedMilestones) : []);

    const savedOwnedDeco = localStorage.getItem(STORAGE_KEY + '_owned_decorations');
    setOwnedDecorationIds(savedOwnedDeco ? JSON.parse(savedOwnedDeco) : ['deco_bench']);

    const savedActiveDeco = localStorage.getItem(STORAGE_KEY + '_active_decorations');
    setActivePlacements(savedActiveDeco ? JSON.parse(savedActiveDeco) : ['deco_bench']);
  };

  const handleNavigateToAreaDetail = (areaId: string) => {
    setSelectedAreaIdForDetail(areaId);
    setScreenMode('area_detail');
  };

  const currentStage = isDailyPlaying ? getDailyPuzzleStage() : (STAGES.find((s) => s.id === currentStageId) || STAGES[0]);
  const activeDetailArea = areas.find((a) => a.id === selectedAreaIdForDetail) || areas[0];

  return (
    <div className="min-h-screen bg-slate-950 font-sans antialiased">
      {/* タイトル画面（起動時スタートホーム画面） */}
      {screenMode === 'title' && (
        <TitleHomeScreen
          onStartGame={() => setScreenMode('map')}
          onReloadState={handleReloadState}
        />
      )}

      {/* 画面切り替え */}
      {screenMode === 'map' && (
        <FrontierMap
          onGoToHome={() => setScreenMode('title')}
          areas={areas}
          woodPoints={woodPoints}
          badgesCount={badges.length}
          creaturesCount={unlockedCreatures.length}
          badges={badges}
          unlockedCreatures={unlockedCreatures}
          unlockedStageId={unlockedStageId}
          stageRecords={stageRecords}
          totalStars={totalStars}
          selectedBuddyId={selectedBuddyId}
          onSelectBuddy={handleSelectBuddy}
          claimedStarMilestones={claimedStarMilestones}
          onClaimStarMilestone={handleClaimStarMilestone}
          ownedDecorationIds={ownedDecorationIds}
          activePlacements={activePlacements}
          onCraftDecoration={handleCraftDecoration}
          onTogglePlacement={handleTogglePlacement}
          onStartDailyPuzzle={handleStartDailyPuzzle}
          currentStageId={currentStageId}
          onStartPuzzle={(stageId) => {
            setCurrentStageId(stageId);
            setPreviousScreenMode('map');
            setScreenMode('puzzle');
          }}
          onCompleteTask={handleCompleteTask}
          onCompleteArea={handleCompleteArea}
          onSelectStage={handleSelectStage}
          onAddWood={handleAddWood}
          onSetWood={handleSetWood}
          onUnlockAllAreas={handleUnlockAllAreas}
          onResetAreas={handleResetAreas}
          onResetAll={handleResetAll}
          onNavigateToAreaDetail={handleNavigateToAreaDetail}
        />
      )}

      {screenMode === 'area_detail' && (
        <AreaDetailScreen
          key={activeDetailArea.id}
          area={activeDetailArea}
          woodPoints={woodPoints}
          onCompleteTask={handleCompleteTask}
          onCompleteArea={handleCompleteArea}
          onBackToMap={() => setScreenMode('map')}
          onStartPuzzle={() => {
            setPreviousScreenMode('area_detail');
            setScreenMode('puzzle');
          }}
          currentStageId={currentStageId}
          onSelectStage={handleSelectStage}
          onAddWood={handleAddWood}
          onSetWood={handleSetWood}
          onUnlockAllAreas={handleUnlockAllAreas}
          onResetAreas={handleResetAreas}
          onResetAll={handleResetAll}
          areas={areas}
          totalStars={totalStars}
        />
      )}

      {screenMode === 'puzzle' && (
        <Match3Board
          key={currentStage.id}
          stage={currentStage}
          onStageClear={handleStageClear}
          onExit={() => setScreenMode(previousScreenMode)}
          currentStageId={currentStageId}
          selectedBuddyId={selectedBuddyId}
          onSelectStage={handleSelectStage}
          onAddWood={handleAddWood}
          onSetWood={handleSetWood}
          onUnlockAllAreas={handleUnlockAllAreas}
          onResetAreas={handleResetAreas}
          onResetAll={handleResetAll}
        />
      )}

      {/* エリアコンプリート祝賀モーダル */}
      <AreaCompleteModal
        area={completedAreaModalData}
        onClose={() => setCompletedAreaModalData(null)}
      />

      {/* 祝・全15エリア完全制覇 大団円グランドフィナーレモーダル */}
      {isGrandEndingOpen && (
        <GrandEndingModal
          areas={areas}
          onClose={() => setIsGrandEndingOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
