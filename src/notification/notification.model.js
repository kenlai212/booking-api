"use strict";
const ObjectId = require("mongodb").ObjectID;

async function saveEmailNotification(email){

	var deleteResult;
	await db.deleteOne(OCCUPANCY_COLLECTION, {"_id":ObjectId(occupancyId)})
	.then(result => {
		deleteResult = result;
	})
	.catch(dbErr => {
		logger.error("db.deleteOne() error : " + dbErr);
		throw dbErr;
	});

	return deleteResult;
}

module.exports = {
	saveEmailNotification
}
