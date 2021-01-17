const { ethers } = require("hardhat")
const { expect } = require("chai")
describe("NarwhaleToken", function () {
  before(async function () {
    this.NarwhaleToken = await ethers.getContractFactory("NarwhaleToken")
    this.signers = await ethers.getSigners()
    this.alice = this.signers[0]
    this.bob = this.signers[1]
    this.carol = this.signers[2]
  })

  beforeEach(async function () {
    this.narwhale = await this.NarwhaleToken.deploy()
    await this.narwhale.deployed()
  })

  it("should have correct name and symbol and decimal", async function () {
    const name = await this.narwhale.name()
    const symbol = await this.narwhale.symbol()
    const decimals = await this.narwhale.decimals()
    expect(name, "Narwhale")
    expect(symbol, "NAWA")
    expect(decimals, "18")
  })

  it("should only allow owner to mint token", async function () {
    await this.narwhale.mint(this.alice.address, "100")
    await this.narwhale.mint(this.bob.address, "1000")
    await expect(this.narwhale.connect(this.bob).mint(this.carol.address, "1000", { from: this.bob.address })).to.be.revertedWith(
      "Ownable: caller is not the owner"
    )
    const totalSupply = await this.narwhale.totalSupply()
    const aliceBal = await this.narwhale.balanceOf(this.alice.address)
    const bobBal = await this.narwhale.balanceOf(this.bob.address)
    const carolBal = await this.narwhale.balanceOf(this.carol.address)
    expect(totalSupply).to.equal("1100")
    expect(aliceBal).to.equal("100")
    expect(bobBal).to.equal("1000")
    expect(carolBal).to.equal("0")
  })

  it("should supply token transfers properly", async function () {
    await this.narwhale.mint(this.alice.address, "100")
    await this.narwhale.mint(this.bob.address, "1000")
    await this.narwhale.transfer(this.carol.address, "10")
    await this.narwhale.connect(this.bob).transfer(this.carol.address, "100", {
      from: this.bob.address,
    })
    const totalSupply = await this.narwhale.totalSupply()
    const aliceBal = await this.narwhale.balanceOf(this.alice.address)
    const bobBal = await this.narwhale.balanceOf(this.bob.address)
    const carolBal = await this.narwhale.balanceOf(this.carol.address)
    expect(totalSupply, "1100")
    expect(aliceBal, "90")
    expect(bobBal, "900")
    expect(carolBal, "110")
  })

  it("should fail if you try to do bad transfers", async function () {
    await this.narwhale.mint(this.alice.address, "100")
    await expect(this.narwhale.transfer(this.carol.address, "110")).to.be.revertedWith("ERC20: transfer amount exceeds balance")
    await expect(this.narwhale.connect(this.bob).transfer(this.carol.address, "1", { from: this.bob.address })).to.be.revertedWith(
      "ERC20: transfer amount exceeds balance"
    )
  })
})
