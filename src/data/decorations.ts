import { getAssetUrl } from '../utils/assetPath';
export interface DecorationItem {
  id: string;
  name: string;
  icon: string;
  category: 'furniture' | 'light' | 'nature' | 'monument';
  woodCost: number;
  description: string;
  image?: string; // 生成画像パス
}

export const DECORATIONS: DecorationItem[] = [
  {
    id: 'deco_bench',
    name: '木彫りの憩いベンチ',
    icon: '🛋️',
    category: 'furniture',
    woodCost: 400,
    description: '川のせせらぎを眺めながら仲間たちがひと休みできる手作りベンチ。',
    image: getAssetUrl('/assets/deco_bench.jpg'),
  },
  {
    id: 'deco_lantern',
    name: 'ホタル石の木製ランタン',
    icon: '🏮',
    category: 'light',
    woodCost: 600,
    description: '夜になると柔らかな光で川辺を照らす、温もりある自立式ランタン。',
    image: getAssetUrl('/assets/deco_lantern.jpg'),
  },
  {
    id: 'deco_flowerbed',
    name: '色鮮やかな野花の花壇',
    icon: '💐',
    category: 'nature',
    woodCost: 800,
    description: '丸太で縁取られた可愛らしい花壇。甘い香りに蝶や小鳥が集まります。',
    image: getAssetUrl('/assets/deco_flowerbed.jpg'),
  },
  {
    id: 'deco_boat',
    name: 'ビーバーの小舟',
    icon: '🛶',
    category: 'furniture',
    woodCost: 1200,
    description: '水辺に係留された小さな木製カヌー。魚釣りや水上散歩に大活躍。',
    image: getAssetUrl('/assets/deco_boat.jpg'),
  },
  {
    id: 'deco_campfire',
    name: 'ほっこり焚き火広場',
    icon: '🔥',
    category: 'furniture',
    woodCost: 1500,
    description: '石で囲んだ安全な焚き火。夜には仲間たちが集まって歌を歌います。',
    image: getAssetUrl('/assets/deco_campfire.jpg'),
  },
  {
    id: 'deco_totem',
    name: 'ビーバー守護神のトーテム',
    icon: '🗿',
    category: 'monument',
    woodCost: 2000,
    description: '治水と豊穣を祈願して一本の巨木から彫り出された伝統のトーテムポール。',
    image: getAssetUrl('/assets/deco_totem.jpg'),
  },
  {
    id: 'deco_fountain',
    name: '湧水のせせらぎ小噴水',
    icon: '⛲',
    category: 'nature',
    woodCost: 3000,
    description: '天然の湧水圧を利用した水車仕掛けの涼しげな木製ミニ噴水。',
    image: getAssetUrl('/assets/deco_fountain.jpg'),
  },
  {
    id: 'deco_gazebo',
    name: '展望ウッドガゼボ（あずまや）',
    icon: '🏛️',
    category: 'monument',
    woodCost: 5000,
    description: '復興した絶景を一望できる、屋根付きの立派な展望休憩所。',
    image: getAssetUrl('/assets/deco_gazebo.jpg'),
  },
];
