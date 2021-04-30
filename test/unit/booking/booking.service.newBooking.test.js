"use strict";
const utility = require("../../../src/common/utility");
const {customError} = utility;

const bookingService = require("../../../src/booking/booking.service");
const bookingDomain = require("../../../src/booking/booking.domain");
const occupancyDomain = require("../../../src/booking/occupancy.domain");

describe('Test booking.newBooking.service', () => {
    it("missing occupancyId, reject", () => {
        let input = {}

        expect.assertions(1);

        return expect(bookingService.newBooking(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "occupancyId is required"
        });
    });

    it("missing bookingType, reject", () => {
        let input = {
            occupancyId: "A"
        }

        expect.assertions(1);

        return expect(bookingService.newBooking(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bookingType is required"
        });
    });
    
    it("missing customerId, reject", () => {
        let input = {
            occupancyId: "A",
            bookingType: "B"
        }

        expect.assertions(1);

        return expect(bookingService.newBooking(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "customerId is required"
        });
    });

    it("invalid bookingType, reject", () => {
        let input = {
            occupancyId: "A",
            bookingType: "B",
            customerId: "C"
        }

        expect.assertions(1);

        return expect(bookingService.newBooking(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "Invalid bookingType"
        });
    });

    it("occupancyDomain.readOccupancy error, reject", () => {
        let input = {
            occupancyId: "A",
            bookingType: "CUSTOMER_BOOKING",
            customerId: "C"
        }

        //setup mock occupancyDomain.readOccupancy, reject
        occupancyDomain.readOccupancy = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Read Occupancy Error"
        });

        expect.assertions(1);

        return expect(bookingService.newBooking(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Read Occupancy Error"
        });
    });

    it("bookingDomain.createBooking error, reject", () => {
        let input = {
            occupancyId: "A",
            bookingType: "CUSTOMER_BOOKING",
            customerId: "C"
        }

        occupancyDomain.readOccupancy = jest.fn().mockResolvedValue(new Object());

        //setup mock bookingDomain.createBooking, reject
        bookingDomain.createBooking = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Create Booking Error"
        });

        expect.assertions(1);

        return expect(bookingService.newBooking(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Create Booking Error"
        });
    });
});