
const siteId = "SITE_003"; // From DB
const expectedQR = `SITE_${siteId}`;

console.log("Site ID:", siteId);
console.log("Validation Logic: `SITE_${siteId}`");
console.log("Expected QR String:", expectedQR);

const probablePhysicalQR = "SITE_003";
console.log("Probable Physical QR:", probablePhysicalQR);
console.log("Match?", expectedQR === probablePhysicalQR ? "YES" : "NO");
