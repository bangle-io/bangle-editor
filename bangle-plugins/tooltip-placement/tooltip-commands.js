const LOG = false;
let log = LOG
  ? console.log.bind(console, 'plugins/tooltip-commands')
  : () => {};

// Public commands
export const hideTooltip = (tooltipPlugin) => (state, dispatch) => {
  const pluginState = tooltipPlugin.getState(state);
  // Do not update an already hidden tooltip
  if (!pluginState.show) {
    log(tooltipPlugin, 'already hidden');
    return false;
  }

  log(tooltipPlugin, 'hiding tooltip');

  if (dispatch) {
    dispatch(
      state.tr
        .setMeta(tooltipPlugin, {
          show: false,
        })
        .setMeta('addToHistory', false),
    );
  }
  return true;
};

// Calling this command on a tooltip already showing will cause it to rerender i.e. update itself
export const showTooltip = (tooltipPlugin) => (state, dispatch) => {
  // We do not check when it is already in show state, to allow for the flexibility
  // of calling showTooltip multiple times as a way to signal updating of any downstream consumers
  // for example a tooltip can update its position
  log('tooltipPlugin, showing tooltip');
  if (dispatch) {
    dispatch(
      state.tr
        .setMeta(tooltipPlugin, {
          show: true,
        })
        .setMeta('addToHistory', false),
    );
  }
  return true;
};
