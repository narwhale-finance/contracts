async function main() {

    const [deployer, user] = await ethers.getSigners();

    console.log(
        "Deploying contracts with the account:",
        deployer.address
    );

    console.log(
        "User address:",
        user.address
    );


    //Log the account balance
    console.log("Account balance:", (await deployer.getBalance()).toString());
    const devAddress = await deployer.address;
    console.log("Dev Address: ", devAddress);

    //Init the contracts to be deployed
    const NarwhaleToken = await ethers.getContractFactory("NarwhaleToken");
    const School = await ethers.getContractFactory("School"); 
    const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
    const UniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory");
    const UniswapV2Pair = await ethers.getContractFactory("UniswapV2Pair")

    //Narwhale
    const token = await NarwhaleToken.deploy();
    await token.deployed();

    //School
    const school = await School.deploy(token.address, devAddress, "1000", "7918316", "79183160")
    await school.deployed();

    //Transfer the ownership to School
    await token.transferOwnership(school.address)

    //Deploy UniswapV2Factory
    const uniswap = await UniswapV2Factory.deploy(devAddress)
    await uniswap.deployed();
    
    //Deploy mock ERC2
    const erc20mock = await ERC20Mock.deploy("MockToken", "LPT", "1000000000000000000000000");
    await erc20mock.deployed();

    //Create mock/token pair
    const pair = await uniswap.createPair(erc20mock.address, token.address);
    const lp = await UniswapV2Pair.attach((await pair.wait()).events[0].args.pair);
    console.log(lp.address);

    //Add LP token pool
    await school.connect(deployer).add('50', lp.address, true);

    //Transfer to second account
    await erc20mock.transfer(user.address, "99990000000000000000000");

    //Check current pool length
    const poolsBefore = await school.poolLength();
    console.log("Pool length before: ", poolsBefore.toNumber());
    
    //Add ERC20Mock farm pool
    await school.connect(deployer).add('100', erc20mock.address, true);

    //Check pool length after adding a farm
    const poolsAfter = await school.poolLength();
    console.log("Pool length after: ", poolsAfter.toNumber());

    //Deposit ERC20 to school from second account
    const tx = await erc20mock.connect(user).approve(school.address, "10000000000000000000000", { from: user.address });
    await tx.wait();
    await school.connect(user).deposit(0, "10000000000000000000000", { from: user.address });


    console.log("NarwhaleToken address:", token.address);
    console.log("School address:", school.address);
    console.log("LPToken:", erc20mock.address);

}

main()
    .then(() => process.exit(0))
    .then(function(tx) {
        wait();
    })
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
