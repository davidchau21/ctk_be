import { Injectable, Logger, OnModuleInit, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Quest, QuestDocument } from "./schemas/quest.schema";
import { QuestProgress, QuestProgressDocument } from "./schemas/quest-progress.schema";
import { TokenService } from "../token/token.service";

@Injectable()
export class QuestsService implements OnModuleInit {
  private readonly logger = new Logger(QuestsService.name);

  constructor(
    @InjectModel(Quest.name) private readonly questModel: Model<QuestDocument>,
    @InjectModel(QuestProgress.name) private readonly questProgressModel: Model<QuestProgressDocument>,
    private readonly tokenService: TokenService
  ) {}

  /**
   * Auto-seed default quests when the module starts.
   */
  async onModuleInit() {
    const defaultQuests = [
      {
        key: "daily_login",
        title: "Điểm danh hàng ngày",
        description: "Truy cập ứng dụng mỗi ngày để nhận ngay 10 CTK.",
        rewardAmount: 10,
        isActive: true,
      },
      {
        key: "wallet_connect",
        title: "Liên kết ví MetaMask",
        description: "Kết nối ví Web3 thành công lần đầu tiên để nhận 50 CTK.",
        rewardAmount: 50,
        isActive: true,
      },
      {
        key: "first_swap",
        title: "Thực hiện giao dịch Swap",
        description: "Hoàn thành giao dịch hoán đổi token đầu tiên trên sàn để nhận 20 CTK.",
        rewardAmount: 20,
        isActive: true,
      },
      {
        key: "referral",
        title: "Mời bạn bè tham gia",
        description: "Nhận 100 CTK khi giới thiệu thành viên mới liên kết ví thành công.",
        rewardAmount: 100,
        isActive: true,
      },
    ];

    for (const q of defaultQuests) {
      const exists = await this.questModel.findOne({ key: q.key });
      if (!exists) {
        await this.questModel.create(q);
        this.logger.log(`Seeded default quest: ${q.key}`);
      }
    }
  }

  /**
   * Retrieves all active quests along with the specific user's progress.
   */
  async getUserQuests(userId: string) {
    const activeQuests = await this.questModel.find({ isActive: true });
    const userObjectId = new Types.ObjectId(userId);

    // Get all progresses for the user
    const progresses = await this.questProgressModel.find({ userId: userObjectId });

    // Build start/end of today for daily login check
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setUTCHours(23, 59, 59, 999);

    return activeQuests.map((quest) => {
      // Find user progress matching this quest
      let progress = progresses.find((p) => p.questKey === quest.key);

      // Special handling for daily repeatable login quest
      if (quest.key === "daily_login") {
        // Find if there is a daily login progress recorded today
        const todayProgress = progresses.find(
          (p) => p.questKey === "daily_login" && p.createdAt >= startOfToday && p.createdAt <= endOfToday
        );
        progress = todayProgress;
      }

      return {
        id: quest._id,
        key: quest.key,
        title: quest.title,
        description: quest.description,
        rewardAmount: quest.rewardAmount,
        status: progress ? progress.status : "pending", // pending, completed, claimed
        completedAt: progress?.completedAt || null,
        claimedAt: progress?.claimedAt || null,
        txHash: progress?.txHash || null,
        userWalletAddress: progress?.userWalletAddress || null,
      };
    });
  }

  /**
   * Completes a quest. Triggered internally by backend events.
   */
  async completeQuest(userId: string, questKey: string): Promise<QuestProgressDocument | null> {
    const quest = await this.questModel.findOne({ key: questKey, isActive: true });
    if (!quest) {
      this.logger.warn(`Attempted to complete non-existent or inactive quest: ${questKey}`);
      return null;
    }

    const userObjectId = new Types.ObjectId(userId);

    if (questKey === "daily_login") {
      // Check if already completed/claimed today
      const startOfToday = new Date();
      startOfToday.setUTCHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setUTCHours(23, 59, 59, 999);

      const todayProgress = await this.questProgressModel.findOne({
        userId: userObjectId,
        questKey: "daily_login",
        createdAt: { $gte: startOfToday, $lte: endOfToday },
      });

      if (todayProgress) {
        this.logger.log(`User ${userId} already completed daily login quest today.`);
        return todayProgress;
      }

      // Record daily login quest as completed!
      const newProgress = await this.questProgressModel.create({
        userId: userObjectId,
        questKey: "daily_login",
        status: "completed",
        completedAt: new Date(),
      });
      this.logger.log(`User ${userId} completed daily login quest.`);
      return newProgress;
    } else {
      // One-time quests (wallet_connect, first_swap, referral)
      const existingProgress = await this.questProgressModel.findOne({
        userId: userObjectId,
        questKey,
      });

      if (existingProgress) {
        this.logger.log(`Quest ${questKey} already completed/claimed for user ${userId}.`);
        return existingProgress;
      }

      const newProgress = await this.questProgressModel.create({
        userId: userObjectId,
        questKey,
        status: "completed",
        completedAt: new Date(),
      });
      this.logger.log(`User ${userId} completed one-time quest: ${questKey}`);
      return newProgress;
    }
  }

  /**
   * Claims a quest reward into the User's Accumulated In-Game Wallet off-chain (instant, zero gas fees!).
   */
  async claimQuestReward(userId: string, questKey: string, walletAddress: string) {
    const userObjectId = new Types.ObjectId(userId);

    // 1. Verify the quest exists
    const quest = await this.questModel.findOne({ key: questKey, isActive: true });
    if (!quest) {
      throw new NotFoundException("Nhiệm vụ không tồn tại hoặc đã bị vô hiệu hóa.");
    }

    // 2. Fetch the appropriate progress entry
    let progress: QuestProgressDocument | null = null;

    if (questKey === "daily_login") {
      const startOfToday = new Date();
      startOfToday.setUTCHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setUTCHours(23, 59, 59, 999);

      progress = await this.questProgressModel.findOne({
        userId: userObjectId,
        questKey: "daily_login",
        createdAt: { $gte: startOfToday, $lte: endOfToday },
      });
    } else {
      progress = await this.questProgressModel.findOne({
        userId: userObjectId,
        questKey,
      });
    }

    if (!progress) {
      throw new BadRequestException("Bạn chưa hoàn thành nhiệm vụ này để nhận thưởng.");
    }

    if (progress.status === "claimed") {
      throw new BadRequestException("Bạn đã nhận thưởng cho nhiệm vụ này rồi.");
    }

    if (progress.status !== "completed") {
      throw new BadRequestException("Nhiệm vụ chưa sẵn sàng để nhận thưởng.");
    }

    // 3. Mark progress as claimed off-chain (in-game wallet balance increases)
    progress.status = "claimed";
    progress.claimedAt = new Date();
    await progress.save();

    this.logger.log(`User ${userId} claimed ${quest.rewardAmount} CTK off-chain into In-Game Wallet for quest ${questKey}`);
    return {
      success: true,
      message: `Đã nhận thành công ${quest.rewardAmount} CTK vào Ví Game tích lũy của bạn!`,
    };
  }

  /**
   * Batch-withdraws all accumulated in-game rewards on-chain to the connected Web3 wallet.
   */
  async withdrawAccumulatedRewards(userId: string, walletAddress: string) {
    const userObjectId = new Types.ObjectId(userId);

    // 1. Find all claimed quest progresses that do NOT have a txHash (i.e. not yet withdrawn on-chain)
    const claimedProgresses = await this.questProgressModel.find({
      userId: userObjectId,
      status: "claimed",
      $or: [
        { txHash: null },
        { txHash: "" },
        { txHash: { $exists: false } }
      ]
    });

    if (!claimedProgresses || claimedProgresses.length === 0) {
      throw new BadRequestException("Không có số dư CTK tích lũy khả dụng nào để rút.");
    }

    // 2. Fetch corresponding quest configurations to calculate total reward sum
    const questKeys = claimedProgresses.map((p) => p.questKey);
    const quests = await this.questModel.find({ key: { $in: questKeys } });

    let totalAmount = 0;
    for (const progress of claimedProgresses) {
      const quest = quests.find((q) => q.key === progress.questKey);
      if (quest) {
        totalAmount += quest.rewardAmount;
      }
    }

    if (totalAmount <= 0) {
      throw new BadRequestException("Số dư khả dụng bằng 0.");
    }

    // 3. Mint the total accumulated amount on-chain using TokenService in one transaction
    this.logger.log(`Withdrawing total of ${totalAmount} CTK to wallet address: ${walletAddress}...`);
    const mintResult = await this.tokenService.mintReward(walletAddress, totalAmount);

    if (!mintResult.success) {
      throw new BadRequestException(mintResult.message || "Giao dịch rút tiền lên blockchain thất bại.");
    }

    // 4. Update all claimed progresses with the transaction hash and wallet address
    for (const progress of claimedProgresses) {
      progress.txHash = mintResult.txHash;
      progress.userWalletAddress = walletAddress;
      await progress.save();
    }

    this.logger.log(`Successfully completed withdrawal of ${totalAmount} CTK to ${walletAddress}. Tx: ${mintResult.txHash}`);
    return {
      success: true,
      message: `Rút thành công ${totalAmount} CTK về ví Web3!`,
      amount: totalAmount,
      txHash: mintResult.txHash,
    };
  }
}
