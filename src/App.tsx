import React, { useState, useEffect } from 'react';
import type { FrontierArea } from './types';
import { STAGES, INITIAL_AREAS } from './data/masterData';
import { FrontierMap } from './components/map/FrontierMap';
import { Match3Board } from './components/puzzle/Match3Board';
import { AreaCompleteModal } from './components/common/AreaCompleteModal';

const STORAGE_KEY = 'beaver_puzzle_state_v1';

export const App: React.FC = () => {
  const [screenMode, setScreenMode] = useState<'map' | 'puzzle'>('map');
  const [currentStageId, setCurrentStageId] = useState<number>(1);
  const [completedAreaModalData, setCompletedAreaModalData] = useState<FrontierArea | null>(null);

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
      // masterDataの最新定義とマージして欠損フィールドを安全に補完
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

  // 自動保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_wood', String(woodPoints));
    localStorage.setItem(STORAGE_KEY + '_areas', JSON.stringify(areas));
    localStorage.setItem(STORAGE_KEY + '_badges', JSON.stringify(badges));
    localStorage.setItem(STORAGE_KEY + '_creatures', JSON.stringify(unlockedCreatures));
  }, [woodPoints, areas, badges, unlockedCreatures]);

  // 開発者用チート・ステージ選択
  const handleSelectStage = (stageId: number) => {
    setCurrentStageId(stageId);
    setScreenMode('puzzle');
  };

  const handleAddWood = (amount: number) => {
    setWoodPoints((prev) => prev + amount);
  };

  const handleUnlockAllAreas = () => {
    setAreas((prev) =>
      prev.map((a) => ({
        ...a,
        status: a.status === 'completed' ? 'completed' : 'cleared_fog',
      }))
    );
  };

  // パズルクリア時の処理
  const handleStageClear = (rewardWood: number, unfogAreaIds: string[]) => {
    // 1. 木材獲得
    setWoodPoints((prev) => prev + rewardWood);

    // 2. 指定エリアの霧を晴らす（locked_fog -> cleared_fog）
    setAreas((prev) =>
      prev.map((area) => {
        if (unfogAreaIds.includes(area.id) && area.status === 'locked_fog') {
          return { ...area, status: 'cleared_fog' };
        }
        return area;
      })
    );

    // 3. 次のステージへ進む
    setCurrentStageId((prev) => Math.min(STAGES.length, prev + 1));

    // 4. マップへ戻る
    setScreenMode('map');
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

    // エリアステータスを completed にし、さらにバッジ条件を満たしたエリアの霧を晴らす！
    setAreas((prev) =>
      prev.map((a) => {
        if (a.id === completedArea.id) {
          return { ...a, status: 'completed' };
        }
        // バッジ数で霧が晴れるエリアの判定
        if (a.status === 'locked_fog' && nextBadgeCount >= a.requiredBadges) {
          return { ...a, status: 'cleared_fog' };
        }
        return a;
      })
    );

    setCompletedAreaModalData(completedArea);
  };

  const currentStage = STAGES.find((s) => s.id === currentStageId) || STAGES[0];

  return (
    <div className="min-h-screen bg-slate-950 font-sans antialiased">
      {/* 画面切り替え */}
      {screenMode === 'map' ? (
        <FrontierMap
          areas={areas}
          woodPoints={woodPoints}
          badgesCount={badges.length}
          creaturesCount={unlockedCreatures.length}
          currentStageId={currentStageId}
          onStartPuzzle={(stageId) => {
            setCurrentStageId(stageId);
            setScreenMode('puzzle');
          }}
          onCompleteTask={handleCompleteTask}
          onCompleteArea={handleCompleteArea}
          onSelectStage={handleSelectStage}
          onAddWood={handleAddWood}
          onUnlockAllAreas={handleUnlockAllAreas}
        />
      ) : (
        <Match3Board
          stage={currentStage}
          onStageClear={handleStageClear}
          onExit={() => setScreenMode('map')}
          currentStageId={currentStageId}
          onSelectStage={handleSelectStage}
          onAddWood={handleAddWood}
          onUnlockAllAreas={handleUnlockAllAreas}
        />
      )}

      {/* エリアコンプリート祝賀モーダル */}
      <AreaCompleteModal
        area={completedAreaModalData}
        onClose={() => setCompletedAreaModalData(null)}
      />
    </div>
  );
};

export default App;
