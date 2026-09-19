const BREW_METHOD_LABELS = {
  espresso: 'Espresso',
  filter: 'Filter',
};

export function formatOrderItemBrewMethod(brewMethod, fallback = brewMethod) {
  return BREW_METHOD_LABELS[brewMethod] || fallback;
}
