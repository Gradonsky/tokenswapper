// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Minimal interface for Uniswap V3 Swap Router containing only the exactInputSingle function
interface IV3SwapRouterMock {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

// Mock implementation of the Uniswap V3 router
contract MockUniswapV3Router is IV3SwapRouterMock {
    IERC20 public mockTokenOut;

    constructor(address _mockTokenOut) {
        mockTokenOut = IERC20(_mockTokenOut);
    }

    // Mock `exactInputSingle` function
    function exactInputSingle(ExactInputSingleParams calldata params) external override payable returns (uint256 amountOut) {
        amountOut = params.amountIn; // simple example: 1:1 swap rate
        require(mockTokenOut.transfer(params.recipient, amountOut), "Mock token transfer failed");
        return amountOut;
    }
}
