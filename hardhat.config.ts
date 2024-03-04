import "dotenv/config";
import "@nomiclabs/hardhat-ethers";
import"@nomiclabs/hardhat-waffle";
import "hardhat-deploy";
import "solidity-coverage";
import "hardhat-gas-reporter";

module.exports = {
  solidity: "0.8.20",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  },
  networks: {
    mumbai: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    }
  },
  namedAccounts: {
    deployer: 0,
  },
  gasReporter: {
    enabled: true,
    currency: "USD"
  },
  paths: {
    deploy: "deploy",
    deployments: "scripts",
  },
  solidityCoverage: {
    skipFiles: ['./contracts/MockToken.sol']
  },
};
