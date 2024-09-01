// PRECISIONありのshareに変換します。
export const formatWithPrecision = (
  share: string,
  precision: bigint
): bigint => {
  return BigInt(share) * precision;
};

// PRECISIONなしのshareに変換します。
export const formatWithoutPrecision = (
  share: bigint,
  precision: bigint
): string => {
  return (share / precision).toString();
};