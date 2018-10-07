'use strict';

const {defaults} = require('lodash');
const NodeMailer = require('nodemailer');
const NodeMailerHtmlToText = require('nodemailer-html-to-text');

module.exports = {
  name: 'Mail',

  inputSchema: {
    type: 'object'
  },

  unary: async options => {
    options = defaults(options, {
      from: 'info@localhost',
      to: 'info@localhost',
      subject: '',
      html: '',
      headers: {},
      attachments: [],
      messageId: null
    });

    const transporter = NodeMailer.createTransport(process.env.SMTP);
    const htmlToText = NodeMailerHtmlToText.htmlToText;
    transporter.use('compile', htmlToText());
    return new Promise((resolve, reject) => {
      transporter.sendMail({
        from: options.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        headers: options.headers,
        attachments: options.attachments,
        messageId: options.messageId
      }, err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
};
