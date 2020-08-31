const moment = require("moment");

const bookingService = require("../../../src/booking/booking.service");
const gogowakeCommon = require("gogowake-common");
const customError = require("../../../src/errors/customError");

describe('Test booking.addNewBooking.service', () => {
    input = {}
    user = {}

    it("no user authorization, reject", () => {

        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(false);

        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.UNAUTHORIZED_ERROR,
            message: "Insufficient Rights"
        });
    });

    it("missing startTime, reject", () => {
        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "startTime is required"
        });
    });

    it("invalid startTime, reject", () => {
        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.startTime = "ABC";
        
        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "startTime must be in ISO 8601 date format"
        });
    });

    it("missing endTime, reject", () => {
        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.startTime = moment().toISOString();
        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "endTime is required"
        });
    });

    it("invalid endTime, reject", () => {
        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.endTime = "ABC";
        
        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "endTime must be in ISO 8601 date format"
        });
    });

    it("missing assetId, reject", () => {
        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.endTime = moment().toISOString();
        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "assetId is required"
        });
    });

    it("missing bookingType, reject", () => {
        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.assetId = "123";
        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bookingType is required"
        });
    });

    it("invalid bookingType, reject", () => {
        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.bookingType = "ABC";
        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "bookingType must be one of [CUSTOMER_BOOKING, OWNER_BOOKING]"
        });
    });

    it("missing contactName, reject", () => {
        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.bookingType = "CUSTOMER_BOOKING";
        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "contactName is required"
        });
    });

    it("missing telephoneCountryCode, reject", () => {
        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.contactName = "tester";
        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "telephoneCountryCode is required"
        });
    });

    it("invalid telephoneCountryCode, reject", () => {
        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.telephoneCountryCode = "ABC";
        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "telephoneCountryCode must be one of [852, 853, 86]"
        });
    });

    it("missing telephoneNumber, reject", () => {
        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.telephoneCountryCode = "852";
        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "telephoneNumber is required"
        });
    });

    it("startTime later then endTime, reject", () => {
        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.telephoneNumber = "12345678";
        input.startTime = moment("2020-02-02T08:00:00Z").toISOString();
        input.endTime = moment("2020-02-02T07:00:00Z").toISOString();
        
        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "endTime cannot be earlier then startTime"
        });
    });

    it("customer booking type, fail check minimumDuration, reject", () => {
        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.bookingType = "CUSTOMER_BOOKING"
        input.startTime = moment("2020-02-02T08:00:00Z").toISOString();
        input.endTime = moment("2020-02-02T08:30:00Z").toISOString();
        
        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "Booking cannot be less then"
        });
        /*
        return bookingService.addNewBooking(input, user)
            .catch(err => {
                console.log(err);
                expect(err).toEqual({
                    name: customError.BAD_REQUEST_ERROR,
                    message: "endTime cannot be earlier then startTime"
                });
            });
            */
    });
});