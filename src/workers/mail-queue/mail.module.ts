import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MailProcessor } from './mail.processors';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'mail-queue',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    }),
  ],
  providers: [MailProcessor],
  exports: [BullModule],
})
export class MailQueueModule {}
