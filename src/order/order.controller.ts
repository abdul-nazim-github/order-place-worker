import { Controller, Post, Body, Logger } from '@nestjs/common';
import { InjectQueue, InjectFlowProducer } from '@nestjs/bullmq';
import { Queue, FlowProducer } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './dto/order.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';

@Controller('orders')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(
    // @InjectQueue('order-mail-queue') private readonly mailQueue: Queue,
    @InjectFlowProducer('order-flow-producer')
    private readonly flowProducer: FlowProducer,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  @Post()
  async placeOrder(@Body() createOrderDto: CreateOrderDto) {
    this.logger.log(`Placing order: ${createOrderDto.orderId}`);

    // 1. Save to Database
    const order = new Order();
    order.orderId = createOrderDto.orderId;
    order.userName = createOrderDto.user.name;
    order.userEmail = createOrderDto.user.email;
    order.totalAmount = createOrderDto.totalAmount;

    order.items = createOrderDto.items.map((itemDto) => {
      const item = new OrderItem();
      item.productId = itemDto.productId;
      item.name = itemDto.name;
      item.quantity = itemDto.quantity;
      item.price = itemDto.price;
      return item;
    });

    await this.orderRepository.save(order);
    this.logger.log(`Order ${createOrderDto.orderId} saved to database`);

    // 2. Create a Flow of jobs
    // Parent job: finalize-order (runs after all children are done)
    // Children: individual email jobs
    await this.flowProducer.add({
      name: 'finalize-order',
      queueName: 'order-mail-queue',
      data: { orderId: createOrderDto.orderId },
      children: [
        {
          name: 'send-user-confirmation',
          data: createOrderDto,
          queueName: 'order-mail-queue',
        },
        {
          name: 'send-admin-notification',
          data: createOrderDto,
          queueName: 'order-mail-queue',
        },
        {
          name: 'send-warehouse-notification',
          data: createOrderDto,
          queueName: 'order-mail-queue',
        },
        ...createOrderDto.items.map((item) => ({
          name: 'send-vendor-notification',
          data: { orderData: createOrderDto, item },
          queueName: 'order-mail-queue',
        })),
      ],
    });

    this.logger.log(`Flow created for order ${createOrderDto.orderId}`);

    return {
      success: true,
      message: 'Order placed successfully. Email flow initiated.',
      orderId: createOrderDto.orderId,
    };
  }
}
