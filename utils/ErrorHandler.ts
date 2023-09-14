export class ErrorHandler extends Error {
	statusCode: Number;
	message: any;

	constructor(statusCode: Number, message: any) {
		super(message);
		this.statusCode = statusCode;
		this.message = message;

		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = { ErrorHandler };
