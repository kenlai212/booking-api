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
		customerId: String,
		personalInfo: {
			name: String,
			dob: Date,
			gender: String
		},
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
		customerId: String,
		disclaimerId: String,
		signedDisclaimerTimeStamp: Date,
		personalInfo: {
			name: String,
			dob: Date,
			gender: String
		},
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
		assignmentTime: Date,
		assignmentBy: String,
		personalInfo: {
			name: String,
			dob: Date,
			gender: String
		},
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