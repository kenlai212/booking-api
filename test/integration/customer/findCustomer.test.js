"use strict";
const axios = require("axios");

const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/people/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/customers/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/customer/people/shitSon`, REQUEST_CONFIG);
});

describe('Test find customer api', () => {
    it('get customer', async () => {
        //post customer1
        let postCustomer1Response;
        try{
            postCustomer1Response = await axios.post(`${DOMAIN_URL}/customer`, {name: "customer1"}, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        //post customer2
        let postCustomer2Response;
        try{
            postCustomer2Response = await axios.post(`${DOMAIN_URL}/customer`, {name: "customer2"}, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        //get customer1 by customerId
        let getCustomer1Response;
        try{
            getCustomer1Response = await axios.get(`${DOMAIN_URL}/customer?customerId=${postCustomer1Response.data.customerId}`, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(getCustomer1Response.data.personId).not.toEqual(null);
        expect(getCustomer1Response.data.customerId).not.toEqual(null);
        expect(getCustomer1Response.data.creationTime).not.toEqual(null);
        expect(getCustomer1Response.data.lastUpdateTime).not.toEqual(null);
        expect(getCustomer1Response.data.requestorId).toEqual("BOOKING_SYSTEM");
        expect(getCustomer1Response.data.name).toEqual("customer1");

        //get customer2 by personId
        let getCustomer2Response;
        try{
            getCustomer2Response = await axios.get(`${DOMAIN_URL}/customer?personId=${postCustomer2Response.data.personId}`, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(getCustomer2Response.data.personId).not.toEqual(null);
        expect(getCustomer2Response.data.customerId).not.toEqual(null);
        expect(getCustomer2Response.data.creationTime).not.toEqual(null);
        expect(getCustomer2Response.data.lastUpdateTime).not.toEqual(null);
        expect(getCustomer2Response.data.requestorId).toEqual("BOOKING_SYSTEM");
        expect(getCustomer2Response.data.name).toEqual("customer2");
    });
});