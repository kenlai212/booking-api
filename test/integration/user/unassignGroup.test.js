"use strict";
const axios = require("axios");
const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

const testHelper = require("./testHelper");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/people/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/user/people/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/users/shitSon`, REQUEST_CONFIG);
});

describe('Test assignGroup api', () => {
    it('test put user/group api', async () => {
        const setupResult = await testHelper.setupPersonAndRegisterUser();

        //assign group1
        const assignGroup1Data = {
            userId: setupResult.userId,
            groupId: "BOOKING_ADMIN" 
        }

        let putUserResponse;
        try{
            putUserResponse = await axios.put(`${DOMAIN_URL}/user/group`, assignGroup1Data, REQUEST_CONFIG);
        }catch(error){
            console.error(error);
        }

        //assign group2
        const assignGroup2Data = {
            userId: setupResult.userId,
            groupId: "PRICING_ADMIN" 
        }

        try{
            putUserResponse = await axios.put(`${DOMAIN_URL}/user/group`, assignGroup2Data, REQUEST_CONFIG);
        }catch(error){
            console.error(error);
        }

        //find user
        let getUserResponse;
        try{
            getUserResponse = await axios.get(`${DOMAIN_URL}/user/${setupResult.userId}`, REQUEST_CONFIG);
        }catch(error){
            console.error(error);
        }
        
        expect(getUserResponse.data.userId).toEqual(setupResult.userId);
        expect(getUserResponse.data.status).toEqual("ACTIVE");
        expect(getUserResponse.data.registrationTime).not.toEqual(null);
        expect(getUserResponse.data.groups).toEqual(["BOOKING_ADMIN", "PRICING_ADMIN"]);

        //unassign group1
        const unassignGroup1Data = {
            userId: setupResult.userId,
            groupId: "BOOKING_ADMIN" 
        }

        try{
            putUserResponse = await axios.put(`${DOMAIN_URL}/user/group/unassign`, unassignGroup1Data, REQUEST_CONFIG);
        }catch(error){
            console.error(error);
        }

        //find user again
        try{
            getUserResponse = await axios.get(`${DOMAIN_URL}/user/${setupResult.userId}`, REQUEST_CONFIG);
        }catch(error){
            console.error(error);
        }
        
        expect(getUserResponse.data.userId).toEqual(setupResult.userId);
        expect(getUserResponse.data.status).toEqual("ACTIVE");
        expect(getUserResponse.data.registrationTime).not.toEqual(null);
        expect(getUserResponse.data.groups).toEqual(["PRICING_ADMIN"]);
    });
});