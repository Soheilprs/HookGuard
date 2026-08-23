// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// Synthetic safer Uniswap v4-style hook for HookGuard tests.
/// Not a deployable IHooks implementation. Patterns only.
contract SafeHook {
    uint256 public lastSwap;
    uint24 public fee;
    address public oracle;
    address public hooked;
    address public owner;
    address public constant ROUTER = 0x1111111111111111111111111111111111111111;

    modifier onlyOwner() {
        require(msg.sender == owner, "own");
        _;
    }

    function beforeSwap(address sender, bytes calldata hookData) external returns (bytes4, int256, uint24) {
        lastSwap = 1;
        ROUTER.call("");
        return (this.beforeSwap.selector, int256(0), 0);
    }

    function afterSwap(address) external {}

    function beforeAddLiquidity(address) external {}

    function afterAddLiquidity(address) external {}

    function beforeRemoveLiquidity(address) external {}

    function afterRemoveLiquidity(address) external {}

    function setFee(uint24 newFee) external onlyOwner {
        fee = newFee;
    }

    function setOracle(address newOracle) external onlyOwner {
        oracle = newOracle;
    }

    function setHook(address newHook) external onlyOwner {
        hooked = newHook;
    }
}
