# 🦫 プロジェクト進捗状況・引き継ぎドキュメント (PROJECT_STATUS.md)

> **作成日時**: 2026年11月6日  
> **対象リポジトリ**: 
> 1. `beaver_game` (`/Users/setoguchiyuuya/dev/beaver_game`) - メイン稼働中
> 2. `save_money` (`/Users/setoguchiyuuya/dev/save_money`) - 保留中
> 
> **本番公開URL**: [https://setoguchi487.github.io/beaver-puzzle/](https://setoguchi487.github.io/beaver-puzzle/)

---

## 1. プロジェクト概要

本リポジトリは、マッチ3パズルで木材を集めながら、荒廃した渓流（全15エリア）をふたりで開拓・復興していくWebゲーム**「ふたりビーバーのダム開拓パズル」**です。

### 技術スタック
- **フロントエンド**: React 19 + TypeScript + Vite + Tailwind CSS
- **PWA対応**: `vite-plugin-pwa`（オフラインプレイ・ホーム画面インストール対応）
- **音声**: Web Audio API によるシンセサイザー合成音（`soundEffects.ts`）
- **データ永続化**: `localStorage` 自動保存 ＋ 引継ぎコード（Base64圧縮・暗号化）による端末移行
- **CI/CD & ホスティング**: GitHub Actions ➔ GitHub Pages (`gh-pages` ブランチ自動デプロイ)

---

## 2. 現在の達成状況（完了した作業）

### ① 高解像度グラフィックアセットの完全画像化（絵文字フォールバック100%解消）
以前は一部が絵文字表示になっていた要素を含め、主要なゲームアセットはすべて高解像度画像（生成AIアセット）に置き換え・配線済みです。

| 分類 | ファイル名 / パス | 状態 | 内容 |
| :--- | :--- | :---: | :--- |
| **開拓エリア復興アート** | `public/assets/*_stage_[0-5].jpg` | ✅ 完了 | 全15エリア×各6段階（荒廃〜完全復活）の計90枚 |
| **森の生き物** | `public/assets/creature_*.png` | ✅ 完了 | カルガモ、カワセミ、フクロウ、キツネ、クマ等全15種 |
| **パズルピース** | `public/assets/piece_*.png` | ✅ 完了 | 丸太、水流、若葉、どんぐり、岩石、野イチゴ、キノコ、ロケット、ボム、虹 |
| **ギミック素材** | `public/assets/gimmick_*.png` | ✅ 完了 | 氷、岩、ツタ、泥んこ、宝箱 |
| **ブースター** | `public/assets/booster_*.png` | ✅ 完了 | 木槌、ノコギリ、しっぽビンタ、ぜんまい時計、追加手数 |
| **着せ替え衣装** | `public/assets/closet_*.jpg`, `hat_*.jpg`, `costume_*.jpg` | ✅ 完了 | 帽子4種・服4種（「帽子なし/自然体毛並み」「服なし/ありのまま」含む）全品画像化 |
| **タスクバッジ** | `public/assets/task_icon_*.jpg` | ✅ 完了 | 清掃・木工・土木・植樹・灯籠・架橋・記念碑の全7種専用バッジ |
| **デイリーパズル** | `public/assets/icon_daily_puzzle.jpg` | ✅ 完了 | 専用ヘッダー＆挑戦アイコン |
| **木材コイン・連勝** | `public/assets/icon_wood_coin.jpg`, `icon_fire_streak.jpg` | ✅ 完了 | 木材通貨アイコン、連勝の炎バッジ |
| **公式ロゴ・メイン** | `public/assets/game_title_logo.jpg`, `beaver_hero.jpg` | ✅ 完了 | タイトルロゴ、ビーバー棟梁ビジュアル |
| **スターロード** | `public/assets/star_trophy_*.jpg` | ✅ 完了 | ブロンズ、シルバー、アンバー、ゴールド、プラチナ全5種 |
| **魚拓図鑑 & 釣り** | `public/assets/fish_*.jpg`, `fishing_driftwood.jpg` | ✅ 完了 | アユ、ヤマメ、イワナ、ニジマス、黄金大ナマズ、沈没宝箱、流木 |
| **木工デコレーション** | `public/assets/deco_*.jpg` | ✅ 完了 | ベンチ、ランタン、花壇、小舟、焚き火、トーテム、噴水、ガゼボ全8種 |
| **プラネタリウム** | `public/assets/constellation_*.jpg` | ✅ 完了 | ビーバー座、水車座、カワセミ座、神木座、白狐座全5種 |
| **神木の加護** | `public/assets/blessing_*.jpg` | ✅ 完了 | 豊穣の息吹、静寂の加護、共鳴の加護全3種 |
| **ジューススタンド** | `public/assets/juice_*.jpg` | ✅ 完了 | ベリーサイダー、ブルーベリーシロップ、完熟スムージー全3種 |
| **焚き火デイリー依頼**| `public/assets/quest_*.jpg` | ✅ 完了 | 巻物の依頼書、ガラス小瓶、土器ポット全3種 |
| **大団円エンディング** | `public/assets/grand_ending_celebration.jpg` | ✅ 完了 | 全15エリア制覇時の祝宴アート |

### ② 直近で解消された重要不具合・改善点 (コミット `cf74bee`, `cc2a9f0`)
1. **マップピン・エリア一覧・詳細ドロワーのサムネイル**:
   `area.image` ではなく、各エリアのタスク達成段階に応じた `area.detailImages[Math.min(completedCount, ...)]` を参照するように修正し、絵文字（🥀 や 🌱）のフォールバックを解消。
2. **パズル目標ギミック表示**:
   パズル開始前画面（`Match3Board.tsx`）、ステージ選択一覧（`StageSelectModal.tsx`）、日替わりパズル（`DailyPuzzleModal.tsx`）で、目標素材にギミック（氷・岩・ツタ・泥・宝箱）が含まれる場合に `gimmick_*.png` をフォールバック表示するよう共通化。
3. **生き物画像パスの整合性修正**:
   `Match3Board.tsx` の `getStageBackgroundInfo` で指定されていたファイル名タイポ（`creature_mallard.png` ➔ `creature_mallard_duck.png`、`creature_salmon.png` ➔ `creature_sweetfish.png` 等）をすべて実アセット名に修正。
4. **相棒バディスキルバナー**:
   パズル画面上部の相棒スキル表示を、絵文字から `buddySkill.creatureImage` の高解像度イラストへ更新。
5. **チャプター背景バナー**:
   `StageSelectModal.tsx` で背景画像URLの指定ミス（Tailwindクラス文字列が渡されていた点）を `currentChapter.image` に修正し、美麗なチャプター背景が表示されるように改修。
6. **エリア完全制覇モーダル**:
   `AreaCompleteModal.tsx` で、全15エリアのStage 5完全復活アートが大画面で表示されるよう拡張。

### ③ パズル演出・エフェクト・爽快感の全面強化 (最新完了)
1. **4個・5個・交差マッチ時の特殊ピース誕生演出**:
   - ロケット（4個消し）・爆弾（L/T字消し）・虹オーブ（5個直列消し）が生成された瞬間に、該当マスにオーラ波紋リング (`animate-special-birth-ring`)、浮上バッジ (`animate-birth-badge`)、専用パーティクル（紙吹雪・火花・星屑）および専用誕生効果音 (`playSpecialCreated`) を実装。
2. **3段階のダイナミック画面シェイク**:
   - `animate-shake-subtle`（4個消し、2コンボ、木槌）: 0.24s・微細な2px振動。
   - `animate-shake-medium`（爆弾誕生・単体起爆、3〜4コンボ、ノコギリ）: 0.38s・5pxのキレのある振動。
   - `animate-shake-heavy`（5個消し虹誕生、特殊合体コンボ、5コンボ以上、しっぽビンタ）: 0.55s・8〜10pxの重量級激震。
3. **超必殺・特殊ピース合体技のダイナミック演出**:
   - **CROSS ROCKET**（ロケット×ロケット）: 十文字ビーム＋デュアルストライク。
   - **MEGA CROSS BLAST**（ロケット×爆弾）: 3列メガ十字ビーム＋オレンジフラッシュ＋大歓声バナー。
   - **SUPER NOVA**（爆弾×爆弾）: 盤面全体大爆発＋激震シェイク＋炎のフラッシュ。
   - **RAINBOW METEOR SWARM**（虹×ロケット）: 全素材ロケット化＋プリズムフラッシュ。
   - **RAINBOW CARPET BOMB**（虹×爆弾）: 全素材爆弾化＋一斉大爆発。
   - **COSMIC CLEANSE**（虹×虹）: 全盤面完全浄化＋特大星屑シャワー＋全画面プリズムフラッシュ。
4. **連鎖（Combo）フィードバックの強化**:
   - 連鎖数に応じて高らかに鳴り響く歓喜の和音（Cメジャー ➔ Dメジャー ➔ E9th ➔ Gハイオーラファンファーレ）。
   - 3コンボ以上で左右からの祝祭紙吹雪、および中央に「2 COMBO!」「3 COMBO!」「4 COMBO!」「🔥 5+ COMBO! BEAVER FRENZY! 🦫💥」の3Dポップバナー表示。
5. **お助けアイテム（ブースター）の打撃感・演出強化**:
   - 木づち（木片パーティクル＋微細シェイク）、ノコギリ（横一閃スパーク＋中シェイク＋閃光）、しっぽビンタ（土煙木片大爆発＋重量級シェイク＋爆風フラッシュ）。

---

## 3. ディレクトリ構造・重要ファイル一覧

```
beaver_game/
├── public/
│   └── assets/                  # 高解像度ゲームアセット（JPG, PNG）
├── src/
│   ├── App.tsx                  # メイン画面遷移コントローラー
│   ├── main.tsx                 # エントリーポイント
│   ├── types/
│   │   └── index.ts             # 型定義（FrontierArea, PuzzleStage, PieceType 等）
│   ├── data/
│   │   ├── masterData.ts        # 全100ステージ生成関数 & 全15開拓エリア初期データ
│   │   ├── buddySkills.ts       # 15種の生き物相棒スキル定義
│   │   ├── decorations.ts       # 8種の木工家具デコレーションデータ
│   │   ├── starRoadMilestones.ts# スターロード報酬マイルストーン定義
│   │   └── creatureDialogues.ts # 生き物のセリフ集
│   ├── components/
│   │   ├── home/
│   │   │   └── TitleHomeScreen.tsx      # タイトル画面（セーブ引継ぎ・遊び方）
│   │   ├── map/
│   │   │   └── FrontierMap.tsx          # 渓流全景マップ（雲の霧、エリアピン、施設ボタン）
│   │   ├── area/
│   │   │   └── AreaDetailScreen.tsx     # 5段階タスク実行画面（ビフォーアフター）
│   │   ├── puzzle/
│   │   │   └── Match3Board.tsx          # マッチ3パズル盤面（スワップ・連鎖・特殊ピース）
│   │   └── common/                      # 各種モーダル
│   │       ├── StageSelectModal.tsx     # 全100ステージ選択（チャプター別）
│   │       ├── DailyPuzzleModal.tsx     # 日替わりパズル
│   │       ├── BeaverClosetModal.tsx    # 着せ替えクローゼット
│   │       ├── WorkshopShopModal.tsx    # 木工ショップ（ブースター購入）
│   │       ├── LuckyWheelModal.tsx      # 水車ラッキールーレット
│   │       ├── FishingMiniGameModal.tsx # 渓流釣りミニゲーム
│   │       ├── PlanetariumModal.tsx     # プラネタリウム星座解放
│   │       ├── SacredTreeModal.tsx      # 神木の加護パッシブ
│   │       ├── CampfireQuestsModal.tsx  # 焚き火集会プチ依頼
│   │       ├── StarRoadModal.tsx        # スターロード進捗
│   │       ├── AreaCompleteModal.tsx    # エリア復興完了演出
│   │       └── GrandEndingModal.tsx     # 桃源郷大団円エンディング
│   └── utils/
│       ├── assetPath.ts         # ベースパス解決（GitHub Pages対応）
│       ├── soundEffects.ts      # Web Audio API 効果音
│       ├── saveDataManager.ts   # セーブデータ読み書き・エクスポート/インポート
│       ├── areaUnlocks.ts       # 施設解放判定・水車ボーナス判定
│       └── imagePreloader.ts    # 画像先行キャッシュ
└── package.json
```

---

## 4. 今後取り組める作業・拡張候補 (Next Steps)

現在の必須タスクは完了しているため、次回以降のセッションで着手できる候補は以下の通りです：

### 候補A: ペア家計簿アプリ (`save_money`) の開発再開
- 今回スルーしていた `/Users/setoguchiyuuya/dev/save_money` リポジトリの作業。
- 家計簿・貯金目標プリセット、支出グラフ、Firebase連携、UI/UXデザイン改善など。

### 候補B: ビーバーパズル (`beaver_game`) のゲーム性強化・コンテンツ追加
1. **パズル演出・エフェクトの強化**:
   - ✅ **完了**: 4/5消し誕生オーラ＆バッジ、3段階シェイク、全合体技ダイナミックコール、連鎖祝祭音＆パーティクル、ブースター強化。
2. **新ステージ追加**:
   - 現在は全100ステージ（4チャプター制）。Stage 101〜150等のエキスパートモードや新エリアの追加。
3. **サウンド・BGMの拡充**:
   - 現在はWeb Audio API による効果音中心。BGMループ（オーディオ要素）や追加効果音の実装。
4. **セーブデータのクラウド連携**:
   - 現在はブラウザの `localStorage` ＋ 引継ぎコード制。Firebase Authentication / Firestore と連携して自動クラウドセーブに対応させる。

---

## 5. 次回会話での引き継ぎ方法

新しいチャットセッションを開始する際は、以下のように指示してください：

```text
/Users/setoguchiyuuya/dev/beaver_game/PROJECT_STATUS.md を読んで、
現在の進捗状況とアーキテクチャを把握した上で、〇〇（希望の作業）を進めてください。
```

### よく使うコマンド
```bash
# ビルドテスト
npm --prefix /Users/setoguchiyuuya/dev/beaver_game run build

# ローカルプレビュー
npm --prefix /Users/setoguchiyuuya/dev/beaver_game run dev

# デプロイ状況確認
gh run list --repo setoguchi487/beaver-puzzle -L 2
```
