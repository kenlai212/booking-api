const assert = require("assert");
const MongoClient = require("mongodb").MongoClient;
const logger = require("./logger");
const {MissingMandateError, DBError} = require('./error');

require("dotenv").config();

let _db;

function initDb(callback){
	if(_db){
		logger.warn("Trying to init DB again!");
		return callback(null, _db);
	}

	MongoClient.connect(process.env.DB_CONNECTION_URL, { useNewUrlParser: true }, (err, client) => {
		if(err) {
			logger.error("DB connection problem : ", err);
			throw new DBError(err);
		}

		_db = client.db(process.env.DATABASE_NAME);

		logger.info("Connected to `" + process.env.DATABASE_NAME + "`!");
		return callback(null, _db);
	});
}

function findAll(collection){
	return new Promise((resolve, reject) => {
		try{
			const data = _db
			.collection(collection)
			.find({})
			.toArray();

			resolve(data);
		}catch(err){
			logger.error("Error while running db.findAll() : ",err);
			reject(new DBError("findAll Error"));
		}
	});
}

function search(collection, param){
	return new Promise((resolve, reject) => {
		try{
			const data = _db
			.collection(collection)
			.find(param)
			.toArray();

			resolve(data);
		}catch(err){
			logger.error("Error while running db.findAll() : ",err);
			reject(new DBError("findAll Error"));
		}
	});
}

function findOne(collection, param){
	return new Promise((resolve, reject) => {
		try{
			const data = _db
			.collection(collection)
			.findOne(param);

			resolve(data);
		}catch(err){
			logger.error("Error while runnung db.findOne() : ",err);
			reject(new DBError("findOne Error"));
		}
	});
}

function insertOne(collection, object){
	return new Promise(async (resolve, reject) => {
		try{
			const data = await _db
			.collection(collection)
			.insertOne(object);
			
			resolve(data.ops[0]);
		}catch(err){
			logger.error("Error while running db.insertOne() : ",err);
			reject(new DBError("insertOne Error"));
		}
	});
}

function updateOne(collection, target, set){
	return new Promise((resolve, reject) => {
		try{
			const data = _db
			.collection(collection)
			.updateOne(target, set);
			
			resolve(data);	
		}catch(err){
			logger.error("Error while running db.updateOne() : ",err);
			reject(new DBError("updateOne Error"));
		}
	});
}

function deleteOne(collection, target){
	return new Promise((resolve, reject) => {
		try{
			const data = _db
			.collection(collection)
			.deleteOne(target);

			resolve(data);
		}catch(err){
			logger.error("Error while running db.deleteOne() : ",err);
			reject(new DBError("deleteOne Error"));
		}
	});
}

module.exports = {
	initDb,
	findAll,
	search,
	findOne,
	insertOne,
	updateOne,
	deleteOne
};