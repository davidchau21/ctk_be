/**
 * Human-Readable ABI for CryptoTrackerToken
 */
export const CryptoTrackerTokenABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function mint(address to, uint256 amount) external",
  "function burn(uint256 amount) external",
  "function pause() external",
  "function unpause() external",
  "function owner() view returns (address)"
];
