const moment = require("moment");

const gogowakeCommon = require("gogowake-common");
const customError = require("../../../src/errors/customError");
const slotService = require("../../../src/slot/slot.service");
const getOccupanciesHelper = require("../../../src/slot/getOccupancies_internal.helper");
const calculateTotalAmountHelper = require("../../../src/slot/calculateTotalAmount_internal.helper");

describe('Test slot.getEndSlots', () => {

    input = {};
    user = {};

    it("no user authorization, reject!", () => {
        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(false);

        expect.assertions(1);

        return expect(slotService.getEndSlots(input, user)).rejects.toEqual({
            name: customError.UNAUTHORIZED_ERROR,
            message: "Insufficient Rights"
        });
    });

    it("missing startTime, reject!", () => {
        //fake gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        expect.assertions(1);

        return expect(slotService.getEndSlots(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "startTime is required"
        });
    });

    it("invalid startTime, reject!", () => {
        //fake gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.startTime = "DEF"

        expect.assertions(1);

        return expect(slotService.getEndSlots(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "startTime must be in ISO 8601 date format"
        });
    });

    it("startTime earlier then dayStart", () => {
        //fake gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.startTime = moment()
            .utcOffset(0)
            .add(1, "days")
            .set({ hour: 2, minute: 0, second: 0, millisecond: 0 })
            .toISOString();
        
        expect.assertions(1);

        return expect(slotService.getEndSlots(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "startTime cannot be earlier then 05:00:00"
        });
    });

    it("startTime later then dayEnd", () => {
        //fake gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.startTime = moment()
            .utcOffset(0)
            .add(1, "days")
            .set({ hour: 22, minute: 0, second: 0, millisecond: 0 })
            .toISOString();

        expect.assertions(1);

        return expect(slotService.getEndSlots(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "startTime cannot be later then 19:59:59"
        });
    });

    it("mock occupancyService.getOccupancies() failed, reject!", () => {
        //fake gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.startTime = moment()
            .utcOffset(0)
            .add(1, "days")
            .set({ hour: 15, minute: 0, second: 0, millisecond: 0 })
            .toISOString();

        //mock getOccupancies, reject with Internal Server Error
        getOccupanciesHelper.getOccupancies = jest.fn().mockRejectedValue({ name: customError.INTERNAL_SERVER_ERROR, message: "Internal Server Error" });

        expect.assertions(1);

        return expect(slotService.getEndSlots(input, user)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Internal Server Error"
        });
    });

    it("mock occupancyService.getOccupancies(), resolve one existing occupancy", () => {
        //fake gogowakeCommon.userAuthorization, returning true
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(true);

        input.startTime = moment()
            .utcOffset(0)
            .add(1, "days")
            .set({ hour: 15, minute: 0, second: 0, millisecond: 0 })
            .toISOString();

        //mock getOccupancies, reject with Internal Server Error
        getOccupanciesHelper.getOccupancies = jest.fn().mockResolvedValue([
            {
                startTime: moment()
                    .utcOffset(0)
                    .add(1, "days")
                    .set({ hour: 18, minute: 0, second: 0, millisecond: 0 })
                    .toISOString(),
                endTime: moment()
                    .utcOffset(0)
                    .add(1, "days")
                    .set({ hour: 19, minute: 59, second: 59, millisecond: 0 })
                    .toISOString()
            }
        ]);

        //mock calculateTotalAmountHelper.calculateTotalAmount, 
        calculateTotalAmountHelper.calculateTotalAmount = jest.fn().mockReturnValue({totalAmount: 1000, currency: "HKD"});

        expect.assertions(1);

        return expect(slotService.getEndSlots(input, user)).resolves.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Internal Server Error"
        });
    });
});