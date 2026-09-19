export const formatWeightGrams = (weight, { style = 'compact' } = {}) => {
  if (style === 'words') return Number(weight) === 1000 ? '1 kg' : `${weight} gram`;

  return Number(weight) === 1000 ? '1kg' : `${weight}g`;
};
