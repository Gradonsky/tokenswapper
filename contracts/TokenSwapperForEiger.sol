// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {IV3SwapRouter} from "@uniswap/swap-router-contracts/contracts/interfaces/IV3SwapRouter.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {IERC20Swapper} from "./interfaces/IERC20Swapper.sol";
/**
 * @title TokenSwapperForEiger
 * @author Janusz Gradonski
 * @notice This contract facilitates the exchange of Ether for any ERC-20 token utilizing Uniswap V3 as the underlying DEX.
 * @dev The contract implements the ERC20Swapper interface for swapping Ether to ERC-20 tokens. It is designed with safety,
 *      upgradeability, and interoperability in mind. The contract uses OpenZeppelin's UUPSUpgradeable for proxy-based upgradeability
 *      and PausableUpgradeable for emergency stop mechanisms. This contract does not have ownership to minimize trust and security risks.
 */

contract TokenSwapperForEiger is
    IERC20Swapper,
    AccessControlUpgradeable,
    UUPSUpgradeable,
    PausableUpgradeable
{
    // Custom errors
    error InsufficientOutputAmount();
    error InvalidParameters();
    error DirectETHSendNotAllowed();

    event SwapRouterUpdated(address indexed newSwapRouter);
    event TokenTypeSet(address indexed token, TokenType tokenType);
    event EtherToTokenSwap(address indexed sender, address indexed token, uint256 amountIn, uint256 amountOut, uint256 fee);

    IV3SwapRouter public swapRouter;
    /// @notice WETH is the address which should be passed as tokenIn param even if we are working with native ETH
    address private constant WETH = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;
    enum TokenType { STABLE, EXOTIC }
    //slither-disable-next-line uninitialized-state
    mapping(address => TokenType) public tokenTypeMapping;

    // solhint-disable-next-line
    constructor() { 
        _disableInitializers();
    }

    function initialize(address uniswapRouterAddr) public initializer {
        if (uniswapRouterAddr == address(0)) revert InvalidParameters();
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        swapRouter = IV3SwapRouter(uniswapRouterAddr);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    ///@notice swapping Ether to ERC-20 tokens using UniswapV3, which can be paused by admin
    ///@dev we are passing the WETH as tokenIn, its the requirment from UniswapV3 side to properly perform the native Ether swap
    function swapEtherToToken(address token, uint256 minAmount)
        external
        payable
        override
        whenNotPaused
        returns (uint256)
    {
        if (token == address(0) || msg.value == 0) revert InvalidParameters();
        uint24 fee = 3000; // Default fee

        // Adjust fee based on token type
        if (tokenTypeMapping[token] == TokenType.STABLE) {
            fee = 500;
        } else if (tokenTypeMapping[token] == TokenType.EXOTIC) {
            fee = 10000;
        }

        IV3SwapRouter.ExactInputSingleParams memory params = IV3SwapRouter.ExactInputSingleParams({
            tokenIn: WETH,
            tokenOut: token,
            fee: fee,
            recipient: msg.sender,
            amountIn: msg.value,
            amountOutMinimum: minAmount,
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = swapRouter.exactInputSingle{value: msg.value}(params);
        if (amountOut < minAmount) revert InsufficientOutputAmount();
        emit EtherToTokenSwap(msg.sender, token, msg.value, amountOut, fee);
        return amountOut;
    }

    function setTokenType(address token, TokenType tokenType) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (token == address(0)) revert InvalidParameters();
        tokenTypeMapping[token] = tokenType;
        emit TokenTypeSet(token, tokenType);
    }

    receive() external payable {
        revert DirectETHSendNotAllowed();
    }

    
    /// @notice This Function is changing the Router Address, can only be called by Admin
    function setSwapRouterAddress(address newSwapRouter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newSwapRouter == address(0)) revert InvalidParameters(); 
        swapRouter = IV3SwapRouter(newSwapRouter);
        emit SwapRouterUpdated(newSwapRouter);
    }
    // solhint-disable-next-line no-empty-blocks
    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
