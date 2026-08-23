// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// Synthetic: beforeSwap performs CALL.
contract ExternalCallHook {
    function beforeSwap(address, bytes calldata) external {
        assembly {
            let ok := call(gas(), caller(), 0, 0, 0, 0, 0)
        }
    }
}
