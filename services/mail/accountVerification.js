const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
        user: process.env.MAIL_USERNAME, // replace with your Mailtrap user
        pass: process.env.MAIL_PASSWORD  // replace with your Mailtrap password
    }
});

exports.send_mail = async (mail_data, res)=>{
    console.log(__dirname);
    ejs.renderFile(
        path.join(__dirname, '../../views/mail', 'account_verification.ejs'),
        mail_data,
        (err, data) => {
            if (err) {
                return res.status(500).send('Error rendering email template\n'+err);
            }

            // Email options
            const mailOptions = {
                from: `"No Reply" ${process.env.MAIL_FROM_ADDRESS}`,
                to: 'recipient@example.com', // replace with actual recipient email
                subject: 'Email Verification',
                html: data
            };

            // Send email
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return res.status(500).send('Error sending email');
                }
                res.status(200).send('Email sent: ' + info.response);
            });
        }
    );
}