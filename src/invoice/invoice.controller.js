"use strict";
const asyncMiddleware = require("../common/middleware/asyncMiddleware");
const utility = require("../common/utility");

const invoiceService = require("./invoice.service");

const INVOICE_ADMIN_GROUP = "INVOICE_ADMIN";
const INVOICE_USER_GROUP = "INVOICE_USER";

const addNewInvoice = asyncMiddleware(async (req) => {
	//validate user
	utility.userGroupAuthorization(req.user.groups, [
		INVOICE_ADMIN_GROUP
	]);

	return await  invoiceService.addNewInvoice(req.body, req.user);
});

const findInvoice = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [
		INVOICE_ADMIN_GROUP,
		INVOICE_USER_GROUP
	]);

	return await  invoiceService.addNewInvoice(req.params, req.user);
});

const searchInvoices = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [
		INVOICE_ADMIN_GROUP,
		INVOICE_USER_GROUP
	]);

	return await  invoiceService.searchInvoices(req.params, req.user);
});

const makePayment = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [
		INVOICE_ADMIN_GROUP,
		INVOICE_USER_GROUP
	]);

	return await invoiceService.makePayment(req.body, req.user);
});

const applyDiscount = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [
		INVOICE_ADMIN_GROUP
	]);

	return await invoiceService.applyDiscount(req.body, req.user);
});

const removeDiscount = asyncMiddleware(async (req) => {
	utility.userGroupAuthorization(req.user.groups, [
		INVOICE_ADMIN_GROUP
	]);

	return await invoiceService.removeDiscount(req.params, req.user);
});

module.exports = {
	addNewInvoice,
	findInvoice,
	searchInvoices,
	makePayment,
	applyDiscount,
	removeDiscount
}
