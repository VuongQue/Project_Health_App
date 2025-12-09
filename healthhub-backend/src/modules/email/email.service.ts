import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;
  private logger = new Logger(EmailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,   // Gmail
        pass: process.env.EMAIL_PASS,   // App password
      },
    });
  }

  async sendOtp(email: string, otp: string) {
    await this.transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Verification Code',
      html: `<h2>Your OTP code is</h2>
             <h1>${otp}</h1>
             <p>This code will expire in 5 minutes.</p>`
    });

    this.logger.log(`OTP sent to ${email}`);
  }
}
