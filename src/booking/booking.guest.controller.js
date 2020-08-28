"use strict";
const guestService = require("./booking.guest.service");

const removeGuest = async (req) => {
	return await guestService.removeGuest(req.body, req.user);
}

const addGuest = async (req) => {
	return await guestService.addGuest(req.body, req.user);
}

const editGuest = async (req) => {
	return await guestService.editGuest(req.body, req.user);
}

const sendDisclaimer = async (req) => {
	return await guestService.sendDisclaimer(req.body, req.user);
}

const signDisclaimer = async (req) => {
	return await guestService.signDisclaimer(req.body);
}

module.exports = {
	addGuest,
	removeGuest,
	editGuest,
	sendDisclaimer,
	signDisclaimer
}
