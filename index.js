const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
const PORT = 8080;

app.use(cors());

const RPC_URL = process.env.RPC_URL;
const TOKEN_CONTRACT_ADDRESS = process.env.TOKEN_CONTRACT_ADDRESS;
const TOKEN_ABI = [
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address owner) view returns (uint256)"
];
const LOCKED_WALLETS = [
    // "0xLockedWalletAddress1",
    // "0xLockedWalletAddress2"
];
const BURN_ADDRESS = "0x0000000000000000000000000000000000000000";

const provider = new ethers.JsonRpcProvider(RPC_URL);
const tokenContract = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_ABI, provider);

const getCirculatingSupply = async () => {
    const totalSupply = await tokenContract.totalSupply();
    let lockedTokens = 0;

    for (const wallet of LOCKED_WALLETS) {
        const balance = await tokenContract.balanceOf(wallet);
        lockedTokens = lockedTokens.add(balance);
    }

    const burnedTokens = await tokenContract.balanceOf(BURN_ADDRESS);

    const circulatingSupply = BigInt(totalSupply) - BigInt(lockedTokens) - BigInt(burnedTokens);

    return circulatingSupply;
};

app.get('/circulating', async (req, res) => {
    try {
        const circulatingSupply = await getCirculatingSupply();
        res.json({ result: circulatingSupply.toString() });
    } catch (error) {
        console.error("Error fetching circulating supply:", error);
        res.status(500).json({ error: "Failed to fetch circulating supply" });
    }
});

app.get('/totalsupply', async (req, res) => {
    try {
        const totalSupply = await tokenContract.totalSupply();
        res.send({ result: totalSupply.toString() });
    } catch (error) {
        console.error("Error fetching total supply:", error);
        res.status(500).json({ error: "Failed to fetch total supply" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});