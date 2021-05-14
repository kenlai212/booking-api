"use strict";
const axios = require("axios");

const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/people/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/customers/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/customer/people/shitSon`, REQUEST_CONFIG);
});

describe('Test new customerPerson api', () => {
    it('post customerPerson', async () => {
        const data = {
            personId:"123",
            name: "customer1",
            emailAddress: "test@test.com",
            countryCode: "852",
            phoneNumber: "1234567",
            gender: "MALE",
            dob: "2020-01-01",
            profilePictureUrl: "ABC"
        }

        let postCustomerPersonResponse;
        try{
            postCustomerPersonResponse = await axios.post(`${DOMAIN_URL}/customer/person`, data, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(postCustomerPersonResponse.data.personId).toEqual("123");
        expect(postCustomerPersonResponse.data.name).toEqual("customer1");
        expect(postCustomerPersonResponse.data.emailAddress).toEqual("test@test.com");
        expect(postCustomerPersonResponse.data.countryCode).toEqual("852");
        expect(postCustomerPersonResponse.data.phoneNumber).toEqual("1234567");
        expect(postCustomerPersonResponse.data.gender).toEqual("MALE");
        expect(postCustomerPersonResponse.data.dob).not.toEqual(null);
        expect(postCustomerPersonResponse.data.profilePictureUrl).toEqual("ABC");
    });
});