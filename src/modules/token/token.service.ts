import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ethers } from "ethers";
import { CryptoTrackerTokenABI } from "./token.abi";

@Injectable()
export class TokenService implements OnModuleInit {
  private readonly logger = new Logger(TokenService.name);
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;
  
  private contractAddress: string = "";
  private isSimulationMode = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const rpcUrl = this.configService.get<string>("SEPOLIA_RPC_URL") || this.configService.get<string>("RPC_URL") || this.configService.get<string>("BSC_TESTNET_RPC_URL");
    const privateKey = this.configService.get<string>("ADMIN_PRIVATE_KEY");
    this.contractAddress = this.configService.get<string>("CONTRACT_ADDRESS") || "";

    if (!rpcUrl || !privateKey || !this.contractAddress) {
      this.logger.warn(
        "Blockchain environment variables (SEPOLIA_RPC_URL/RPC_URL/BSC_TESTNET_RPC_URL, ADMIN_PRIVATE_KEY, CONTRACT_ADDRESS) are missing. Running in SIMULATION MODE."
      );
      this.isSimulationMode = true;
      return;
    }

    try {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(this.contractAddress, CryptoTrackerTokenABI, this.wallet);
      this.logger.log(`Initialized TokenService for contract at: ${this.contractAddress}`);
    } catch (error) {
      this.logger.error("Failed to initialize ethers provider/wallet:", error);
      this.isSimulationMode = true;
    }
  }

  /**
   * Mints CTK tokens to a user's wallet as a reward.
   */
  async mintReward(
    userAddress: string,
    amount: number
  ): Promise<{ success: boolean; txHash?: string; message?: string }> {
    if (!ethers.isAddress(userAddress)) {
      return { success: false, message: "Địa chỉ ví không hợp lệ." };
    }

    if (this.isSimulationMode) {
      const mockHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      this.logger.log(`[Simulation] Minted ${amount} CTK to ${userAddress}. Tx: ${mockHash}`);
      return { success: true, txHash: mockHash, message: "Giao dịch thành công (Mô phỏng)" };
    }

    try {
      const amountWei = ethers.parseEther(amount.toString());
      this.logger.log(`Minting ${amount} CTK to ${userAddress}...`);
      
      const tx = await this.contract!.mint(userAddress, amountWei);
      this.logger.log(`Transaction sent: ${tx.hash}. Waiting for confirmation...`);
      
      const receipt = await tx.wait();
      this.logger.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      
      return { success: true, txHash: tx.hash, message: "Giao dịch đúc token thành công!" };
    } catch (error: any) {
      this.logger.error(`Error minting tokens to ${userAddress}:`, error);
      return { success: false, message: error.message || "Lỗi khi thực hiện giao dịch blockchain." };
    }
  }

  /**
   * Retrieves the CTK token balance of a user's wallet.
   */
  async getBalance(userAddress: string): Promise<string> {
    if (!ethers.isAddress(userAddress)) {
      return "0";
    }

    if (this.isSimulationMode) {
      return "100.0";
    }

    try {
      const balanceWei = await this.contract!.balanceOf(userAddress);
      return ethers.formatEther(balanceWei);
    } catch (error) {
      this.logger.error(`Error fetching balance for ${userAddress}:`, error);
      return "0";
    }
  }

  /**
   * Gets details about the deployed token contract.
   */
  async getTokenInfo() {
    if (this.isSimulationMode) {
      return {
        name: "CryptoTracker Token (Simulated)",
        symbol: "CTK",
        totalSupply: "10000000.0",
        contractAddress: this.contractAddress || "0xSimulatedContractAddress",
        isSimulation: true
      };
    }

    try {
      const name = await this.contract!.name();
      const symbol = await this.contract!.symbol();
      const totalSupplyWei = await this.contract!.totalSupply();
      return {
        name,
        symbol,
        totalSupply: ethers.formatEther(totalSupplyWei),
        contractAddress: this.contractAddress,
        isSimulation: false
      };
    } catch (error) {
      this.logger.error("Error fetching token info:", error);
      return {
        name: "CryptoTracker Token",
        symbol: "CTK",
        totalSupply: "0.0",
        contractAddress: this.contractAddress,
        isSimulation: false
      };
    }
  }
}
