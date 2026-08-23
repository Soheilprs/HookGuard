// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// Synthetic: beforeSwap performs DELEGATECALL. Used as a documented pattern;
/// unit tests assemble equivalent runtime bytecode (no solc required).
contract UnsafeDelegateHook {
    function beforeSwap(address, bytes calldata) external {
        assembly {
            let ok := delegatecall(gas(), caller(), 0, 0, 0, 0)
        }
    }
}
