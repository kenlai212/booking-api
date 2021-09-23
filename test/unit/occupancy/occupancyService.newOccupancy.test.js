"use strict";
const lipslideCommon = require("lipslide-common");
const {customError} = lipslideCommon;

const occupancyService = require("../../../src/occupancy/occupancy.service");

describe('Test occupancyService.newOccupancy()', () => {
    it("missing occupancyId, reject!", () => {
        expect.assertions(1);

        return expect(occupancyService.newOccupancy({})).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "occupancyId is required"
        });
    });
});