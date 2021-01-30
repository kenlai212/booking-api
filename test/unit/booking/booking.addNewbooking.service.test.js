const moment = require("moment");

const bookingService = require("../../../src/booking/booking.service");
const customError = require("../../../src/common/customError");

describe('Test booking.addNewBooking.service', () => {
    const user = new Object();

    it("missing startTime, reject", () => {
        let input = {}
        
        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "startTime is required"
        });
    });

    it("invalid startTime, reject", () => {
        let input = {
            startTime: "ABC"
        }
        
        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "startTime must be in ISO 8601 date format"
        });
    });

    it("missing endTime, reject", () => {
        let input = {
            startTime: moment().toISOString()
        }

        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "endTime is required"
        });
    });

    it("invalid endTime, reject", () => {
        let input = {
            startTime: moment().toISOString(),
            endTime: "ABC"
        }
        
        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "endTime must be in ISO 8601 date format"
        });
    });

    it("missing assetId, reject", () => {
        let input = {
            startTime: moment().toISOString(),
            endTime: moment().toISOString()
        }

        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "utcOffset is required"
        });
    });

    it("missing assetId, reject", () => {
        let input = {
            startTime: moment().toISOString(),
            endTime: moment().toISOString(),
            utcOffset: 0
        }

        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "assetId is required"
        });
    });

    it("missing bookingType, reject", () => {
        let input = {
            startTime: moment().toISOString(),
            endTime: moment().toISOString(),
            utcOffset: 0,
            assetId: "123"
        }

        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bookingType is required"
        });
    });

    it("invalid bookingType, reject", () => {
        let input = {
            startTime: moment().toISOString(),
            endTime: moment().toISOString(),
            utcOffset: 0,
            assetId: "123",
            bookingType: "ABC"
        }

        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bookingType must be one of [CUSTOMER_BOOKING, OWNER_BOOKING]"
        });
    });

    it("missing customerId or personalInfo object, reject", () => {
        let input = {
            startTime: moment().toISOString(),
            endTime: moment().toISOString(),
            utcOffset: 0,
            assetId: "123",
            bookingType: "CUSTOMER_BOOKING"
        }

        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "customerId or personalInfo in mandatory"
        });
    });

    it("invalid assedId, reject", () => {
        let input = {
            startTime: moment("2020-02-02T08:00:00Z").toISOString(),
            endTime: moment("2020-02-02T07:00:00Z").toISOString(),
            utcOffset: 0,
            assetId: "123",
            bookingType: "CUSTOMER_BOOKING",
            customerId: "ABCDEFG"
        }
        
        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "Invalid assetId"
        });
    });

    it("startTime later then endTime, reject", () => {
        let input = {
            startTime: moment("2020-02-02T08:00:00Z").toISOString(),
            endTime: moment("2020-02-02T07:00:00Z").toISOString(),
            utcOffset: 0,
            assetId: "MC_NXT20",
            bookingType: "CUSTOMER_BOOKING",
            customerId: "ABCDEFG"
        }
        
        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "endTime cannot be earlier then startTime"
        });
    });

    it("booking in the pass, reject", () => {
        let input = {
            startTime: moment("2020-02-02T08:00:00Z").add(-2,"days").toISOString(),
            endTime: moment("2020-02-02T09:00:00Z").add(-2,"days").toISOString(),
            utcOffset: 0,
            assetId: "MC_NXT20",
            bookingType: "CUSTOMER_BOOKING",
            customerId: "ABCDEFG"
        }
        
        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "Booking cannot be in the past"
        });
    });
});