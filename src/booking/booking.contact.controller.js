"use strict";
const url = require("url");

const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const contactService = require("./booking.contact.service");

const editContact = asyncMiddleware(async (req) => {
	return await contactService.editContact(req.body, req.user);
});

module.exports = {
	editContact
}