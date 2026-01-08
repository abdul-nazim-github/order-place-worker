import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('MAIL_SERVER'),
      port: this.configService.get('MAIL_PORT'),
      auth: {
        user: this.configService.get('MAIL_USERNAME'),
        pass: this.configService.get('MAIL_PASSWORD'),
      },
    });
  }

  async sendOrderConfirmation(payload: any) {
    const { user, orderId, items, totalAmount } = payload;
    const itemDetails = items
      .map((item: any) => `- ${item.name} (x${item.quantity}): $${item.price}`)
      .join('\n');

    const mailOptions = {
      from: this.configService.get('MAIL_FROM'),
      to: user.email,
      subject: `Order Confirmation - #${orderId}`,
      text: `Hi ${user.name},\n\nThank you for your order!\n\nOrder ID: ${orderId}\nItems:\n${itemDetails}\n\nTotal Amount: $${totalAmount}\n\nWe will notify you when your order is shipped.`,
    };

    this.logger.log(`Sending order confirmation email to ${user.email} for order #${orderId}`);
    await this.transporter.sendMail(mailOptions);
    this.logger.log(`Email sent successfully to ${user.email}`);
  }

  async sendAdminNotification(payload: any) {
    const { orderId, items, totalAmount } = payload;
    const adminEmail = this.configService.get('ADMIN_EMAIL');
    const itemDetails = items
      .map((item: any) => `- ${item.name} (x${item.quantity}): $${item.price}`)
      .join('\n');

    const mailOptions = {
      from: this.configService.get('MAIL_FROM'),
      to: adminEmail,
      subject: `New Order Received - #${orderId}`,
      text: `A new order has been placed.\n\nOrder ID: ${orderId}\nItems:\n${itemDetails}\n\nTotal Amount: $${totalAmount}`,
    };

    this.logger.log(`Sending admin notification email for order #${orderId}`);
    await this.transporter.sendMail(mailOptions);
    this.logger.log(`Admin notified successfully`);
  }

  async sendVendorNotification(payload: any, item: any) {
    const { orderId } = payload;
    // In a real app, you'd fetch the vendor email based on the item/product
    const vendorEmail = `vendor-${item.productId}@example.com`;

    const mailOptions = {
      from: this.configService.get('MAIL_FROM'),
      to: vendorEmail,
      subject: `New Order for Item: ${item.name} - #${orderId}`,
      text: `Hello Vendor,\n\nYou have a new order for:\n- ${item.name} (x${item.quantity})\n\nPlease prepare it for shipping.`,
    };

    this.logger.log(`Sending vendor notification to ${vendorEmail} for item ${item.productId}`);
    await this.transporter.sendMail(mailOptions);
    this.logger.log(`Vendor ${vendorEmail} notified successfully`);
  }

  async sendWarehouseNotification(payload: any) {
    const { orderId, items } = payload;
    const warehouseEmail = 'warehouse@example.com';

    const mailOptions = {
      from: this.configService.get('MAIL_FROM'),
      to: warehouseEmail,
      subject: `Packing List - Order #${orderId}`,
      text: `Warehouse Team,\n\nPlease pack the following items for Order #${orderId}:\n${items.map((i: any) => `- ${i.name} x ${i.quantity}`).join('\n')}`,
    };

    this.logger.log(`Sending warehouse notification for order #${orderId}`);
    await this.transporter.sendMail(mailOptions);
    this.logger.log(`Warehouse notified successfully`);
  }
}
