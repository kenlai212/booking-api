"use strict";
const utility = require("../../../src/common/utility");
const {customError} = utility;

const customerDomain = require("../../../src/customer/customer.domain");
const { Customer, CustomerPerson } = require("../../../src/customer/customer.model");
const customerPersonHelper = require("../../../src/customer/customerPerson.helper");
const customerHelper = require("../../../src/customer/customer.helper");

describe("Test customer.domain.createCustomer",() => {
    it("Missing personId",() => {
        const input = {};

        expect.assertions(1);

        return expect(customerDomain.createCustomer(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "personId is required"
        });
    });

    it("customerPersonHelper.findCustomerPerson failed, expect reject",() => {
        const input = {
            personId: "A"
        };

        //setup mock customerPersonHelper.findCustomerPerson, reject
        customerPersonHelper.findCustomerPerson = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Find customerPerson Error"
        });

        expect.assertions(1);

        return expect(customerDomain.createCustomer(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Find customerPerson Error"
        });
    });

    it("find existing customer failed, reject",() => {
        const input = {
            personId: "A"
        };

        customerPersonHelper.findCustomerPerson = jest.fn().mockResolvedValue(new CustomerPerson());

        //setup mock Customer.findOne, reject
        Customer.findOne = jest.fn().mockRejectedValue(new Error("Find customer error"));

        expect.assertions(1);

        return expect(customerDomain.createCustomer(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Find Customer Error"
        });
    });

    it("found existing customer, reject", () => {
        const input = {
            personId: "A"
        };

        customerPersonHelper.findCustomerPerson = jest.fn().mockResolvedValue(new CustomerPerson());

        Customer.findOne = jest.fn().mockResolvedValue(new Customer());

        expect.assertions(1);

        return expect(customerDomain.createCustomer(input)).rejects.toEqual({
            name: customError.BAD_REQUEST_ERROR,
            message: "Customer already exist"
        });
    });

    it("save customer error, reject", () => {
        const input = {
            personId: "A"
        };

        customerPersonHelper.findCustomerPerson = jest.fn().mockResolvedValue(new CustomerPerson());

        Customer.findOne = jest.fn().mockResolvedValue(null);

        //setup mock customerHelper.saveCustomer, reject
        customerHelper.saveCustomer = jest.fn().mockRejectedValue({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save customer Error"
        });

        return expect(customerDomain.createCustomer(input)).rejects.toEqual({
            name: customError.INTERNAL_SERVER_ERROR,
            message: "Save customer Error"
        });
    });
});