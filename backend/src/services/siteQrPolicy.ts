export function normalizeSiteQrCode(qrCode: string, expectedSiteId: string): string | null {
  if (qrCode === expectedSiteId || qrCode === `SITE_${expectedSiteId}`) {
    return expectedSiteId;
  }

  const legacyMatch = /^SITE:([^:]+):\d+$/.exec(qrCode);
  return legacyMatch?.[1] === expectedSiteId ? expectedSiteId : null;
}

export function isQrCodeForSite(qrCode: string, expectedSiteId: string): boolean {
  return normalizeSiteQrCode(qrCode, expectedSiteId) === expectedSiteId;
}
