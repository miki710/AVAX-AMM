import { ChangeEvent } from "react"; // フォーム要素の変更イベントを扱うための型

import styles from "./InputNumberBox.module.css";

type Props = {
  leftHeader: string;
  right: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void; // 'onChange'は、HTMLInputElementのChangeEventを受け取る関数
};

export default function InputNumberBox({
  leftHeader,
  right,
  value,
  onChange,
}: Props) {
  return (
    <div className={styles.boxTemplate}>
      <div className={styles.boxBody}>
        <div>
          <p className={styles.leftHeader}> {leftHeader} </p>
          <input
            className={styles.textField}
            type="number"
            value={value}
            onChange={(e) => onChange(e)}  // 'onChange'プロパティに渡された関数を呼び出すラッパー関数
            placeholder={"Enter amount"}
          />
        </div>
        <div className={styles.rightContent}>{right}</div>
      </div>
    </div>
  );
}