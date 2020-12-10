"use strict";
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
	creationTime: Date,
	createdBy: String,
	bookingType: String,
	status: String,
	startTime: Date,
	endTime: Date,
	durationByHours: Number,
	fulfilledHours: Number,
	invoice: {
		unitPrice: Number,
		currency: String,
		regularAmount: Number,
		discounts: [{
			amount: Number,
			discountCode: String
		}],
		totalAmount: Number,
		payments: [{
			amount: Number,
			paymentDate: Date
        }],
		paidAmount: Number,
		balance: Number,
		paymentStatus: String,
	},
	host: {
		name: String,
		contact: {
			telephoneCountryCode: String,
			telephoneNumber: String,
			emailAddress: String
		},
		picture: {
			url: String
		}
	},
	guests: [{
		name: String,
		disclaimerId: String,
		signedDisclaimerTimeStamp: Date,
		contact: {
			telephoneCountryCode: String,
			telephoneNumber: String,
			emailAddress: String
		},
		picture: {
			url: String
		}
	}],
	crews: [{
		crewId: String,
		name: String,
		assignmentTime: Date,
		assignmentBy: String,
		contact: {
			telephoneCountryCode: String,
			telephoneNumber: String,
			emailAddress: String
		},
		picture: {
			url: String
		}
	}]
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = {
	Booking
}