import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

export class MailProcessor extends WorkerHost {
  process(job: Job<any, any, string>): void {
    // Implement your mail sending logic here
    console.log(`Processing job ${job.id} of type ${job.name}`);
    // For example, use a mail service to send emails
  }
}
