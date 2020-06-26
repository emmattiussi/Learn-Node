const nodemailer = require('nodemailer')
const pug = require('pug')
const juice = require('juice')
const htmlToText = require('html-to-text')
const promisify = require('es6-promisify')

// Transport - way you interface with different ways of sending email, SMTP being most common

const transport = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
})

const generateHTML = (filename, options = {}) => {
    const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options) // dirname = present directory, i.e. handlers, no matter where this runs.
    const inlined = juice(html)
    return inlined
}

exports.send = async (options) => {
  const html = generateHTML(options.filename, options)
  const text = htmlToText.fromString(html)
  const mailOptions = {
    from: `Restaurant App <noreply@app.com>`,
    to: options.user.email,
    subject: options.subject,
    html,
    text
  }
  const sendMail = promisify(transport.sendMail, transport)
  return sendMail(mailOptions)
}