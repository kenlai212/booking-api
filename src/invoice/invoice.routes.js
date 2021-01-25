"use strict";
const express = require("express");

const logIncommingRequest = require("../common/middleware/logIncommingRequest");
const authenticateAccessToken = require("../common/middleware/authenticateAccessToken");

const invoiceController = require("./invoice.controller");

const router = express.Router();
router.post("/invoice", authenticateAccessToken, logIncommingRequest, invoiceController.addNewInvoice);
router.get("/invoice/:id", authenticateAccessToken, logIncommingRequest, invoiceController.findInvoice);
router.get("/invoices", authenticateAccessToken, logIncommingRequest, invoiceController.searchInvoices);
router.put("/invoice/payment", authenticateAccessToken, logIncommingRequest, invoiceController.makePayment);
router.put("/invoice/discount", authenticateAccessToken, logIncommingRequest, invoiceController.applyDiscount);
router.delete("/invoice/discount/:bookingId/:discountId", authenticateAccessToken, logIncommingRequest, invoiceController.removeDiscount);

module.exports = router;