import { connect } from './utils/db';
import { app } from './app';
require('dotenv').config();

app.listen(process.env.PORT, () => {
	console.log(`Listening on port ${process.env.PORT}`);
	connect();
});
