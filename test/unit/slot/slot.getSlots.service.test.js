const moment = require("moment");

const gogowakeCommon = require("gogowake-common");
const customError = require("../../../src/errors/customError");
const slotService = require("../../../src/slot/slot.service");
const getOccupanciesHelper = require("../../../src/slot/getOccupancies_internal.helper");

describe('Test slot.service', () => {
    describe("testing getSlots", () => {
        input = {};
        user = {};

        it("no user authorization, reject!", () => {

            //fake gogowakeCommon.userAuthorization, returning false
            gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(false);

            expect.assertions(1);

            return expect(slotService.getSlots(input, user)).rejects.toEqual({
                name: customError.UNAUTHORIZED_ERROR,
                message: "Insufficient Rights"
            });
        });

        it("missing targetDate, reject!", () => {

            //fake gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

            expect.assertions(1);

            return expect(slotService.getSlots(input, user)).rejects.toEqual({
                name: customError.BAD_REQUEST_ERROR,
                message: "targetDate is required"
            });
        });

        it("invalid targetDate, reject!", () => {

            //fake gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

            input.targetDate = "DEF"

            expect.assertions(1);

            return expect(slotService.getSlots(input, user)).rejects.toEqual({
                name: customError.BAD_REQUEST_ERROR,
                message: "targetDate must be in ISO 8601 date format"
            });
        });

        it("missing bookingType, reject!", () => {

            //fake gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

            input.targetDate = moment().add(1, "days").toISOString();

            expect.assertions(1);

            return expect(slotService.getSlots(input, user)).rejects.toEqual({
                name: customError.BAD_REQUEST_ERROR,
                message: "bookingType is required"
            });
        });
        
        it("invalid bookingType, reject!", () => {

            //fake gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

            input.bookingType = "ABC"

            expect.assertions(1);

            return expect(slotService.getSlots(input, user)).rejects.toEqual({
                name: customError.BAD_REQUEST_ERROR,
                message: "bookingType must be one of [OWNER_BOOKING, CUSTOMER_BOOKING]"
            });
        });
        
        it("mock occupancyService.getOccupancies() failed, reject!", () => {

            //fake gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

            input.targetDate = moment().add(1, "days").toISOString();
            input.bookingType = "OWNER_BOOKING"

            //mock getOccupancies, reject with Internal Server Error
            getOccupanciesHelper.getOccupancies = jest.fn().mockRejectedValue({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });

            expect.assertions(1);

            return expect(slotService.getSlots(input, user)).rejects.toEqual({
                name: customError.INTERNAL_SERVER_ERROR,
                message: "Internal Server Error"
            });
        });

        
        it("mock occupancyService.getOccupancies() failed, reject!", () => {

            //fake gogowakeCommon.userAuthorization, returning true
            gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);


            //mock getOccupancies, reject with Internal Server Error
            getOccupanciesHelper.getOccupancies = jest.fn().mockResolvedValue({
                occupancies: [
                    {
                        startTime: moment()
                            .utcOffset(0)
                            .add(1, "days")
                            .set({ hour: 10, minute: 0, second: 0, millisecond: 0 })
                            .toDate(),
                        endTime: moment()
                            .utcOffset(0)
                            .add(1, "days")
                            .set({ hour: 11, minute: 29, second: 59, millisecond: 0 })
                            .toDate()
                    }
                ]});

            expect.assertions(6);

            slotService.getSlots(input, user)
                .then(result => {
                    const finalSlots = result.slots;
                    expect(finalSlots.length).toEqual(31);
                    expect(finalSlots[9].available).toEqual(true);
                    expect(finalSlots[10].available).toEqual(false);
                    expect(finalSlots[11].available).toEqual(false);
                    expect(finalSlots[12].available).toEqual(false);
                    expect(finalSlots[13].available).toEqual(true);
                });
        });
    });
});