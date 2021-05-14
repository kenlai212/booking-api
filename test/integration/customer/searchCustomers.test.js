"use strict";
const axios = require("axios");

const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/people/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/customers/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/customer/people/shitSon`, REQUEST_CONFIG);
});

describe('Test search customers api', () => {
    it('get customers', async () => {
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

        //update customer1 status
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

        //search customers with ACTIVE status, expect 1 record
        try{
            searchCustomerResponse = await axios.get(`${DOMAIN_URL}/customers?status=ACTIVE`, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(searchCustomerResponse.data.count).toEqual(1);
    });
});