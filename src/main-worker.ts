import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('WorkerBootstrap');

  // We can use the same AppModule, but we could also create a WorkerModule
  // that only imports what's necessary for the worker.
  // For simplicity and to ensure all dependencies are available, we use AppModule.
  const app = await NestFactory.createApplicationContext(AppModule);

  logger.log('BullMQ Worker is running and waiting for jobs...');

  // The worker is started automatically by @nestjs/bullmq when the module is initialized.
  // We don't need to call any specific start method.

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM signal received: closing worker...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('SIGINT signal received: closing worker...');
    await app.close();
    process.exit(0);
  });
}

bootstrap();
