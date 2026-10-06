import { getAssetUrl } from '../../utils/assetPath';
import React, { useEffect } from 'react';
import type { FrontierArea } from '../../types';
import { Crown, Sparkles, Trophy, Heart, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GrandEndingModalProps {
  areas: FrontierArea[];
  onClose: () => void;
}

export const GrandEndingModal: React.FC<GrandEndingModalProps> = ({
  areas,
  onClose,
}) => {
  useEffect(() => {
    // 連続打ち上げ花火・紙吹雪
    const end = Date.now() + 3.5 * 1000;
    const colors = ['#fbbf24', '#f59e0b', '#34d399', '#38bdf8', '#ec4899', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      {/* 黄金の後光回転エフェクト */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-[800px] h-[800px] rounded-full opacity-25 bg-[radial-gradient(circle,rgba(251,191,36,0.9)_0%,rgba(52,211,153,0.5)_40%,transparent_70%)] animate-sunburst" />
      </div>

      <div
        className="w-full max-w-md bg-gradient-to-b from-slate-900 via-amber-950/50 to-slate-950 border-3 border-amber-400 rounded-3xl p-5 sm:p-6 shadow-2xl text-center space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar relative animate-complete-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 王冠＆トロフィーアイコン */}
        <div className="flex justify-center -mt-10">
          <div className="relative p-4 bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 rounded-3xl shadow-2xl border-2 border-white ring-6 ring-amber-400/40 animate-bounce-subtle">
            <Trophy className="w-10 h-10 text-amber-950 fill-current" />
            <Sparkles className="w-5 h-5 text-white absolute -top-1 -right-1 animate-spin-slow" />
          </div>
        </div>

        {/* 大団円タイトル */}
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-500/25 px-3 py-1 rounded-full border border-amber-500/50 inline-flex items-center space-x-1">
            <Crown className="w-3.5 h-3.5" />
            <span>GRAND FINALE • 祝・全15エリア完全制覇</span>
          </span>
          <h2 className="text-3xl font-black bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_4px_16px_rgba(245,158,11,0.85)] tracking-wide pt-1">
            桃源郷の大団円！🎉
          </h2>
          <p className="text-xs text-amber-200/90 font-bold leading-relaxed">
            濁った荒地だった谷が、すべての仲間たちの笑顔あふれる理想郷に生まれ変わりました！
          </p>
        </div>

        {/* 桃源郷の絶景ビジュアル */}
        <div className="relative rounded-2xl overflow-hidden border border-amber-400/60 shadow-lg">
          <img
            src={getAssetUrl("/assets/paradise_stage_5.jpg")}
            alt="桃源郷グランドダム"
            className="w-full h-44 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2.5">
            <span className="text-[11px] font-black text-amber-300 flex items-center space-x-1 drop-shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>全15エリアの復興記念メモリアル</span>
            </span>
          </div>
        </div>

        {/* 15匹の仲間たち全員集合ギャラリー */}
        <div className="p-3 bg-slate-900/90 border border-amber-500/30 rounded-2xl space-y-2">
          <span className="text-[11px] font-black text-amber-200 flex items-center justify-center space-x-1">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-current" />
            <span>駆けつけてくれた15匹の仲間たち</span>
          </span>

          <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-950/70 rounded-xl">
            {areas.map((a) => (
              <div
                key={a.id}
                className="p-1.5 bg-slate-800/80 rounded-xl flex flex-col items-center justify-center border border-slate-700/60"
                title={`${a.name}: ${a.creature.name}`}
              >
                <span className="text-xl leading-none">{a.creature.icon}</span>
                <span className="text-[8px] text-slate-300 truncate max-w-full mt-0.5 font-bold">
                  {a.creature.name.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 感謝の言葉 */}
        <p className="text-xs text-slate-300 leading-relaxed bg-amber-950/30 p-3 rounded-2xl border border-amber-500/20 text-left">
          「棟梁！ふたりで力を合わせて、ついにこの広大なフロンティアの自然をすべて蘇らせることができたね！川のせせらぎも、森の仲間たちの歌声も、一生の宝物だよ。本当にありがとう！」
        </p>

        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/30 active:scale-98 transition-all cursor-pointer flex items-center justify-center space-x-2"
        >
          <CheckCircle2 className="w-4 h-4 fill-current" />
          <span>これからも桃源郷を見守る！ 🦫✨</span>
        </button>
      </div>
    </div>
  );
};
