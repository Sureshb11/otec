import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transporter: nodemailer.Transporter | null;
  private readonly from: string;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    const port = parseInt(this.config.get<string>('SMTP_PORT', '587'), 10);
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASSWORD');
    this.from = this.config.get<string>('MAIL_FROM', 'no-reply@otec.local');

    if (host && user && pass) {
      this.enabled = true;
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`SMTP transport configured for ${host}:${port}`);
    } else {
      this.enabled = false;
      this.transporter = null;
      this.logger.warn('SMTP not configured — emails will be logged, not sent');
    }
  }

  async send(opts: { to: string; subject: string; html: string; text?: string }): Promise<void> {
    if (!this.enabled || !this.transporter) {
      this.logger.log(
        `[DEV email] to=${opts.to} subject=${opts.subject}\n${opts.text ?? opts.html}`,
      );
      return;
    }
    await this.transporter.sendMail({
      from: this.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    });
  }
}
