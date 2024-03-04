const hre = require("hardhat");

async function main() {
    // Step 1: Deploy the implementation contract
    const TokenSwapperForEiger = await hre.ethers.getContractFactory("TokenSwapperForEiger");
    const tokenSwapperForEiger = await hre.upgrades.deployProxy(TokenSwapperForEiger, [], { kind: 'uups' });
    const uniswapRouterAddr = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";
    await tokenSwapperForEiger.deployed();
    console.log("TokenSwapperForEiger deployed to:", tokenSwapperForEiger.address);
    // initialize for sepolia
     await tokenSwapperForEiger.initialize(uniswapRouterAddr);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
