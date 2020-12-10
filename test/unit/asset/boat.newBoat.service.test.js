const boatService = require("../../../src/asset/boat.service");
const customError = require("../../../src/common/customError");
const Boat = require("../../../src/asset/boat.model").Boat;

describe('Test boatService.newBoat()', () => {
    it("missing boatName, reject!", () => {
        input = {}

        expect.assertions(1);

        return expect(boatService.newBoat(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "boatName is required"
        });
    });

    it("missing assetId, reject!", () => {
        input = {
            boatName: "abc"
        }

        expect.assertions(1);

        return expect(boatService.newBoat(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "assetId is required"
        });
    });

    it("existing boat, reject!", () => {
        input = {
            boatName: "abc",
            assetId: "123"
        }

        //setup mock Boat.findOne, resolve with boat object
        Boat.findOne = jest.fn().mockResolvedValue(new Boat());

        expect.assertions(1);

        return expect(boatService.newBoat(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "Boat with assetId(123) already exist"
        });
    });

    it("boat save to db failed", () => {
        input = {
            boatName: "abc",
            assetId: "123"
        }

        //setup mock Boat.findOne, resolve with null
        Boat.findOne = jest.fn().mockResolvedValue(null);

        //setup mock boat.save, reject
        Boat.prototype.save = jest.fn().mockRejectedValue(new Error("boat.save db error"));

        expect.assertions(1);

        return expect(boatService.newBoat(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Internal Server Error"
        });
    });
});