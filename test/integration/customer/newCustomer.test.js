"use strict";
const axios = require("axios");

const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/people/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/customers/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/customer/people/shitSon`, REQUEST_CONFIG);
});

describe('Test new customer api', () => {
    it('post customer', async () => {
        const data = {
            name: "customer1",
            emailAddress: "test@test.com",
            countryCode: "852",
            phoneNumber: "1234567"
        }

        let postCustomerResponse;
        try{
            postCustomerResponse = await axios.post(`${DOMAIN_URL}/customer`, data, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(postCustomerResponse.data.personId).not.toEqual(null);
        expect(postCustomerResponse.data.customerId).not.toEqual(null);
        expect(postCustomerResponse.data.creationTime).not.toEqual(null);
        expect(postCustomerResponse.data.lastUpdateTime).not.toEqual(null);
        expect(postCustomerResponse.data.requestorId).toEqual("BOOKING_SYSTEM");
        expect(postCustomerResponse.data.name).toEqual("customer1");
        expect(postCustomerResponse.data.emailAddress).toEqual("test@test.com");
        expect(postCustomerResponse.data.countryCode).toEqual("852");
        expect(postCustomerResponse.data.phoneNumber).toEqual("1234567");
    });
});