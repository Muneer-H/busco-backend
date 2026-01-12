import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import fs from 'fs';
import path from 'path';

@Injectable()
export class MailService {
  public transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    handlebars.registerHelper('currentYear', function () {
      return new Date().getFullYear();
    });
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    });
  }

  public async SendMail(
    templateName: string,
    data: Record<string, any>,
    mailOptions: nodemailer.SendMailOptions,
  ) {
    const html = fs.readFileSync(
      path.join(__dirname, `../templates/${templateName}.html`),
      'utf8',
    );
    const template = handlebars.compile(html);

    mailOptions.from = mailOptions.from
      ? mailOptions.from
      : this.configService.get('SMTP_FROM');

    mailOptions.html = template(data);
    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(info);
    } catch (e) {
      console.log(e.stack);
      console.log(e.message);
    }
  }
}
