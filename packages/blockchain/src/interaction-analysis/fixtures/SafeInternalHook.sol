// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// Synthetic: beforeSwap has no CALL.
contract SafeInternalHook {
    uint256 public n;

    function beforeSwap(address, bytes calldata) external {
        n = 1;
    }
}
