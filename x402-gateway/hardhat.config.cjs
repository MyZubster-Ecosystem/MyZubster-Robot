require("@nomicfoundation/hardhat-ethers");

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  paths: {
    root: "..",
    sources: "contracts",
    tests: "x402-gateway/test-contract",
    cache: "x402-gateway/cache",
    artifacts: "x402-gateway/artifacts"
  }
};
