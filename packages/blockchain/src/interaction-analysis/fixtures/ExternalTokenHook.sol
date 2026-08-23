// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// Synthetic: beforeSwap CALLs ERC-20 transfer on a constant token.
contract ExternalTokenHook {
    address public constant TOKEN = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

    function beforeSwap(address, bytes calldata) external {
        TOKEN.call(abi.encodeWithSelector(bytes4(0xa9059cbb), address(this), uint256(1)));
    }
}
