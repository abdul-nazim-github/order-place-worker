import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { MailService } from './mail.service';

@Processor('order-mail-queue')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing job ${JSON.stringify(job)} of type ${job.name}`);
    this.logger.log(
      `MailProcessor: ${MailProcessor.name}, Job Data: ${JSON.stringify(job.data)}`,
    );

    switch (job.name) {
      case 'send-user-confirmation':
        await this.mailService.sendOrderConfirmation(job.data);
        break;
      case 'send-admin-notification':
        await this.mailService.sendAdminNotification(job.data);
        break;
      case 'send-warehouse-notification':
        await this.mailService.sendWarehouseNotification(job.data);
        break;
      case 'send-vendor-notification':
        await this.mailService.sendVendorNotification(job.data.orderData, job.data.item);
        break;
      case 'finalize-order':
        this.logger.log(`All emails sent for Order: ${job.data.orderId}. Finalizing...`);
        break;
      case 'send-order-mails':
        await this.handleSendOrderMails(job.data);
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleSendOrderMails(data: any) {
    const { orderId } = data;

    // Idempotency check: In a real app, you'd check a database or Redis
    // to see if emails for this orderId were already sent.
    this.logger.log(`Handling order emails for Order ID: ${orderId}`);

    try {
      // Send all emails asynchronously
      const emailPromises = [
        this.mailService.sendOrderConfirmation(data),
        this.mailService.sendAdminNotification(data),
        this.mailService.sendWarehouseNotification(data),
      ];

      // Add item-wise vendor notifications
      if (data.items && Array.isArray(data.items)) {
        data.items.forEach((item: any) => {
          emailPromises.push(
            this.mailService.sendVendorNotification(data, item),
          );
        });
      }

      await Promise.all(emailPromises);

      this.logger.log(
        `Successfully processed all emails for Order ID: ${orderId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process emails for Order ID: ${orderId}`,
        error.stack,
      );
      throw error; // Rethrow to trigger BullMQ retry
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed with error: ${error.message}`);
  }
}
