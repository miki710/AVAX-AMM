import { ethers } from "hardhat";
import { BaseContract, ContractTransaction } from "ethers";
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("AMM", function () {
  async function deployContract() {
    const [owner, otherAccount] = await ethers.getSigners();

    const amountForOther = ethers.parseEther("5000");

    const USDCToken = await ethers.getContractFactory("USDCToken");
    const usdc = await USDCToken.deploy();
    await usdc.waitForDeployment(); // 新しい待機方法
    const usdcAddress = await usdc.getAddress();
    console.log("USDC address:", usdcAddress);
    
    await usdc.faucet(otherAccount.address, amountForOther);

    const JOEToken = await ethers.getContractFactory("JOEToken");
    const joe = await JOEToken.deploy();
    await joe.waitForDeployment(); // 新しい待機方法
    const joeAddress = await joe.getAddress();
    console.log("JOE address:", joeAddress);

    await joe.faucet(otherAccount.address, amountForOther);

    
    // アドレスの有効性確認
    if (!ethers.isAddress(usdcAddress) || !ethers.isAddress(joeAddress)) {
        throw new Error("Token addresses are not valid");
    }

    const AMM = await ethers.getContractFactory("AMM");
    const amm = await AMM.deploy(usdc, joe); // コントラクトインスタンスを直接渡す
    await amm.waitForDeployment(); // 新しい待機方法
    console.log("AMM address:", await amm.getAddress());

    return {
      amm,
      token0: usdc,
      token1: joe,
      owner,
      otherAccount,
    };
  }

  describe("provide", function () {
    it("Token should be moved", async function () {
      const { amm, token0, token1, owner } = await loadFixture(deployContract);

      const ownerBalance0Before = await token0.balanceOf(owner.address);
      const ownerBalance1Before = await token1.balanceOf(owner.address);

      const ammBalance0Before = await token0.balanceOf(await amm.getAddress());
      const ammBalance1Before = await token1.balanceOf(await amm.getAddress());

      // ethers v6 では parseEther が ethers.parseEther として直接利用可能
      const amountProvide0 = ethers.parseEther("100");
      const amountProvide1 = ethers.parseEther("200");

      await token0.approve(await amm.getAddress(), amountProvide0);
      await token1.approve(await amm.getAddress(), amountProvide1);
      await amm.provide(
        await token0.getAddress(),
        amountProvide0,
        await token1.getAddress(),
        amountProvide1
      );

      expect(await token0.balanceOf(owner.address)).to.equal(
        ownerBalance0Before - amountProvide0
      );
      expect(await token1.balanceOf(owner.address)).to.equal(
        ownerBalance1Before - amountProvide1
      );

      expect(await token0.balanceOf(await amm.getAddress())).to.equal(
        ammBalance0Before + amountProvide0
      );
      expect(await token1.balanceOf(await amm.getAddress())).to.equal(
        ammBalance1Before + amountProvide1
      );
    });
  });

  interface AMM extends BaseContract {
    provide(token0: string, amount0: bigint, token1: string, amount1: bigint): Promise<ContractTransaction>;
    PRECISION(): Promise<bigint>;
    totalShare(): Promise<bigint>;
    share(address: string): Promise<bigint>;
    totalAmount(token: string): Promise<bigint>;
    getEquivalentToken(token: string, amount: bigint): Promise<bigint>;
    getWithdrawEstimate(token: string, share: bigint): Promise<bigint>;
    withdraw(share: bigint): Promise<ContractTransaction>;
    getSwapEstimateOut(inToken: string, amountIn: bigint): Promise<bigint>;
    getSwapEstimateIn(outToken: string, amountOut: bigint): Promise<bigint>;
    swap(inToken: string, outToken: string, amountIn: bigint): Promise<bigint>;
  }

  async function deployContractWithLiquidity() {
    const { token0, token1, owner, otherAccount } = await loadFixture(
      deployContract
    );

    const AMMFactory = await ethers.getContractFactory("AMM");
    const amm = await AMMFactory.deploy(await token0.getAddress(), await token1.getAddress()) as unknown as AMM;
    await amm.waitForDeployment();


    // token0とtoken1を正しい型にキャストします
    const token0WithApprove = token0 as unknown as {
        approve: (spender: string, amount: bigint) => Promise<any>;
        connect: (signer: any) => any;
    };
    const token1WithApprove = token1 as unknown as { 
        approve: (spender: string, amount: bigint) => Promise<any>;
        connect: (signer: any) => any;
    };
  
    const amountOwnerProvided0 = ethers.parseEther("100");
    const amountOwnerProvided1 = ethers.parseEther("200");
  
    await token0.approve(await amm.getAddress(), amountOwnerProvided0);
    await token1.approve(await amm.getAddress(), amountOwnerProvided1);
    await amm.provide(
      await token0.getAddress(),
      amountOwnerProvided0,
      await token1.getAddress(),
      amountOwnerProvided1
    );
  
    const amountOtherProvided0 = ethers.parseEther("10");
    const amountOtherProvided1 = ethers.parseEther("20");
  
    await token0WithApprove.connect(otherAccount).approve(await amm.getAddress(), amountOtherProvided0);
    await token1WithApprove.connect(otherAccount).approve(await amm.getAddress(), amountOtherProvided1);
    await (amm.connect(otherAccount) as unknown as AMM)
      .provide(
        await token0.getAddress(),
        amountOtherProvided0,
        await token1.getAddress(),
        amountOtherProvided1
      );
  
    return {
      amm,
      token0,
      amountOwnerProvided0,
      amountOtherProvided0,
      token1,
      amountOwnerProvided1,
      amountOtherProvided1,
      owner,
      otherAccount,
    };
  }
  
  // deployContractWithLiquidity 後の初期値のチェックをします。
  describe("Deploy with liquidity", function () {
    it("Should set the right number of amm details", async function () {
      const {
        amm,
        token0,
        amountOwnerProvided0,
        amountOtherProvided0,
        token1,
        amountOwnerProvided1,
        amountOtherProvided1,
        owner,
        otherAccount,
      } = await loadFixture(deployContractWithLiquidity)
  
      const precision = await amm.PRECISION();
      const BN100 = 100n; // bigintリテラルを使用
      const BN10 = 10n;
  
      expect(await amm.totalShare()).to.equal((BN100 + BN10) * precision);
      expect(await amm.share(owner.address)).to.equal(BN100 * precision);
      expect(await amm.share(otherAccount.address)).to.equal(BN10 * precision);
      expect(await amm.totalAmount(await token0.getAddress())).to.equal(
        amountOwnerProvided0 + amountOtherProvided0
      );
      expect(await amm.totalAmount(await token1.getAddress())).to.equal(
        amountOwnerProvided1 + amountOtherProvided1
      );
    });
  });

  describe("getEquivalentToken", function () {
    it("Should get the right number of equivalent token", async function () {
      const { amm, token0, token1 } = await loadFixture(
        deployContractWithLiquidity
      ) as { amm: AMM, token0: any, token1: any };
  
      const totalToken0 = await amm.totalAmount(await token0.getAddress());
      const totalToken1 = await amm.totalAmount(await token1.getAddress());
      const amountProvide0 = ethers.parseEther("10");
      // totalToken0 : totalToken1 = amountProvide0 : equivalentToken1
      const equivalentToken1 = (amountProvide0 * totalToken1) / totalToken0;
  
      expect(
        await amm.getEquivalentToken(await token0.getAddress(), amountProvide0)
      ).to.equal(equivalentToken1);
    });
  });
  
  describe("getWithdrawEstimate", function () {
    it("Should get the right number of estimated amount", async function () {
      const {
        amm,
        token0,
        amountOtherProvided0,
        token1,
        amountOtherProvided1,
        otherAccount,
      } = await loadFixture(deployContractWithLiquidity);
  
      // otherAccountのシェアの取得
      const share = await amm.share(otherAccount.address);
  
      expect(await amm.getWithdrawEstimate(await token0.getAddress(), share)).to.eql(
        amountOtherProvided0
      );
      expect(await amm.getWithdrawEstimate(await token1.getAddress(), share)).to.eql(
        amountOtherProvided1
      );
    });
  });

  describe("withdraw", function () {
    it("Token should be moved", async function () {
      const {
        amm,
        token0,
        amountOwnerProvided0,
        token1,
        amountOwnerProvided1,
        owner,
      } = await loadFixture(deployContractWithLiquidity);
  
      const ownerBalance0Before = await token0.balanceOf(owner.address);
      const ownerBalance1Before = await token1.balanceOf(owner.address);
  
      const ammBalance0Before = await token0.balanceOf(await amm.getAddress());
      const ammBalance1Before = await token1.balanceOf(await amm.getAddress());
  
      const share = await amm.share(owner.address);
      await amm.withdraw(share);
  
      expect(await token0.balanceOf(owner.address)).to.eql(
        ownerBalance0Before + amountOwnerProvided0
      );
      expect(await token1.balanceOf(owner.address)).to.eql(
        ownerBalance1Before + amountOwnerProvided1
      );
  
      expect(await token0.balanceOf(await amm.getAddress())).to.eql(
        ammBalance0Before - amountOwnerProvided0
      );
      expect(await token1.balanceOf(await amm.getAddress())).to.eql(
        ammBalance1Before - amountOwnerProvided1
      );
    });
  
    it("Should set the right number of amm details", async function () {
      const {
        amm,
        token0,
        amountOwnerProvided0,
        token1,
        amountOwnerProvided1,
        owner,
        otherAccount,
      } = await loadFixture(deployContractWithLiquidity);
  
      // otherAccountが全てのシェア分引き出し
      const share = await amm.share(otherAccount.address);
      await (amm.connect(otherAccount) as unknown as AMM).withdraw(share);
  
      const precision = await amm.PRECISION();
      const BN100 = 100n;
  
      expect(await amm.totalShare()).to.equal(BN100 * precision);
      expect(await amm.share(owner.address)).to.equal(BN100 * precision);
      expect(await amm.share(otherAccount.address)).to.equal(0);
      expect(await amm.totalAmount(await token0.getAddress())).to.equal(
        amountOwnerProvided0
      );
      expect(await amm.totalAmount(await token1.getAddress())).to.equal(
        amountOwnerProvided1
      );
    });
  });

  describe("getSwapEstimateOut", function () {
    it("Should get the right number of token", async function () {
      const { amm, token0, token1 } = await loadFixture(
        deployContractWithLiquidity
      );
  
      const totalToken0 = await amm.totalAmount(await token0.getAddress());
      const totalToken1 = await amm.totalAmount(await token1.getAddress());
  
      const amountInToken0 = ethers.parseEther("10");
      // basic formula: k = x * y
      // fee = 0.3%
      const amountInToken0WithFee = amountInToken0 * 997n;
      const amountReceiveToken1 = (amountInToken0WithFee * totalToken1)/(totalToken0 * 1000n + amountInToken0WithFee);
  
      expect(await amm.getSwapEstimateOut(await token0.getAddress(), amountInToken0)).to.eql(
        amountReceiveToken1
      );
    });
  });
  
  describe("getSwapEstimateIn", function () {
    it("Should get the right number of token", async function () {
      const { amm, token0, token1 } = await loadFixture(
        deployContractWithLiquidity
      );
  
      const totalToken0 = await amm.totalAmount(await token0.getAddress());
      const totalToken1 = await amm.totalAmount(await token1.getAddress());
  
      const amountOutToken1 = ethers.parseEther("10");
      // basic formula: k = x * y
      // fee = 0.3%
      const numerator = BigInt(totalToken0) * BigInt(amountOutToken1) * 1000n;
        const denominator = 997n * (BigInt(totalToken1) - BigInt(amountOutToken1));
        const amountInToken0 = numerator / denominator;
  
      expect(await amm.getSwapEstimateIn(await token1.getAddress(), amountOutToken1)).to.be.closeTo(
        amountInToken0,
        ethers.parseEther("0.1") // より大きな許容誤差
      );
    });
  
    it("Should revert if the amount of out token exceed the total", async function () {
      const { amm, token1, amountOwnerProvided1, amountOtherProvided1 } =
        await loadFixture(deployContractWithLiquidity);
  
      const amountSendToken1 = amountOwnerProvided1 + amountOtherProvided1 + 1n;
  
      await expect(
        amm.getSwapEstimateIn(await token1.getAddress(), amountSendToken1)
      ).to.be.revertedWith("Insufficient pool balance");
    });
  });

  describe("swap", function () {
    it("Should set the right number of amm details", async function () {
      const {
        amm,
        token0,
        amountOwnerProvided0,
        amountOtherProvided0,
        token1,
        amountOwnerProvided1,
        amountOtherProvided1,
      } = await loadFixture(deployContractWithLiquidity);
  
      const amountSendToken0 = ethers.parseEther("10");
      const amountReceiveToken1 = await amm.getSwapEstimateOut(
        await token0.getAddress(),
        amountSendToken0
      );
  
      await token0.approve(await amm.getAddress(), amountSendToken0);
      await amm.swap(await token0.getAddress(), await token1.getAddress(), amountSendToken0);
  
      expect(await amm.totalAmount(await token0.getAddress())).to.equal(
        amountOwnerProvided0 + amountOtherProvided0 + amountSendToken0
      );
      expect(await amm.totalAmount(await token1.getAddress())).to.equal(
        amountOwnerProvided1 + amountOtherProvided1 - amountReceiveToken1
      );
    });
  
    it("Token should be moved", async function () {
      const { amm, token0, token1, owner } = await loadFixture(
        deployContractWithLiquidity
      );
  
      const ownerBalance0Before = await token0.balanceOf(owner.address);
      const ownerBalance1Before = await token1.balanceOf(owner.address);
  
      const ammBalance0Before = await token0.balanceOf(await amm.getAddress());
      const ammBalance1Before = await token1.balanceOf(await amm.getAddress());
  
      const amountSendToken0 = ethers.parseEther("10");
      const amountReceiveToken1 = await amm.getSwapEstimateOut(
        await token0.getAddress(),
        amountSendToken0
      );
  
      await token0.approve(await amm.getAddress(), amountSendToken0);
      await amm.swap(await token0.getAddress(), await token1.getAddress(), amountSendToken0);
  
      expect(await token0.balanceOf(owner.address)).to.eql(
        ownerBalance0Before - amountSendToken0
      );
      expect(await token1.balanceOf(owner.address)).to.eql(
        ownerBalance1Before + amountReceiveToken1
      );

      const ammAddress = await amm.getAddress();
  
      expect(await token0.balanceOf(ammAddress)).to.eql(
        ammBalance0Before + amountSendToken0
      );
      expect(await token1.balanceOf(ammAddress)).to.eql(
        ammBalance1Before - amountReceiveToken1
      );
    });
  });
});