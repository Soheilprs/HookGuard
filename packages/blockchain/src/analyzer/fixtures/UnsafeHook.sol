// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// Synthetic unsafe Uniswap v4-style hook for HookGuard tests.
/// Not a deployable IHooks implementation. Patterns only.
contract UnsafeHook {
    uint256 public lastSwap;
    uint24 public fee;
    address public oracle;
    address public hooked;
    address public target;

    function beforeSwap(address sender, bytes calldata hookData) external returns (bytes4, int256, uint24) {
        (bool ok, ) = sender.call("");
        lastSwap = 1;
        int256 delta = abi.decode(hookData, (int256));
        return (this.beforeSwap.selector, delta, 0);
    }

    function afterSwap(address sender) external {
        sender.delegatecall("");
    }

    function beforeAddLiquidity(address sender) external {
        sender.call("");
        lastSwap = 2;
    }

    function afterAddLiquidity(address) external {}

    function beforeRemoveLiquidity(address) external {}

    function afterRemoveLiquidity(address) external {}

    function setFee(uint24 newFee) external {
        fee = newFee;
    }

    function setOracle(address newOracle) external {
        oracle = newOracle;
    }

    function setHook(address newHook) external {
        hooked = newHook;
    }

    function withdraw(address to, uint256 amount) external {
        to.call{value: amount}("");
    }

    function rescueTokens(address token, uint256 amount) external {
        token.call(abi.encodeWithSelector(bytes4(0xa9059cbb), msg.sender, amount));
    }

    function upgradeTo(address newImplementation) external {
        target = newImplementation;
    }

    function pause() external {
        lastSwap = 0;
    }
}
