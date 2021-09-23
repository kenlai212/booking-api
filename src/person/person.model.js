"use strict";
const mongoose = require("mongoose");

const personSchema = new mongoose.Schema({
	_id: String,
    roles: [String]
});

const Person = mongoose.model("Person", personSchema);

module.exports = {
	Person
}