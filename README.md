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

1. `getAddress()`メソッドの使用：
   コントラクトアドレスの取得に`getAddress()`メソッドを使用しています。

   例：
   ```typescript
   const ammBalance0Before = await token0.balanceOf(await amm.getAddress());
   ```

2. 算術演算子の直接使用：
   `BigNumber`クラスのメソッド（`add()`, `sub()`, `mul()`, `div()`など）の代わりに、
   直接的な算術演算子（`+`, `-`, `*`, `/`）を使用しています。

   例：
   ```typescript
   const equivalentToken1 = (amountProvide0 * totalToken1) / totalToken0;
   ```

3. 型チェックエラーを解消するために、一部のコードで二重キャストを使用しています。これは理想的ではありませんが、現状のテストコードの制約内で動作させるための妥協策です。

   例：
   ```typescript
   await (amm.connect(otherAccount) as unknown as AMM)
   ```

これらの変更により、Ethers.js v6の新しい機能と構文に対応しています。

## 注意事項

このプロジェクトで使用しているライブラリの組み合わせは安定性が確認されています。バージョンを変更する際は十分な注意が必要です。

### テストコードに関する懸念点

テストファイル `AVAX-AMM/packages/contract/test/AMM.ts` では、実際のSolidityコードを直接使用せず、TypeScriptのインターフェースを定義しています。これは、元のテストコードでは関数が未定義であるというエラーが解消されなかったため、採用した方法です。
例：

```
interface AMM extends BaseContract {

  provide(token0: string, amount0: bigint, token1: string, amount1: bigint): Promise<ContractTransaction>;
  
  // ... 他のメソッド
  
}
```

このアプローチには以下の懸念点があります：

1. 実際のスマートコントラクトの実装とインターフェースの定義が一致しない可能性があります。
2. コントラクトの振る舞いを完全に模倣できていない可能性があります。
3. 実際のコントラクトデプロイ後の動作と、テスト環境での動作に差異が生じる可能性があります。

これらの理由により、テストが実際のコントラクトの動作を正確に検証できているかどうかは不確実です。

## ライセンス

