// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {RobotEscrow} from "../RobotEscrow.sol";

contract TestToken is ERC20 {
    constructor() ERC20("Test Token", "TEST") {}

    function mint(address recipient, uint256 amount) external {
        _mint(recipient, amount);
    }
}

contract NoReturnToken {
    string public constant name = "No Return Token";
    string public constant symbol = "NRT";
    uint8 public constant decimals = 18;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address recipient, uint256 amount) external {
        balanceOf[recipient] += amount;
    }

    function approve(address spender, uint256 amount) external {
        allowance[msg.sender][spender] = amount;
    }

    function transfer(address recipient, uint256 amount) external {
        _transfer(msg.sender, recipient, amount);
    }

    function transferFrom(address sender, address recipient, uint256 amount) external {
        allowance[sender][msg.sender] -= amount;
        _transfer(sender, recipient, amount);
    }

    function _transfer(address sender, address recipient, uint256 amount) private {
        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
    }
}

contract FeeOnTransferToken is ERC20 {
    constructor() ERC20("Fee Token", "FEE") {}

    function mint(address recipient, uint256 amount) external {
        _mint(recipient, amount);
    }

    function _update(address from, address to, uint256 amount) internal override {
        if (from != address(0) && to != address(0)) {
            uint256 fee = amount / 100;
            super._update(from, address(0xdead), fee);
            amount -= fee;
        }
        super._update(from, to, amount);
    }
}

contract FalseReturnToken is ERC20 {
    constructor() ERC20("False Return Token", "FALSE") {}

    function mint(address recipient, uint256 amount) external {
        _mint(recipient, amount);
    }

    function transferFrom(address, address, uint256) public pure override returns (bool) {
        return false;
    }
}

contract ReentrantRobot {
    RobotEscrow public immutable escrow;
    uint256 public escrowId;
    bool public reentrySucceeded;

    constructor(RobotEscrow escrow_) {
        escrow = escrow_;
    }

    function setEscrowId(uint256 escrowId_) external {
        escrowId = escrowId_;
    }

    function approveRelease() external {
        escrow.approveRelease(escrowId);
    }

    receive() external payable {
        (reentrySucceeded,) = address(escrow).call(
            abi.encodeCall(RobotEscrow.approveRefund, (escrowId))
        );
    }
}
