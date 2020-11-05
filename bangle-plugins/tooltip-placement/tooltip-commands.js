const LOG = false;
let log = LOG
  ? console.log.bind(console, 'plugins/tooltip-commands')
  : () => {};

export const makeHideTooltipTr = (tr, tooltipPluginKey) =>
  tr
    .setMeta(tooltipPluginKey, {
      show: false,
    })
    .setMeta('addToHistory', false);

// Public commands
export const hideTooltip = (tooltipPluginKey) => (state, dispatch) => {
  const pluginState = tooltipPluginKey.getState(state);
  // Do not update an already hidden tooltip
  if (!pluginState.show) {
    log(tooltipPluginKey, 'already hidden');
    return false;
  }

  log(tooltipPluginKey, 'hiding tooltip');

  if (dispatch) {
    dispatch(
      state.tr
        .setMeta(tooltipPluginKey, {
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
  if (dispatch) {
    // dispatch(
    //   state.tr
    //     .setMeta(tooltipPlugin, {
    //       show: true,
    //     })
    //     .setMeta('addToHistory', false),
    // );
  }
  return true;
};
