"use strict";
const mongoose = require("mongoose");

const personalInfoSchema = new mongoose.Schema({
	name: String,
	dob: Date,
	gender: String
});

const contactSchema = new mongoose.Schema({
	telephoneCountryCode: String,
	telephoneNumber: String,
	emailAddress: String
});

const pictureSchema = new mongoose.Schema({
	url: String
});

const PersonalInfo = mongoose.model("PersonalInfo", personalInfoSchema);
const Contact = mongoose.model("Contact", contactSchema);
const Picture = mongoose.model("Picture", pictureSchema);

module.exports = {
    personalInfoSchema,
    contactSchema,
    pictureSchema,
	PersonalInfo,
	Contact,
	Picture
}