const { ethers } = require("ethers");

async function main() {
  const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
  const address = "0xD88b67ca80fCBD126fF0405F0de899911d78eb78";
  
  const ethBalance = await provider.getBalance(address);
  console.log("ETH Balance:", ethers.formatEther(ethBalance), "ETH");
  
  const usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const usdcAbi = ["function balanceOf(address) view returns (uint256)"];
  const usdc = new ethers.Contract(usdcAddress, usdcAbi, provider);
  
  const usdcBalance = await usdc.balanceOf(address);
  console.log("USDC Balance:", ethers.formatUnits(usdcBalance, 6), "USDC");
}

main().catch(console.error);
