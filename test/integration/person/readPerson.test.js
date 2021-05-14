"use strict";
const axios = require("axios");

const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/people/shitSon`, REQUEST_CONFIG);
});

describe('Test read person api', () => {
    it('get person', async () => {
        //add new person
        const data = {
            name: "ken"
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
        expect(postPersonResponse.data.name).toEqual("ken");

        //get person
        let getPersonResponse;
        try{
            getPersonResponse = await axios.get(`${DOMAIN_URL}/person/${postPersonResponse.data.personId}`, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(getPersonResponse.data.personId).toEqual(postPersonResponse.data.personId);
        expect(getPersonResponse.data.creationTime).not.toEqual(null);
        expect(getPersonResponse.data.lastUpdateTime).not.toEqual(null);
        expect(getPersonResponse.data.requestorId).toEqual("BOOKING_SYSTEM");
        expect(getPersonResponse.data.name).toEqual("ken");
    });
});