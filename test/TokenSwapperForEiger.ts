const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const { deployMockContract } = waffle;

describe("TokenSwapperForEiger Contract", function () {
    let tokenSwapper;
    let mockERC20Token;
    let mockUniswapV3Router;
    let uupsProxy;
    let proxiedContract;
    let owner, addr1;
    const WETH = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";

    beforeEach(async function () {
        [owner, addr1] = await ethers.getSigners();

        // Deploy Mock ERC20 Token
        const MockERC20Token = await ethers.getContractFactory("MockERC20Token");
        mockERC20Token = await MockERC20Token.deploy("MockToken", "MTK");
        await mockERC20Token.deployed();

        // Deploy Mock Uniswap V3 Router
        const MockUniswapV3Router = await ethers.getContractFactory("MockUniswapV3Router");
        mockUniswapV3Router = await MockUniswapV3Router.deploy(mockERC20Token.address);
        await mockERC20Token.transfer(mockUniswapV3Router.address,ethers.utils.parseEther("100"));

        // Deploy TokenSwapperForEiger
        const TokenSwapperForEiger = await ethers.getContractFactory("TokenSwapperForEiger");
        tokenSwapper = await TokenSwapperForEiger.deploy();
        await tokenSwapper.deployed();

        const UUPSProxy = await ethers.getContractFactory("UUPSProxy");
        uupsProxy = await UUPSProxy.deploy(tokenSwapper.address,tokenSwapper.address,"0x");
        await uupsProxy.deployed();
        tokenSwapper = await TokenSwapperForEiger.attach(uupsProxy.address);

        // Initialize TokenSwapper with the address of the mock Uniswap V3 Router
        await tokenSwapper.initialize(mockUniswapV3Router.address);
    });

    describe("Initialization", function () {
        it("should have set the swapRouter correctly", async function () {
            expect(await tokenSwapper.swapRouter()).to.equal(mockUniswapV3Router.address);
        });
        it("should revert when trying to reinitializie with a zero address for the Uniswap router", async function () {
            await expect(tokenSwapper.initialize(ethers.constants.AddressZero))
                .to.be.revertedWith("InvalidInitialization");
        });
        it("should allow minting of tokens to any address (MockCheck)", async function () {
            const [owner, recipient] = await ethers.getSigners();
            const mintAmount = ethers.utils.parseEther("50"); 
            await mockERC20Token.mint(recipient.address, mintAmount);
    
            const recipientBalance = await mockERC20Token.balanceOf(recipient.address);
            expect(recipientBalance).to.equal(mintAmount);
        });
    });

    describe("Swapping Ether to Token", function () {
        it("should allow swapping Ether for a token and receive the correct amount of tokens", async function () {
            const swapAmount = ethers.utils.parseEther("0.1");
            const minAmount = ethers.utils.parseEther("0.09");
    
            // Get addr1 MockToken balance before the swap
            const initialBalance = await mockERC20Token.balanceOf(addr1.address);
    
            // swap perform
            await tokenSwapper.connect(addr1).swapEtherToToken(mockERC20Token.address, swapAmount, { value: swapAmount });
    
            // Calculate the expected new balance (initial + minAmount)
            const expectedBalance = initialBalance.add(minAmount);
            const finalBalance = await mockERC20Token.balanceOf(addr1.address);
            expect(finalBalance).to.be.at.least(expectedBalance);
        });
        it("should revert with InsufficientOutputAmount if the output is less than minAmount", async function () {
            const swapAmount = ethers.utils.parseEther("1");
            const minAmount = ethers.utils.parseEther("1.1"); // Set a minAmount higher than what the mock router will return
    
            await expect(tokenSwapper.connect(addr1).swapEtherToToken(mockERC20Token.address, minAmount, { value: swapAmount }))
                .to.be.revertedWith("InsufficientOutputAmount");
        });
        it("should revert when swapping Ether to a zero address token", async function () {
            const swapAmount = ethers.utils.parseEther("1");
            const minAmount = ethers.utils.parseEther("0.9");
            await expect(tokenSwapper.connect(addr1).swapEtherToToken(ethers.constants.AddressZero, minAmount, { value: swapAmount }))
                .to.be.revertedWith("InvalidParameters");
        });
        it("should revert when swapping zero Ether for a token", async function () {
            const minAmount = ethers.utils.parseEther("0.9");
            await expect(tokenSwapper.connect(addr1).swapEtherToToken(mockERC20Token.address, minAmount, { value: 0 }))
                .to.be.revertedWith("InvalidParameters");
        });
        
        
    });
    

    describe("Pausing and Unpausing", function () {
        it("should pause and unpause the contract", async function () {
            await tokenSwapper.pause();
            await expect(
                tokenSwapper.swapEtherToToken(mockERC20Token.address, ethers.utils.parseEther("0.1"))
            ).to.be.revertedWith("EnforcedPause");

            await tokenSwapper.unpause();
            // This call should succeed if unpaused correctly
            await tokenSwapper.swapEtherToToken(mockERC20Token.address, ethers.utils.parseEther("0.1"), { value: ethers.utils.parseEther("0.1") });
        });
        it("should revert when non-admin tries to pause the contract", async function () {
            await expect(tokenSwapper.connect(addr1).pause())
                .to.be.reverted; 
        });
        
        it("should revert when non-admin tries to unpause the contract", async function () {
            await tokenSwapper.pause(); // First pause as admin to setup
            await expect(tokenSwapper.connect(addr1).unpause())
                .to.be.reverted; 
        });
    });

    describe("Updating Swap Router Address", function () {
        it("should update the swap router address", async function () {
            const NewMockUniswapV3Router = await ethers.getContractFactory("MockUniswapV3Router");
            mockUniswapV3Router = await NewMockUniswapV3Router.deploy(mockERC20Token.address);
            await tokenSwapper.setSwapRouterAddress(mockUniswapV3Router.address);
            expect(await tokenSwapper.swapRouter()).to.equal(mockUniswapV3Router.address);
        });
        it("should revert with InvalidParameters when setting a zero address", async function () {
            await expect(tokenSwapper.setSwapRouterAddress(ethers.constants.AddressZero)).to.be.revertedWith("InvalidParameters");
        });
        it("should revert when a non-admin tries to change the swap router address", async function () {
            const [owner, addr1] = await ethers.getSigners();
            const newSwapRouterAddress = ethers.Wallet.createRandom().address; // Generates a random address for testing

            await expect(tokenSwapper.connect(addr1).setSwapRouterAddress(newSwapRouterAddress))
                .to.be.reverted;
        });
    });

    describe("Fee Adjustment Based on Token Types", function () {
        beforeEach(async function () {
            await tokenSwapper.setTokenType(mockERC20Token.address, 0); 
            const MockERC20Token = await ethers.getContractFactory("MockERC20Token");
            const mockExoticToken = await MockERC20Token.deploy("MockExoticToken", "MET");
            await mockExoticToken.deployed();
            await tokenSwapper.setTokenType(mockExoticToken.address, 1); 
        });
    
        it("should emit the correct fee for STABLE tokens", async function () {
            const swapAmount = ethers.utils.parseEther("1");
            const minimumAmount = ethers.utils.parseEther("0.5");
            await tokenSwapper.setTokenType(mockERC20Token.address, 0); // STABLE
            await expect(tokenSwapper.connect(addr1).swapEtherToToken(mockERC20Token.address, minimumAmount, { value: swapAmount }))
                .to.emit(tokenSwapper, "EtherToTokenSwap")
                // expect swapAmount as output because we are using Mock of Uniswap which swaps 1:1
                .withArgs(addr1.address, mockERC20Token.address, swapAmount, swapAmount, 500); // Check for fee = 500
        });
    
        it("should emit the correct fee for EXOTIC tokens", async function () {
            const swapAmount = ethers.utils.parseEther("1");
            const MockERC20Token = await ethers.getContractFactory("MockERC20Token");
            const mockExoticToken = await MockERC20Token.deploy("MockExoticToken", "MET");
            await mockExoticToken.deployed();
            await tokenSwapper.setTokenType(mockExoticToken.address, 1); // EXOTIC
    
            await expect(tokenSwapper.connect(addr1).swapEtherToToken(mockExoticToken.address, 0, { value: swapAmount }))
                .to.emit(tokenSwapper, "EtherToTokenSwap")
                // expect swapAmount as output because we are using Mock of Uniswap which swaps 1:1
                .withArgs(addr1.address, mockExoticToken.address, swapAmount, swapAmount, 10000); // Check for fee = 10000
        });
        it("should revert with InsufficientOutputAmount for EXOTIC token if output less than minAmount", async function () {
            // set the token type to EXOTIC
            await tokenSwapper.setTokenType(mockERC20Token.address, 1);
            const swapAmount = ethers.utils.parseEther("1");
            const minAmount = ethers.utils.parseEther("2"); // Deliberately high to trigger the revert
            await expect(tokenSwapper.connect(addr1).swapEtherToToken(mockERC20Token.address, minAmount, { value: swapAmount }))
                .to.be.revertedWith("InsufficientOutputAmount");
        });
        it("should revert with InsufficientOutputAmount for STABLE token if output less than minAmount", async function () {
            // set the token type to STABLE
            await tokenSwapper.setTokenType(mockERC20Token.address, 0);
            const swapAmount = ethers.utils.parseEther("1");
            const minAmount = ethers.utils.parseEther("2"); // Deliberately high to trigger the revert
            await expect(tokenSwapper.connect(addr1).swapEtherToToken(mockERC20Token.address, minAmount, { value: swapAmount }))
                .to.be.revertedWith("InsufficientOutputAmount");
        });

        it("should revert when a non-admin tries to set a token type", async function () {
            // owner has DEFAULT_ADMIN_ROLE,  addr1  does not
            const [owner, addr1] = await ethers.getSigners();
            const tokenAddress = mockERC20Token.address; 
            const tokenType = 0; 
    
            await expect(tokenSwapper.connect(addr1).setTokenType(tokenAddress, tokenType))
                .to.be.reverted;
        });
    });

    describe("Direct ETH Send Rejection", function () {
        it("should reject direct ETH sends", async function () {
            await expect(owner.sendTransaction({ to: tokenSwapper.address, value: ethers.utils.parseEther("1") }))
                .to.be.revertedWith("DirectETHSendNotAllowed");
        });

        it("should revert when Ether is sent directly to the contract", async function () {
            const [owner] = await ethers.getSigners();
            const transaction = {
                to: tokenSwapper.address,
                value: ethers.utils.parseEther("1.0"), // Sending 1 Ether
            };
            await expect(owner.sendTransaction(transaction))
                .to.be.revertedWith("DirectETHSendNotAllowed");
        });
    });
    
});
