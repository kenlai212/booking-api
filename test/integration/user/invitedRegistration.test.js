"use strict";
const axios = require("axios");
const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/people/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/user/people/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/users/shitSon`, REQUEST_CONFIG);
});

describe('Test invitedRegistration api', () => {
    it('test post user api', async () => {
        //add new person
        const postPersonData = {
            name: "tester1"
        }

        let postPersonResponse;
        try{
            postPersonResponse = await axios.post(`${DOMAIN_URL}/person`, postPersonData, REQUEST_CONFIG);
        }catch(error){
            console.error(error);
        }

        //register user
        const postUserData = {
            personId: postPersonResponse.data.personId,
            loginId: "A",
            password: "B"
        }

        let postUserResponse;
        try{
            postUserResponse = await axios.post(`${DOMAIN_URL}/user`, postUserData, REQUEST_CONFIG);
        }catch(error){
            console.error(error);
        }
        
        expect(postUserResponse.data.userId).not.toEqual(null);
        expect(postUserResponse.data.status).toEqual("ACTIVE");
    });
});