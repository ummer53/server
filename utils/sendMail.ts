require('dotenv').config();
import nodeMailer, { Transporter } from 'nodemailer';
import ejs from 'ejs';
import path from 'path';

interface IEmailOptions {
	email: string;
	subject: string;
	template: string;
	data: {
		[key: string]: any;
	};
}

const sendEmail = async (options: IEmailOptions): Promise<void> => {
	//	console.log('sendEmail');
	const transporter: Transporter = nodeMailer.createTransport({
		host: process.env.SMTP_HOST,
		port: parseInt(process.env.SMTP_PORT || '587'),
		// port: Number(process.env.SMTP_PORT),
		service: process.env.SMTP_SERVICE,
		auth: {
			user: process.env.SMTP_EMAIL,
			pass: process.env.SMTP_PASSWORD,
		},
	});

	//	console.log('transporter', transporter);

	const { email, subject, template, data } = options;

	// console.log(
	// 	` email: ${email} subject: ${subject} template: ${template} data: ${data}`
	// );

	// get the html template

	const templatePath = path.join(__dirname + `../../mails`, template);
	//	console.log('templatePath', templatePath);
	//render email teplate with ejs

	const html: string = await ejs.renderFile(templatePath, data);

	//	console.log('data', data);

	const mailOptions = {
		from: process.env.SMTP_EMAIL,
		to: email,
		subject,
		html,
	};

	//	console.log(` html :${html}`);

	await transporter.sendMail(mailOptions);
};

export default sendEmail;
