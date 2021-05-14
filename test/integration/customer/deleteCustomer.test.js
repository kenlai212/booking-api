"use strict";
const axios = require("axios");

const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/people/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/customers/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/customer/people/shitSon`, REQUEST_CONFIG);
});

describe('Test delete customer api', () => {
    it('del customer', async () => {
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

        //search customers, expect 2 records
        let searchCustomerResponse;
        try{
            searchCustomerResponse = await axios.get(`${DOMAIN_URL}/customers`, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(searchCustomerResponse.data.count).toEqual(2);

        //delete customer1
        let updateStatusResponse;
        try{
            updateStatusResponse = await axios.delete(`${DOMAIN_URL}/customer/${postCustomer1Response.data.customerId}`, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        //search customers, expect 1 record
        try{
            searchCustomerResponse = await axios.get(`${DOMAIN_URL}/customers`, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(searchCustomerResponse.data.count).toEqual(1);
    });
});