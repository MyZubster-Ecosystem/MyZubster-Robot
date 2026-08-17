"use strict";

const { ethers } = require("hardhat");

async function main() {
  const escrow = await ethers.deployContract("RobotEscrow");
  await escrow.waitForDeployment();
  process.stdout.write(`${await escrow.getAddress()}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});
