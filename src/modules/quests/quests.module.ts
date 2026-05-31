import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { QuestsService } from "./quests.service";
import { QuestsController } from "./quests.controller";
import { Quest, QuestSchema } from "./schemas/quest.schema";
import { QuestProgress, QuestProgressSchema } from "./schemas/quest-progress.schema";
import { TokenModule } from "../token/token.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quest.name, schema: QuestSchema },
      { name: QuestProgress.name, schema: QuestProgressSchema },
    ]),
    TokenModule,
  ],
  controllers: [QuestsController],
  providers: [QuestsService],
  exports: [QuestsService],
})
export class QuestsModule {}
