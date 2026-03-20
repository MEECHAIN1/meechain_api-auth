import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.RITUAL_RPC_URL || 'http://localhost:8545';

async function checkRpc() {
    console.log(`Checking RPC endpoint: ${RPC_URL}...`);

    try {
        const response = await axios.post(RPC_URL, {
            jsonrpc: "2.0",
            method: "web3_clientVersion",
            params: [],
            id: 1
        });

        const clientVersion = response.data.result;
        console.log(`Client Version: ${clientVersion}`);

        if (clientVersion.toLowerCase().includes('hardhat') || clientVersion.toLowerCase().includes('anvil')) {
            console.error("❌ ERROR: RPC endpoint is still Hardhat/Anvil. Please switch to a real Ritual node.");
            process.exit(1);
        }

        const blockResponse = await axios.post(RPC_URL, {
            jsonrpc: "2.0",
            method: "eth_blockNumber",
            params: [],
            id: 2
        });

        const blockNumber = parseInt(blockResponse.data.result, 16);
        console.log(`Current Block Number: ${blockNumber}`);

        if (blockNumber === 0) {
            console.error("❌ ERROR: Block number is 0. Node is not synced or is a fresh local instance.");
            process.exit(1);
        }

        console.log("✅ RPC check passed! Ready for deployment.");
    } catch (error) {
        console.error(`❌ ERROR: Failed to connect to RPC endpoint: ${error.message}`);
        process.exit(1);
    }
}

checkRpc();
