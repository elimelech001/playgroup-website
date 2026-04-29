export function checkBrowser(): boolean {
  const ua = navigator.userAgent;

  // Modern Edge (Chromium) uses "Edg/" — legacy EdgeHTML uses "Edge/" and is rejected
  const edgeMatch = ua.match(/Edg\/(\d+)/);
  if (edgeMatch) {
    return parseInt(edgeMatch[1], 10) >= 110;
  }

  // Chrome — exclude Opera (OPR/) which also contains "Chrome/"
  const chromeMatch = ua.match(/Chrome\/(\d+)/);
  if (chromeMatch && !ua.includes('OPR/') && !ua.includes('Opera')) {
    return parseInt(chromeMatch[1], 10) >= 110;
  }

  return false;
}
