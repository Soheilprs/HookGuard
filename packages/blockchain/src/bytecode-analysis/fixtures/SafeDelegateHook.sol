// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// Synthetic: DELEGATECALL lives in a non-callback function. beforeSwap is a no-op.
contract SafeDelegateHook {
    function beforeSwap(address, bytes calldata) external {}

    function other() external {
        assembly {
            let ok := delegatecall(gas(), caller(), 0, 0, 0, 0)
        }
    }
}
