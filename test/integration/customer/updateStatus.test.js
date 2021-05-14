"use strict";
const axios = require("axios");

const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/people/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/customers/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/customer/people/shitSon`, REQUEST_CONFIG);
});

describe('Test new customer api', () => {
    it('save customer', async () => {
        //post customer1
        let postCustomer1Response;
        try{
            postCustomer1Response = await axios.post(`${DOMAIN_URL}/customer`, {name: "customer1"}, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        //update status
        const data = {
            customerId: postCustomer1Response.data.customerId,
            status: "INACTIVE"
        }

        let updateStatusResponse;
        try{
            updateStatusResponse = await axios.put(`${DOMAIN_URL}/customer/status`, data, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(updateStatusResponse.data.status).toEqual("INACTIVE");
    });
});