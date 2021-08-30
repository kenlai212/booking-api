"use strict";
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
	customerId: String
});

const Customer = mongoose.model("Customer", customerSchema);

module.exports = {
	Customer
}