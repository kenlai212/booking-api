const express = require("express");
require("dotenv").config();

const lipslideCommon = require("lipslide-common");
const {logger} = lipslideCommon;

const routes = require("./src/routes");

//catch all uncaught rejects and excpetions
process.on("unhandledRejection", (ex) => {
	logger.error("WE GOT AN UNHANDLED REJECTION!!!!!!!");
	logger.error(ex);
});

process.on("uncaughtException", (ex) => {
	logger.error("WE GOT AN UNCAUGHT EXCEPTION!!!!!!!");
	logger.error(ex);
});

//init kafka topics
const topics = [
	{topic: process.env.NEW_BOOKING_TOPIC}
]
lipslideCommon.createKafkaTopics(process.env.KAFKA_CLIENT_ID, process.env.KAFKA_BROKERS.split(" "), topics)
.catch(error => {
	logger.error(`Error while creating kafka topics : ${error}`);
});

//init mongo connection
lipslideCommon.initMongoDb(process.env.BOOKING_DB_CONNECTION_URL);

const app = express();
app.use(express.json());
app.use("/", routes);
app.listen(process.env.PORT, function (err) {
	if (err) {
		logger.error(`Error while starting Booking API : ${err}`);
		throw err;
	}

	logger.info(`Booking API started up. Listening to port : ${process.env.PORT}`);
});