const express = require("express");
require("dotenv").config();

const lipslideCommon = require("lipslide-common");
const {logger} = lipslideCommon;

const routes = require("./routes");

const app = express();

//set up routes
app.use(express.json());
app.use("/", routes);

app.get('/index.html', function (req, res) {
	res.send("Booking API Running.....");
 })

//catch all uncaught rejects and excpetions
process.on("unhandledRejection", (ex) => {
	console.log("WE GOT AN UNHANDLED REJECTION!!!!!!!");
	console.error(ex);
	logger.error(ex);
});

process.on("uncaughtException", (ex) => {
	console.log("WE GOT AN UNCAUGHT EXCEPTION!!!!!!!");
	console.error(ex);
	logger.error(ex);
});

app.listen(process.env.PORT, function (err) {
	if (err) {
		logger.error(`Error while starting Booking API : ${err}`);
		throw err;
	}

	logger.info(`Booking API started up. Listening to port : ${process.env.PORT}`);
});