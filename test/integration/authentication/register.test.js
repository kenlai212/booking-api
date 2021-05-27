"use strict";
const axios = require("axios");

const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/authentication/claims/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/authentication/credentialses/shitSon`, REQUEST_CONFIG);
});

describe('Test register api', () => {
    it('post register', async () => {
        //post register
        const data = {
            "loginId":"A",
            "password":"B",
            "userId":"C",
            "userStatus":"ACTIVE",
            "personId":"D"
        }

        let registerResponse;
        try{
            registerResponse = await axios.post(`${DOMAIN_URL}/authentication/register`, data, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(registerResponse.data.status).toEqual("SUCCESS");
        
        //get claim
        let getClaimResponse;
        try{
            getClaimResponse = await axios.get(`${DOMAIN_URL}/authentication/claim/${data.userId}`, REQUEST_CONFIG);
        }catch(error){
            console.log(error);
        }

        expect(getClaimResponse.data.userId).toEqual("C");
        expect(getClaimResponse.data.personId).toEqual("D");
        expect(getClaimResponse.data.userStatus).toEqual("ACTIVE");

        //get credentials
        let getCredentialsResponse
        try{
            getCredentialsResponse = await axios.get(`${DOMAIN_URL}/authentication/credentials?userId=${data.userId}`, REQUEST_CONFIG);
        }catch(error){
            console.log(error);         
        }

        expect(getCredentialsResponse.data.userId).toEqual("C");
        expect(getCredentialsResponse.data.loginId).toEqual("A");
        expect(getCredentialsResponse.data.password).toEqual("B");
    });
});