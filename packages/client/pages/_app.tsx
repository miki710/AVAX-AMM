import type { AppProps } from "next/app"; // Next.jsのAppコンポーネントの型定義をインポート

import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  // 'Component'は現在のページを表し、'pageProps'はそのページに渡されるプロパティ
  return <Component {...pageProps} />; // 現在のページをレンダリング
}

export default MyApp;