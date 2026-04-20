const jwt = require('jsonwebtoken');
const crypto = require('crypto')
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const fs = require('fs/promises');
const path = require('path');
require('dotenv').config();
const saltRounds = 10;
const config = require("../config/config")
const moment = require('moment-timezone');

const emailTemplateDirectory = path.join(__dirname, '..', 'views', 'emails');
const emailLogoPath = path.join(__dirname, '..', 'public', 'images', 'ultivic_230.png');






const createToken = async (roles, user_id, username,name, email,working_schedule) => {
    return new Promise((resolve, reject) => {
        jwt.sign({ roles, user_id, username,name, email,working_schedule }, process.env.JWT_SECRET, (err, token) => {
            if (err) {
                reject(err);
            } else {
                resolve(token);
            }
        });
    });
};





const passwordResetToken = async () => {
    const resetToken = await crypto.randomBytes(32).toString('hex')

    this.passwordResetToken = await crypto.createHash('sha256').update(resetToken).digest('hex')
    this.passwordResetExpiresIn = Date.now() + 10 * 60 * 1000
    return resetToken
}





const encrypt_password = async (password) => {
    const passwordValidationRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).+$/;
    if (!passwordValidationRegex.test(password)) {
        throw new Error("Password must contain at least one uppercase letter and one special character.");
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword
}





const password_compare = async (user_password, password) => {
    try {
        const match = await bcrypt.compare(password, user_password);
        return match;
    } catch (error) {
        console.error('Error comparing passwords:', error);
        throw error;
    }
}





const escape_html = (value) => {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}





const render_email_template = async (templateName, locals = {}) => {
    const normalizedTemplateName = templateName.endsWith('.html') ? templateName : `${templateName}.html`;
    const templatePath = path.join(emailTemplateDirectory, normalizedTemplateName);
    const templateSource = await fs.readFile(templatePath, 'utf8');

    return templateSource.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
        return escape_html(locals[key]);
    });
}





const send_email = async (options) => {
    try {
        const emailPort = Number(config.development.email_port);
        const transporter = nodemailer.createTransport({
            host: config.development.email_host,
            port: emailPort,
            secure: emailPort === 465,
            auth: {
                user: config.development.email_username,
                pass: config.development.email_password,
            }
        });

        const html = options.html || (options.template ? await render_email_template(options.template, options.locals) : undefined);


        const mailOptions = {
            from: 'Ultivic',
            to: options.email,
            subject: options.subject,
            text: options.text || options.message,
            html,
            attachments: [
                {
                    filename: 'ultivic_230.png',
                    path: emailLogoPath,
                    cid: 'ultivic-logo'
                },
                ...(options.attachments || [])
            ]
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};






function find_the_total_time(mark_time) {

    let current_time = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
    let current_date = current_time.split(' ')[0];

    let mark_time_full = `${current_date} ${mark_time}`;

    let current_moment = moment(current_time, 'YYYY-MM-DD HH:mm:ss');
    let mark_moment = moment(mark_time_full, 'YYYY-MM-DD HH:mm:ss');
    

    let duration = moment.duration(current_moment.diff(mark_moment));

    let hours = Math.floor(duration.asHours());
    let minutes = duration.minutes();
    let seconds = duration.seconds();

    let time_difference = `${hours}:${minutes}:${seconds}`

    return time_difference;  
}





function convertToSeconds(time) {
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return (hours * 3600) + (minutes * 60) + seconds;
}


function convertToHHMMSS(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}





module.exports = { createToken, passwordResetToken, encrypt_password, password_compare, send_email, render_email_template, find_the_total_time,convertToSeconds,convertToHHMMSS }


