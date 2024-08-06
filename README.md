# AVAX-AMM

このプロジェクトはUNCHAINのAVAX-AMMプロジェクトです。

## 技術スタック

- Next.js（app routerは未使用、従来の方式）
- Hardhat 2.17.0
- Hardhat-toolbox 4.0.0
- OpenZeppelin Contracts 5.0.0
- Ethers.js 6.9.0

## 特徴

- `create-next-app`を使用して構築されていますが、app routerは使用していません。
- `tsconfig.json`はBigIntをサポートするためにES2020を使用しています。

## 元のプロジェクトとの違い

テストコード（`AMM.ts`）が主な違いです。Ethers.js v6系に対応するために若干の変更が加えられています。

## 注意事項

このプロジェクトで使用しているライブラリの組み合わせは安定性が確認されています。バージョンを変更する際は十分な注意が必要です。

## ライセンス

