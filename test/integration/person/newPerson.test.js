"use strict";
const axios = require("axios");

const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/people/shitSon`, REQUEST_CONFIG);
});

describe('Test new person api', () => {
    it('post person', async () => {
        const data = {
            name: "customer1",
            emailAddress: "test@test.com",
            countryCode: "852",
            phoneNumber: "1234567",
            gender:"MALE",
            dob:"2021-01-01"
        }

        let postPersonResponse;
        try{
            postPersonResponse = await axios.post(`${DOMAIN_URL}/person`, data, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(postPersonResponse.data.personId).not.toEqual(null);
        expect(postPersonResponse.data.creationTime).not.toEqual(null);
        expect(postPersonResponse.data.lastUpdateTime).not.toEqual(null);
        expect(postPersonResponse.data.requestorId).toEqual("BOOKING_SYSTEM");
        expect(postPersonResponse.data.name).toEqual("customer1");
        expect(postPersonResponse.data.emailAddress).toEqual("test@test.com");
        expect(postPersonResponse.data.countryCode).toEqual("852");
        expect(postPersonResponse.data.phoneNumber).toEqual("1234567");
        expect(postPersonResponse.data.gender).toEqual("MALE");
    });
});