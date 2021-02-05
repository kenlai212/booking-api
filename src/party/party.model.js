"use strict";
const mongoose = require("mongoose");

const profileModel = require("../common/profile/profile.model");

const partySchema = new mongoose.Schema({
	personalInfo: profileModel.personalInfoSchema,
	contact: profileModel.contactSchema,
	picture: profileModel.pictureSchema
});

const Party = mongoose.model("Party", partySchema);

module.exports = {
	Party
}