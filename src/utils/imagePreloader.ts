/**
 * 画像の先行読み込み（プリロード）管理ユーティリティ
 * ブラウザのメモリキャッシュに先読みしておくことで、画面遷移や復興アニメーションを0秒で即時描画します。
 */

const loadedUrls = new Set<string>();

/**
 * 単一の画像URLを事前読み込み
 */
export function preloadImage(url: string): Promise<void> {
  if (!url || loadedUrls.has(url)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      loadedUrls.add(url);
      resolve();
    };
    img.onerror = () => {
      // エラー時もブロックせず終了
      resolve();
    };
    img.src = url;
  });
}

/**
 * 複数の画像URLを一括で事前読み込み
 */
export function preloadImages(urls: (string | undefined | null)[]): void {
  urls.forEach((url) => {
    if (url) {
      preloadImage(url);
    }
  });
}
