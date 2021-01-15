const customError = require("../../../src/common/customError");

const customerService = require("../../../src/customer/customer.service");
const {Customer} = require("../../../src/customer/customer.model");
const {Party} = require("../../../src/party/party.model");
const partyHelper = require("../../../src/customer/party_internal.helper");

describe('Test customer.newCustomer()', () => {
    user = {};

    it("missing partyId and personalInfo object. Must provide at least one!", () => {
        input = {};

        expect.assertions(1);

        return expect(customerService.newCustomer(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "personalInfo is required"
        });
    });

    it("partyId provided, but get party failed", () => {
        input = {partyId: "123"};

        partyHelper.getParty = jest.fn().mockRejectedValue({
            name: customError.BAD_REQUEST_ERROR,
            message: "partyHelper.getParty() failed"
        });

        expect.assertions(1);

        return expect(customerService.newCustomer(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "partyHelper.getParty() failed"
        });
    });

    it("partyId not provided, but create new party failed", () => {
        input = {};

        partyHelper.createNewParty = jest.fn().mockRejectedValue({
            name: customError.BAD_REQUEST_ERROR,
            message: "partyHelper.carateNewParty() failed"
        });

        expect.assertions(1);

        return expect(customerService.newCustomer(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "partyHelper.carateNewParty() failed"
        });
    });

    it("partyId provided, but found existing customer.", () => {
        input = {partyId: "PARTY_123"};

        partyHelper.getParty = jest.fn().mockResolvedValue(new Party());

        Customer.findOne = jest.fn().mockResolvedValue(new Customer());

        expect.assertions(1);

        return expect(customerService.newCustomer(input, user)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR, 
            message: "Customer already exist"
        });
    });
});