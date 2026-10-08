import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Sparkles, 
  RotateCcw, 
  Copy, 
  Check, 
  HelpCircle, 
  ShieldCheck, 
  Download, 
  Upload, 
  Volume2, 
  VolumeX, 
  X,
  Star,
} from 'lucide-react';
import { sounds } from '../../utils/soundEffects';
import { getAssetUrl } from '../../utils/assetPath';
import { 
  getSaveDataSummary, 
  exportSaveDataString, 
  importSaveDataString,
  type SaveDataSummary
} from '../../utils/saveDataManager';

interface TitleHomeScreenProps {
  onStartGame: () => void;
  onReloadState: () => void;
}

export const TitleHomeScreen: React.FC<TitleHomeScreenProps> = ({
  onStartGame,
  onReloadState,
}) => {
  const [summary, setSummary] = useState<SaveDataSummary>(() => getSaveDataSummary());
  const [isMuted, setIsMuted] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isHowToPlayModalOpen, setIsHowToPlayModalOpen] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [importCodeInput, setImportCodeInput] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState<string | null>(null);

  // 隠しコマンド（タイトル画面のビーバーアイコン5連続タップ）
  const [tapCount, setTapCount] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

  useEffect(() => {
    setSummary(getSaveDataSummary());
  }, []);

  const handleStart = () => {
    sounds.playWoodPlank();
    onStartGame();
  };

  const handleForceUpdate = async () => {
    if (window.confirm("最新バージョンに更新しますか？\n※ゲームデータは保持されたまま、最新の画像とプログラムを再取得します。")) {
      try {
        if ("caches" in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((name) => caches.delete(name)));
        }
        if ("serviceWorker" in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((reg) => reg.unregister()));
        }
        window.location.reload();
      } catch {
        window.location.reload();
      }
    }
  };

  const handleToggleSound = () => {
    const next = sounds.toggleMute();
    setIsMuted(next);
  };

  const handleOpenBackupModal = () => {
    sounds.playButtonClick();
    const code = exportSaveDataString();
    setBackupCode(code);
    setIsCopied(false);
    setImportStatusMessage(null);
    setImportCodeInput('');
    setIsBackupModalOpen(true);
  };

  const handleCopyCode = async () => {
    sounds.playBonusItem();
    try {
      await navigator.clipboard.writeText(backupCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      setIsCopied(true);
    }
  };

  const handleImportCode = () => {
    sounds.playButtonClick();
    const res = importSaveDataString(importCodeInput);
    if (res.success) {
      sounds.playAreaComplete();
      setImportStatusMessage('✅ 復元完了！データを更新しました。');
      setTimeout(() => {
        onReloadState();
        setSummary(getSaveDataSummary());
        setIsBackupModalOpen(false);
      }, 1200);
    } else {
      setImportStatusMessage(`❌ ${res.message}`);
    }
  };

  const handleBeaverIconTap = () => {
    const now = Date.now();
    if (now - lastTapTime < 1000) {
      const nextCount = tapCount + 1;
      setTapCount(nextCount);
      if (nextCount >= 5) {
        sounds.playBonusItem();
        window.dispatchEvent(new CustomEvent('open-beaver-dev-mode'));
        setTapCount(0);
      }
    } else {
      setTapCount(1);
    }
    setLastTapTime(now);
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950/40 text-slate-100 flex flex-col justify-between items-center p-4 sm:p-6 overflow-hidden select-none">
      {/* 背景装飾（波紋・光のエフェクト） */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* トップバー（サウンド切替 & 遊び方ガイド） */}
      <div className="w-full max-w-md flex items-center justify-between z-10 pt-[max(env(safe-area-inset-top,0px),16px)]">
        <button
          onClick={handleToggleSound}
          className="p-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white flex items-center space-x-1.5 backdrop-blur-md cursor-pointer active:scale-95 transition-all shadow-sm"
          title={isMuted ? 'サウンドをONにする' : 'ミュートにする'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          )}
          <span className="text-xs font-bold">{isMuted ? '消音' : 'BGM/効果音'}</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              sounds.playButtonClick();
              setIsHowToPlayModalOpen(true);
            }}
            className="p-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white flex items-center space-x-1.5 backdrop-blur-md cursor-pointer active:scale-95 transition-all shadow-sm"
            title="遊び方を見る"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold">遊び方</span>
          </button>

          <button
            onClick={handleOpenBackupModal}
            className="p-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white flex items-center space-x-1.5 backdrop-blur-md cursor-pointer active:scale-95 transition-all shadow-sm"
            title="セーブデータのバックアップ・引継ぎ"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold">引継ぎ</span>
          </button>
        </div>
      </div>

      {/* 中央メインロゴ & キャラクタービジュアル */}
      <div className="flex-1 flex flex-col items-center justify-center text-center z-10 my-4 max-w-md w-full">
        {/* アイコン（隠しコマンドトリガー） */}
        <div 
          onClick={handleBeaverIconTap}
          className="relative cursor-pointer group active:scale-95 transition-transform"
          title="ふたりビーバー棟梁"
        >
          <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-yellow-300 to-emerald-400 shadow-2xl relative">
            <img
              src={getAssetUrl("/assets/beaver_hero.jpg")}
              alt="ビーバー棟梁"
              className="w-full h-full object-cover rounded-full border-4 border-slate-950 shadow-inner group-hover:scale-102 transition-transform"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full shadow-lg border-2 border-slate-900 flex items-center space-x-1">
            <span>🦫</span>
            <span>🪵</span>
          </div>
        </div>

        {/* ゲームタイトル */}
        <div className="mt-5 space-y-1">
          <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[11px] font-black tracking-wider uppercase mb-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>開拓パズルアドベンチャー</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-100 to-amber-300 tracking-tight drop-shadow-md">
            ふたりビーバーの<br />ダム開拓パズル
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 font-medium">
            荒れた渓流を大復興！15のエリアを仲間と蘇らせよう
          </p>
        </div>

        {/* プレイヤー進捗サマリーカード */}
        <div className="mt-6 w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2 mb-2">
            <span className="text-slate-400 font-bold">現在の冒険状況</span>
            <span className="text-amber-400 font-black flex items-center space-x-1">
              <span>所持木材:</span>
              <span className="text-white text-sm">{summary.wood.toLocaleString()}</span>
              <span>🪵</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/50">
              <span className="text-[10px] text-slate-400 block font-medium">開拓エリア</span>
              <span className="text-sm font-black text-emerald-400">
                {summary.clearedAreasCount} / {summary.totalAreasCount}
              </span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/50">
              <span className="text-[10px] text-slate-400 block font-medium">獲得した星</span>
              <span className="text-sm font-black text-amber-400 flex items-center justify-center space-x-0.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{summary.totalStars}</span>
              </span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/50">
              <span className="text-[10px] text-slate-400 block font-medium">出会った仲間</span>
              <span className="text-sm font-black text-cyan-400">
                {summary.creaturesCount} 匹
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* フッターアクション（スタートボタン） */}
      <div className="w-full max-w-md space-y-3 z-10 pb-4">
        <button
          onClick={handleStart}
          className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-lg rounded-2xl shadow-xl shadow-amber-500/25 border-2 border-white/80 flex items-center justify-center space-x-2 active:scale-98 transition-all cursor-pointer ring-4 ring-amber-500/20 animate-pulse-slow"
        >
          <Play className="w-6 h-6 fill-slate-950" />
          <span>
            {summary.isExistingPlayer
              ? `冒険をつづける（Stage ${summary.unlockedStage}〜）`
              : 'ダム開拓の旅へ 出発！🪵'}
          </span>
        </button>

        <div className="flex items-center justify-between pt-1 px-1">
          <span className="text-[10px] font-bold text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-full border border-slate-800">
            ✨ Ver 1.2.0 (手描きドロップ対応)
          </span>
          <button
            onClick={handleForceUpdate}
            className="text-[10px] font-bold text-amber-300 hover:text-amber-200 bg-slate-900/90 hover:bg-slate-850 px-2.5 py-1 rounded-full border border-amber-500/40 flex items-center space-x-1 active:scale-95 transition-transform cursor-pointer"
            title="最新版にキャッシュを更新"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>最新版に更新 🔄</span>
          </button>
        </div>

        <div className="text-center pb-[max(env(safe-area-inset-bottom,0px),8px)]">
          <p className="text-[10px] text-slate-500">
            © ふたりビーバーのダム開拓パズル • PWAオフライン対応
          </p>
        </div>
      </div>

      {/* セーブデータ引継ぎ・バックアップモーダル */}
      {isBackupModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
          onClick={() => setIsBackupModalOpen(false)}
        >
          <div 
            className="bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl text-slate-100 ring-4 ring-amber-500/20 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-amber-400">
                  セーブデータの引継ぎ・保存
                </h3>
              </div>
              <button
                onClick={() => setIsBackupModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              進捗データはブラウザに自動保存されますが、別の端末に引き継ぐ際や万が一のバックアップとしてコードを保存できます。
            </p>

            {/* エクスポート（書き出し） */}
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-black text-amber-300 flex items-center space-x-1.5">
                <Download className="w-3.5 h-3.5" />
                <span>現在のデータを書き出す（バックアップ）</span>
              </span>
              <p className="text-[11px] text-slate-400">
                この引継ぎコードをコピーしてメモ帳等に控えておくと、どの端末でも復元できます。
              </p>
              <div className="relative">
                <textarea
                  readOnly
                  value={backupCode}
                  className="w-full h-16 bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono p-2 rounded-xl resize-none focus:outline-hidden"
                />
              </div>
              <button
                onClick={handleCopyCode}
                className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-md active:scale-98 transition-all cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-950 stroke-[3]" />
                    <span>クリップボードにコピーしました！✨</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>引継ぎコードをコピーする 📋</span>
                  </>
                )}
              </button>
            </div>

            {/* インポート（読み込み） */}
            <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-black text-cyan-300 flex items-center space-x-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>引継ぎコードからデータを復元する</span>
              </span>
              <textarea
                placeholder="コピーした引継ぎコードをここに貼り付け..."
                value={importCodeInput}
                onChange={(e) => setImportCodeInput(e.target.value)}
                className="w-full h-16 bg-slate-900 border border-slate-800 text-[10px] text-slate-200 font-mono p-2 rounded-xl resize-none focus:border-cyan-400 focus:outline-hidden"
              />
              {importStatusMessage && (
                <p className="text-xs font-bold text-center text-amber-300 animate-pulse">
                  {importStatusMessage}
                </p>
              )}
              <button
                onClick={handleImportCode}
                disabled={!importCodeInput.trim()}
                className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-black text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-md active:scale-98 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>データを復元して読み込む 🔄</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 遊び方ガイドモーダル */}
      {isHowToPlayModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
          onClick={() => setIsHowToPlayModalOpen(false)}
        >
          <div 
            className="bg-slate-900 border-2 border-cyan-500/60 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl text-slate-100 ring-4 ring-cyan-500/20 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-cyan-400">
                  ゲームの遊び方 🦫🪵
                </h3>
              </div>
              <button
                onClick={() => setIsHowToPlayModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-1">
                <h4 className="font-black text-amber-400 flex items-center space-x-1">
                  <span>1. マッチ3パズルで木材を集めよう！</span>
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  同じ種類の木材ピースをタテ・ヨコに3つ以上揃えて消しましょう！
                  4個消しで「ロケット」、L字・T字で「ボム」、5個消しで「レインボースピナー」が発動します。
                </p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-1">
                <h4 className="font-black text-emerald-400 flex items-center space-x-1">
                  <span>2. 集めた丸太で15のエリアを復興！</span>
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  パズルで獲得した丸太を使って、土砂の撤去やダムの建築タスクを進めましょう。
                  エリアを完成させると霧が晴れ、森の仲間たちが帰ってきます！
                </p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-1">
                <h4 className="font-black text-cyan-400 flex items-center space-x-1">
                  <span>3. 相棒スキル＆日替わりパズル</span>
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  集めた仲間を「相棒」に指名すると、パズル中に強力なサポートスキルを発動してくれます。
                  毎日の「日替わりパズル」や「木工デコレーション」も楽しめます！
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsHowToPlayModalOpen(false)}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs rounded-xl transition-all cursor-pointer"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
