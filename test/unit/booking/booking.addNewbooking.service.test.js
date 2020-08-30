const bookingService = require("../../../src/booking/booking.service");
const gogowakeCommon = require("gogowake-common");
const customError = require("../../../src/errors/customError");

describe('Test booking.addNewBooking.service', () => {
    input = {}
    user = {}

    it("no user authorization, reject", async () => {

        //fake gogowakeCommon.userAuthorization, returning false
        gogowakeCommon.userAuthorization = jest.fn().mockReturnValue(false);

        expect.assertions(1);

        return expect(bookingService.addNewBooking(input, user)).rejects.toEqual({
            name: customError.UNAUTHORIZED_ERROR,
            message: "Insufficient Rights"
        });
    });
});