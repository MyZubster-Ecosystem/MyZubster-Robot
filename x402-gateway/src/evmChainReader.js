"use strict";

const { Contract, JsonRpcProvider } = require("ethers");

const ABI = [
  "function getEscrow(uint256 escrowId) view returns ((address client,address robot,address arbiter,address token,uint256 amount,bytes32 workHash,uint8 releaseApprovals,uint8 refundApprovals,uint8 status,uint64 createdAt,uint64 settledAt))",
  "event FundsReleased(uint256 indexed escrowId,address indexed robot,uint256 amount)",
  "event FundsRefunded(uint256 indexed escrowId,address indexed client,uint256 amount)"
];
const STATUSES = ["none", "funded", "disputed", "released", "refunded"];

class EvmChainReader {
  constructor({ rpcUrl, provider, contractFactory, fromBlock = 0 } = {}) {
    this.provider = provider || new JsonRpcProvider(requireValue(rpcUrl, "rpcUrl"));
    this.contractFactory = contractFactory || ((address) => new Contract(address, ABI, this.provider));
    this.fromBlock = Number(fromBlock);
    if (!Number.isSafeInteger(this.fromBlock) || this.fromBlock < 0) {
      throw new Error("fromBlock must be a non-negative safe integer");
    }
  }

  async getEscrow({ contractAddress, escrowId }) {
    const contract = this.contractFactory(contractAddress);
    const [record, observedBlock] = await Promise.all([
      contract.getEscrow(escrowId),
      this.provider.getBlockNumber()
    ]);
    const status = STATUSES[Number(record.status)];
    if (!status || status === "none") throw new Error("on-chain escrow does not exist");

    const result = {
      clientAddress: record.client,
      robotAddress: record.robot,
      arbiterAddress: record.arbiter,
      tokenAddress: record.token,
      amount: record.amount.toString(),
      workHash: record.workHash,
      releaseApprovals: Number(record.releaseApprovals),
      refundApprovals: Number(record.refundApprovals),
      status,
      transactionHash: null,
      blockNumber: observedBlock,
      blockTimestamp: null
    };

    if (status === "released" || status === "refunded") {
      const filter = status === "released"
        ? contract.filters.FundsReleased(escrowId)
        : contract.filters.FundsRefunded(escrowId);
      const events = await contract.queryFilter(filter, this.fromBlock, observedBlock);
      const settlement = events.at(-1);
      if (!settlement) throw new Error(`missing ${status} settlement event`);
      const block = await this.provider.getBlock(settlement.blockNumber);
      result.transactionHash = settlement.transactionHash;
      result.blockNumber = settlement.blockNumber;
      result.blockTimestamp = new Date(Number(block.timestamp) * 1000).toISOString();
    }
    return result;
  }
}

function requireValue(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

module.exports = { ABI, EvmChainReader, STATUSES };
