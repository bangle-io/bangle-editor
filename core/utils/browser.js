const browser = {
  mac: false,
  ie: false,
  ie_version: 0,
  gecko: false,
  chrome: false,
  chrome_version: 0,
  android: false,
  ios: false,
  webkit: false,
};

if (typeof navigator !== 'undefined') {
  const ieEdge = /Edge\/(\d+)/.exec(navigator.userAgent);
  const ieUpTo10 = /MSIE \d/.test(navigator.userAgent);
  const ie11up = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(
    navigator.userAgent,
  );

  browser.mac = /Mac/.test(navigator.platform);
  let ie = (browser.ie = !!(ieUpTo10 || ie11up || ieEdge));
  browser.ie_version = ieUpTo10
    ? document.documentMode || 6
    : ie11up
    ? +ie11up[1]
    : ieEdge
    ? +ieEdge[1]
    : null;
  browser.gecko = !ie && /gecko\/\d/i.test(navigator.userAgent);
  browser.chrome = !ie && /Chrome\//.test(navigator.userAgent);
  browser.chrome_version = parseInt(
    (navigator.userAgent.match(/Chrome\/(\d{2})/) || [])[1],
    10,
  );
  browser.android = /Android \d/.test(navigator.userAgent);
  browser.ios =
    !ie &&
    /AppleWebKit/.test(navigator.userAgent) &&
    /Mobile\/\w+/.test(navigator.userAgent);
  browser.webkit =
    !ie &&
    !!document.documentElement &&
    'WebkitAppearance' in document.documentElement.style;
}

export default browser;

export const isChromeWithSelectionBug =
  browser.chrome && !browser.android && browser.chrome_version >= 58;
