// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// Synthetic: beforeSwap CALLs Uniswap v4 PoolManager (curated address).
contract ExternalProtocolHook {
    address public constant POOL_MANAGER = 0x000000000004444c5dc75cB358380D2e3dE08A90;

    function beforeSwap(address, bytes calldata) external {
        POOL_MANAGER.call("");
    }
}
