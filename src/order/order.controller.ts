import { Body, Controller, Logger, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateOrderDto } from './dto/order.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Controller('orders')
export class OrderController {
  private readonly logger = new Logger(OrderController.name);

  constructor(
    @InjectQueue('mail-queue') private readonly mailQueue: Queue,
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

    void this.mailQueue.add('send-order-confirmation', createOrderDto);

    this.logger.log(`Flow created for order ${createOrderDto.orderId}`);

    return {
      success: true,
      message: 'Order placed successfully. Email flow initiated.',
      orderId: createOrderDto.orderId,
    };
  }
}
