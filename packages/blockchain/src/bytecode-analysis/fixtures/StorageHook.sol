// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// Synthetic: beforeSwap CALLs then SSTOREs.
contract StorageHook {
    uint256 public last;

    function beforeSwap(address, bytes calldata) external {
        assembly {
            let ok := call(gas(), caller(), 0, 0, 0, 0, 0)
            sstore(0, 1)
        }
    }
}
