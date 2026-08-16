"use strict";

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RobotEscrow", function () {
  let escrow;
  let client;
  let robot;
  let arbiter;
  let outsider;
  const amount = ethers.parseEther("1");
  const workHash = ethers.keccak256(ethers.toUtf8Bytes("job-1"));

  beforeEach(async function () {
    [client, robot, arbiter, outsider] = await ethers.getSigners();
    escrow = await ethers.deployContract("RobotEscrow");
    await escrow.waitForDeployment();
  });

  async function createNative(robotAddress = robot.address) {
    await escrow.connect(client).createNativeEscrow(robotAddress, arbiter.address, workHash, {
      value: amount
    });
    return 1n;
  }

  for (const [label, first, second] of [
    ["client + robot", "client", "robot"],
    ["client + arbiter", "client", "arbiter"],
    ["robot + arbiter", "robot", "arbiter"]
  ]) {
    it(`releases native funds with ${label}`, async function () {
      const id = await createNative();
      const actors = { client, robot, arbiter };
      await escrow.connect(actors[first]).approveRelease(id);
      await escrow.connect(actors[second]).approveRelease(id);
      expect((await escrow.getEscrow(id)).status).to.equal(3n);
      expect(await ethers.provider.getBalance(await escrow.getAddress())).to.equal(0n);
    });
  }

  it("rejects duplicate approvals and unauthorized callers", async function () {
    const id = await createNative();
    await escrow.connect(client).approveRelease(id);
    await expectRevert(escrow.connect(client).approveRelease(id), "release already approved");
    await expectRevert(escrow.connect(outsider).approveRelease(id), "not a participant");
  });

  it("supports disputes and 2-of-3 refunds", async function () {
    const id = await createNative();
    await escrow.connect(robot).raiseDispute(id, "work site unavailable");
    expect((await escrow.getEscrow(id)).status).to.equal(2n);
    await escrow.connect(client).approveRefund(id);
    await escrow.connect(arbiter).approveRefund(id);
    expect((await escrow.getEscrow(id)).status).to.equal(4n);
    await expectRevert(escrow.connect(robot).approveRelease(id), "escrow is settled");
  });

  it("transfers standard ERC-20 funds", async function () {
    const token = await ethers.deployContract("TestToken");
    await token.mint(client.address, amount);
    await token.connect(client).approve(await escrow.getAddress(), amount);
    await escrow.connect(client).createTokenEscrow(
      await token.getAddress(), robot.address, arbiter.address, amount, workHash
    );
    await escrow.connect(client).approveRelease(1);
    await escrow.connect(arbiter).approveRelease(1);
    expect(await token.balanceOf(robot.address)).to.equal(amount);
  });

  it("supports non-standard no-return ERC-20 tokens through SafeERC20", async function () {
    const token = await ethers.deployContract("NoReturnToken");
    await token.mint(client.address, amount);
    await token.connect(client).approve(await escrow.getAddress(), amount);
    await escrow.connect(client).createTokenEscrow(
      await token.getAddress(), robot.address, arbiter.address, amount, workHash
    );
    await escrow.connect(client).approveRelease(1);
    await escrow.connect(arbiter).approveRelease(1);
    expect(await token.balanceOf(robot.address)).to.equal(amount);
  });

  it("rejects false-return and fee-on-transfer tokens", async function () {
    const falseToken = await ethers.deployContract("FalseReturnToken");
    await falseToken.mint(client.address, amount);
    await falseToken.connect(client).approve(await escrow.getAddress(), amount);
    await expectRevert(
      escrow.connect(client).createTokenEscrow(
        await falseToken.getAddress(), robot.address, arbiter.address, amount, workHash
      ),
      "SafeERC20FailedOperation"
    );

    const feeToken = await ethers.deployContract("FeeOnTransferToken");
    await feeToken.mint(client.address, amount);
    await feeToken.connect(client).approve(await escrow.getAddress(), amount);
    await expectRevert(
      escrow.connect(client).createTokenEscrow(
        await feeToken.getAddress(), robot.address, arbiter.address, amount, workHash
      ),
      "fee-on-transfer token unsupported"
    );
  });

  it("blocks a native recipient from re-entering settlement", async function () {
    const reentrantRobot = await ethers.deployContract("ReentrantRobot", [await escrow.getAddress()]);
    const id = await createNative(await reentrantRobot.getAddress());
    await reentrantRobot.setEscrowId(id);
    await escrow.connect(client).approveRelease(id);
    await reentrantRobot.approveRelease();
    expect((await escrow.getEscrow(id)).status).to.equal(3n);
    expect(await reentrantRobot.reentrySucceeded()).to.equal(false);
  });
});

async function expectRevert(promise, expected) {
  try {
    await promise;
    expect.fail("expected transaction to revert");
  } catch (error) {
    expect(String(error)).to.include(expected);
  }
}
