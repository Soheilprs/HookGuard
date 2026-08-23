// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// Synthetic: beforeSwap CALLs an address loaded from calldata.
contract DynamicTargetHook {
    function beforeSwap(address, bytes calldata data) external {
        address target = abi.decode(data, (address));
        target.call("");
    }
}
