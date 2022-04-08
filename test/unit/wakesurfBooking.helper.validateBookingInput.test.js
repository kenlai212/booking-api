"use strict";
const validateNewBookingInput = require("../../src/wakesurfBooking/wakesurfBooking.helper").validateNewBookingInput;

describe('Test wakesurfBookingHelper.validateNewBookingInput()', () => {
    it("missing occupancyId, return false", () => {
        input = {}

        expect.assertions(2);

        expect(() => {
            validateNewBookingInput(input); 
        }).toThrow(lipslideCommon.BadRequestError);

        expect(() => {
            validateNewBookingInput(input); 
        }).toThrow(`occupancyId is required`);
    });
});