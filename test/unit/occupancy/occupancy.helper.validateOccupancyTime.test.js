const utility = require("../../../src/common/utility");
const {customError} = utility;

const occupancyHelper = require("../../../src/occupancy/occupancy.helper");

describe('Test occupancyHelper.validateOccupancyTime()', () => {
    it("startTime grater then endTime, reject!", () => {
        input.bookingType = "CUSTOMER_BOOKING";
        input.startTime = "2020-02-02T23:59:59Z";
        input.endTime = "2020-02-02T22:00:00Z";

        expect.assertions(1);

        return expect(occupancyHelp.validateOccupancyTime(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "endTime cannot be earlier then startTime"
        });
    });
});