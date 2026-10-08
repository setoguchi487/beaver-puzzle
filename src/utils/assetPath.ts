/**
 * GitHub Pages等のサブディレクトリ配信に対応したアセットURL解決関数
 * 何度呼び出しても二重パスにならない安全な冪等性（Idempotent）を保証します。
 */
export function getAssetUrl(path: string | undefined | null): string {
  if (!path) return '';
  
  // 外部URLまたはデータURIはそのまま返す
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }

  const base = import.meta.env.BASE_URL || '/';
  const cleanBase = base.endsWith('/') ? base : `${base}/`; // 例: '/beaver-puzzle/'

  // 1. すでに cleanBase で始まっている場合は二重付与せずそのまま返す
  if (path.startsWith(cleanBase)) {
    return path;
  }

  // 2. '/beaver-puzzle/' などのプレフィックスがすでに含まれている場合も二重付与を防止
  const trimmedPath = path.startsWith('/') ? path.slice(1) : path;
  const trimmedBase = cleanBase.startsWith('/') ? cleanBase.slice(1) : cleanBase;
  if (trimmedBase && trimmedPath.startsWith(trimmedBase)) {
    return `/${trimmedPath}`;
  }

  // 3. 通常のパスに cleanBase を付与
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${cleanBase}${cleanPath}`;
}
