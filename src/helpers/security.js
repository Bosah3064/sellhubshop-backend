// security.js - SIMPLE PRODUCTION VERSION
module.exports = (certPath, shortCodeSecurityCredential) => {
  console.log('🔐 Using Production Security Credential');
  
  // In production, return the security credential directly
  // No encryption needed - Safaricom handles this
  return shortCodeSecurityCredential;
}