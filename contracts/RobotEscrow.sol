// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title RobotEscrow
/// @notice 2-of-3 escrow for robot work orders: client, robot, and AI arbiter.
contract RobotEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status {
        None,
        Funded,
        Disputed,
        Released,
        Refunded
    }

    struct Escrow {
        address client;
        address robot;
        address arbiter;
        address token;
        uint256 amount;
        bytes32 workHash;
        uint8 releaseApprovals;
        uint8 refundApprovals;
        Status status;
        uint64 createdAt;
        uint64 settledAt;
    }

    uint8 private constant CLIENT_BIT = 1;
    uint8 private constant ROBOT_BIT = 2;
    uint8 private constant ARBITER_BIT = 4;

    uint256 public nextEscrowId = 1;
    mapping(uint256 => Escrow) public escrows;

    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed client,
        address indexed robot,
        address arbiter,
        address token,
        uint256 amount,
        bytes32 workHash
    );
    event ReleaseApproved(uint256 indexed escrowId, address indexed signer, uint8 approvals);
    event RefundApproved(uint256 indexed escrowId, address indexed signer, uint8 approvals);
    event DisputeRaised(uint256 indexed escrowId, address indexed reporter, string reason);
    event FundsReleased(uint256 indexed escrowId, address indexed robot, uint256 amount);
    event FundsRefunded(uint256 indexed escrowId, address indexed client, uint256 amount);

    modifier onlyFundedOrDisputed(uint256 escrowId) {
        Status status = escrows[escrowId].status;
        require(status == Status.Funded || status == Status.Disputed, "RobotEscrow: escrow is settled");
        _;
    }

    function createNativeEscrow(
        address robot,
        address arbiter,
        bytes32 workHash
    ) external payable returns (uint256 escrowId) {
        require(msg.value > 0, "RobotEscrow: amount required");
        escrowId = _createEscrow(msg.sender, robot, arbiter, address(0), msg.value, workHash);
    }

    function createTokenEscrow(
        address token,
        address robot,
        address arbiter,
        uint256 amount,
        bytes32 workHash
    ) external nonReentrant returns (uint256 escrowId) {
        require(token != address(0), "RobotEscrow: token required");
        require(amount > 0, "RobotEscrow: amount required");
        uint256 balanceBefore = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        require(
            IERC20(token).balanceOf(address(this)) - balanceBefore == amount,
            "RobotEscrow: fee-on-transfer token unsupported"
        );
        escrowId = _createEscrow(msg.sender, robot, arbiter, token, amount, workHash);
    }

    function approveRelease(uint256 escrowId)
        external
        nonReentrant
        onlyFundedOrDisputed(escrowId)
    {
        Escrow storage escrow = escrows[escrowId];
        uint8 signerBit = _participantBit(escrow, msg.sender);
        require((escrow.releaseApprovals & signerBit) == 0, "RobotEscrow: release already approved");

        escrow.releaseApprovals |= signerBit;
        emit ReleaseApproved(escrowId, msg.sender, escrow.releaseApprovals);

        if (_approvalCount(escrow.releaseApprovals) >= 2) {
            _release(escrowId, escrow);
        }
    }

    function approveRefund(uint256 escrowId)
        external
        nonReentrant
        onlyFundedOrDisputed(escrowId)
    {
        Escrow storage escrow = escrows[escrowId];
        uint8 signerBit = _participantBit(escrow, msg.sender);
        require((escrow.refundApprovals & signerBit) == 0, "RobotEscrow: refund already approved");

        escrow.refundApprovals |= signerBit;
        escrow.status = Status.Disputed;
        emit RefundApproved(escrowId, msg.sender, escrow.refundApprovals);

        if (_approvalCount(escrow.refundApprovals) >= 2) {
            _refund(escrowId, escrow);
        }
    }

    function raiseDispute(uint256 escrowId, string calldata reason)
        external
        onlyFundedOrDisputed(escrowId)
    {
        Escrow storage escrow = escrows[escrowId];
        _participantBit(escrow, msg.sender);
        escrow.status = Status.Disputed;
        emit DisputeRaised(escrowId, msg.sender, reason);
    }

    function getEscrow(uint256 escrowId) external view returns (Escrow memory) {
        return escrows[escrowId];
    }

    function hasReleaseApproval(uint256 escrowId, address signer) external view returns (bool) {
        Escrow storage escrow = escrows[escrowId];
        return (escrow.releaseApprovals & _participantBit(escrow, signer)) != 0;
    }

    function hasRefundApproval(uint256 escrowId, address signer) external view returns (bool) {
        Escrow storage escrow = escrows[escrowId];
        return (escrow.refundApprovals & _participantBit(escrow, signer)) != 0;
    }

    function _createEscrow(
        address client,
        address robot,
        address arbiter,
        address token,
        uint256 amount,
        bytes32 workHash
    ) internal returns (uint256 escrowId) {
        require(robot != address(0), "RobotEscrow: robot required");
        require(arbiter != address(0), "RobotEscrow: arbiter required");
        require(robot != client, "RobotEscrow: robot cannot be client");
        require(arbiter != client && arbiter != robot, "RobotEscrow: arbiter must be distinct");

        escrowId = nextEscrowId++;
        escrows[escrowId] = Escrow({
            client: client,
            robot: robot,
            arbiter: arbiter,
            token: token,
            amount: amount,
            workHash: workHash,
            releaseApprovals: 0,
            refundApprovals: 0,
            status: Status.Funded,
            createdAt: uint64(block.timestamp),
            settledAt: 0
        });

        emit EscrowCreated(escrowId, client, robot, arbiter, token, amount, workHash);
    }

    function _release(uint256 escrowId, Escrow storage escrow) private {
        escrow.status = Status.Released;
        escrow.settledAt = uint64(block.timestamp);
        _transferFunds(escrow.token, escrow.robot, escrow.amount);
        emit FundsReleased(escrowId, escrow.robot, escrow.amount);
    }

    function _refund(uint256 escrowId, Escrow storage escrow) private {
        escrow.status = Status.Refunded;
        escrow.settledAt = uint64(block.timestamp);
        _transferFunds(escrow.token, escrow.client, escrow.amount);
        emit FundsRefunded(escrowId, escrow.client, escrow.amount);
    }

    function _transferFunds(address token, address recipient, uint256 amount) private {
        if (token == address(0)) {
            (bool sent, ) = recipient.call{value: amount}("");
            require(sent, "RobotEscrow: native transfer failed");
        } else {
            IERC20(token).safeTransfer(recipient, amount);
        }
    }

    function _participantBit(Escrow storage escrow, address signer) private view returns (uint8) {
        require(escrow.status != Status.None, "RobotEscrow: unknown escrow");
        if (signer == escrow.client) return CLIENT_BIT;
        if (signer == escrow.robot) return ROBOT_BIT;
        if (signer == escrow.arbiter) return ARBITER_BIT;
        revert("RobotEscrow: signer is not a participant");
    }

    function _approvalCount(uint8 approvals) private pure returns (uint8 count) {
        if ((approvals & CLIENT_BIT) != 0) count++;
        if ((approvals & ROBOT_BIT) != 0) count++;
        if ((approvals & ARBITER_BIT) != 0) count++;
    }
}
