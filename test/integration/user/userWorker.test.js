"use strict";
const axios = require("axios");
const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/people/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/user/people/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/users/shitSon`, REQUEST_CONFIG);
});

describe('Test user.worker', () => {
    it('test listen to new person queue', async () => {
        //add new person
        const postPersonData = {
            name: "tester1",
            role: "CUSTOMER"
        }

        let postPersonResponse;
        try{
            postPersonResponse = await axios.post(`${DOMAIN_URL}/person`, postPersonData, REQUEST_CONFIG);
        }catch(error){
            console.error(error);
        }

        //read userPerson
        let getUserPersonResponse;
        try{
            getUserPersonResponse = await axios.get(`${DOMAIN_URL}/user/person/${postPersonResponse.data.personId}`, REQUEST_CONFIG);
        }catch(error){
            console.error(error);
        }

        expect(getUserPersonResponse.data.personId).toEqual(postPersonResponse.data.personId);
        expect(getUserPersonResponse.data.roles).toEqual(["CUSTOMER"]);
    });
});