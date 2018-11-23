import { config } from 'firebase-functions';

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(config().sendgrid.key);

export class SendMail {
  static async sendEmail(recipient, from, subject, body, attachments?) {
    try {
      return sgMail.send({
        to: recipient,
        from: from,
        subject: subject,
        text: body,
        attachments: attachments
      });
    } catch (e) {
      console.error('Failed to send email: ', e);
    }
  };
}