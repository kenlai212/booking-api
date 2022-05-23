const express = require("express");
const config = require('config');

const lipslideCommon = require("lipslide-common");
const {logger} = lipslideCommon;

const routes = require("./src/routes");
const utility = require("./src/utility");
const worker = require("./src/worker");

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
	{topic: config.get("kafka.topics.newBooking")},
	{topic: config.get("kafka.topics.confirmBooking")},
	{topic: config.get("kafka.topics.fulfillBooking")},
	{topic: config.get("kafka.topics.cancelBooking")}
]
lipslideCommon.createKafkaTopics(config.get("kafka.clientId"), config.get("kafka.brokers").split(","), topics)
.catch(error => {
	logger.error(`Error while creating kafka topics : ${error}`);
});

//init mongo connection
try{
	utility.initMongoDb();
}catch(error){
	console.error(error);
	logger.error(`Error while connecting to MongoDB`);
};

const app = express();
app.use(express.json());
app.use("/", routes);
app.listen(config.get("server.port"), function (err) {
	if (err) {
		logger.error(`Error while starting Booking API : ${err}`);
		throw err;
	}

	logger.info(`Booking API started up. Listening to port : ${config.get("server.port")}`);
});

worker.listen();