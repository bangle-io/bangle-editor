// simple higher order compose
export function compose(func, ...funcs) {
  const allFuncs = [func, ...funcs];
  return function composed(raw) {
    return allFuncs.reduceRight((prev, func) => func(prev), raw);
  };
}
