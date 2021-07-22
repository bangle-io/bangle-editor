export function applyCommand(command) {
  return (state) => {
    return new Promise((resolve, reject) => {
      const res = command(state, (tr) => {
        resolve(state.apply(tr));
      });
      if (res === false) {
        reject(new Error('Command failed to handle'));
      }
    });
  };
}
