# @bpm105/egov-lawid-input

e-Gov 法令検索 API（`https://laws.e-gov.go.jp/api/2`）で法令名検索を行い、選択した法令の `lawId` を取得する再利用可能な React コンポーネント。

`https://lawdiff.und-m.jp/` で利用している `LawIdInput` を独立ライブラリとして切り出したもの。

## インストール

```bash
npm install github:bpm105/egov-lawid-input
```

## 使い方

```tsx
import { LawIdInput } from '@bpm105/egov-lawid-input';
import '@bpm105/egov-lawid-input/styles.css';

export function MyForm() {
  return (
    <LawIdInput
      onSelect={(law) => console.log('選択:', law.lawId, law.lawTitle)}
      onSubmit={(lawId) => console.log('決定:', lawId)}
    />
  );
}
```

## Props

| 名前 | 型 | デフォルト | 説明 |
|---|---|---|---|
| `onSelect` | `(result: LawSearchResult) => void` | - | 候補から選択したタイミング |
| `onSubmit` | `(lawId: string) => void` | - | submit ボタン / Enter（法令ID入力時） |
| `onReset` | `() => void` | - | 編集開始 / focus |
| `onError` | `(e: unknown) => void` | - | ネットワーク等のエラー通知 |
| `initialValue` | `string` | `''` | 初期値 |
| `loading` | `boolean` | `false` | 親が制御するローディング |
| `submitLabel` | `string` | `'決定'` | submit ボタンのラベル |
| `submitLoadingLabel` | `string` | `'取得中'` | loading=true のときのラベル |
| `hideSubmitButton` | `boolean` | `false` | submit ボタンを描画しない |
| `showRevisionBadge` | `boolean` | `false` | 「単一施行日」バッジ（追加 API 呼び出しが発生） |
| `showRepealedBadge` | `boolean` | `true` | 「廃止」バッジ |
| `debounceMs` | `number` | `300` | 検索間隔（ミリ秒） |
| `searchLimit` | `number` | `10` | ドロップダウン表示件数 |
| `placeholder` | `string` | `'法令IDまたは法令名（例: 民法）'` | input placeholder |
| `searchingText` | `string` | `'検索中…'` | 検索中の表示 |
| `noResultsText` | `string` | `'キーワードにマッチする法令名がありません'` | 0 件時の表示 |
| `className` / `inputClassName` / `submitButtonClassName` / `dropdownClassName` / `itemClassName` | `string` | - | 上書き可能なclass名 |
| `apiBaseUrl` | `string` | `'https://laws.e-gov.go.jp/api/2'` | API ベース URL |

## 型

```ts
interface LawSearchResult {
  lawId: string;
  lawTitle: string;
  lawNum: string;
  isRepealed: boolean;
  revisionCount?: number; // showRevisionBadge=true のときのみ
}
```

## スタイルのカスタマイズ

デフォルトCSSのクラスはすべて `egov-law-input` プレフィックス付きで、以下の方法でスタイル変更可能。

### 方法1: `className` props で要素ごとに追加クラスを渡す

各主要要素に対応する props が用意されている。Tailwind 等のユーティリティクラスを差し込みたい場合に便利。

```tsx
<LawIdInput
  className="my-wrapper"
  inputClassName="border-2 border-blue-500"
  submitButtonClassName="bg-emerald-600"
  dropdownClassName="shadow-2xl"
  itemClassName="hover:bg-yellow-100"
/>
```

### 方法2: デフォルトCSSのクラスを上書き

`styles.css` を import した後に、自前のCSSで同名クラスを再定義する。

```tsx
import '@bpm105/egov-lawid-input/styles.css';
import './my-overrides.css';   // ← 後に読み込む
```

```css
/* my-overrides.css */
.egov-law-input__input {
  border-color: #10b981;
  border-radius: 12px;
}
.egov-law-input__submit {
  background: #10b981;
}
.egov-law-input__item--active {
  background: #ecfdf5;
}
```

利用可能なクラス:

| クラス | 用途 |
|---|---|
| `.egov-law-input` | ルート div |
| `.egov-law-input__form` | form 要素 |
| `.egov-law-input__input` | テキスト入力 |
| `.egov-law-input__submit` | submit ボタン |
| `.egov-law-input__dropdown` | 候補のドロップダウンパネル |
| `.egov-law-input__empty` | 「検索中…」「該当なし」表示 |
| `.egov-law-input__item` | 各候補行 |
| `.egov-law-input__item--active` | ハイライト中の候補行 |
| `.egov-law-input__item-title` | 候補の法令名 |
| `.egov-law-input__item-meta` | 候補の法令番号行 |
| `.egov-law-input__item-id` | 候補に表示される lawId |
| `.egov-law-input__badge` | 「廃止」「単一施行日」バッジ |
| `.egov-law-input__spinner` | ローディング中のスピナー |

### 方法3: デフォルトCSSをロードせずスクラッチで書く

`import '@bpm105/egov-lawid-input/styles.css'` を省略すれば、クラス名は付くがスタイルはゼロの状態になる。あとは方法2と同じ要領で自前CSSを当てる。

## 開発

```bash
npm install
npm run dev       # examples/ のデモ起動
npm test          # Jest テスト
npm run build     # dist/ にビルド
npm run typecheck # 型チェック
```

