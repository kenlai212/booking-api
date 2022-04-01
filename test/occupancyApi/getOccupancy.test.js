"use strict";
const axios = require("axios");
const mongoose = require("mongoose");

const common = require("../../common");

const REQUEST_CONFIG = {headers:{'Authorization': `token ${common.getAccessToken()}`}}

beforeAll(async() => {
    try{
       mongoose.connect(common.OCCUPANCY_MONGO_DB_URL, { useUnifiedTopology: true, useNewUrlParser: true });
    }catch(error){
        console.error(`Mongoose Connection Error: ${error}`, "Mongoose Connection Error");	
    }
});

beforeEach(async() => {
    try{
        await mongoose.connection.dropCollection('occupancies');
    }catch(error){
        //console.error(error);
    }
});

afterAll(() => {
    mongoose.connection.close();
});

describe('Test get occupancy', () => {
    it("missing occupacyId, 404 error!", async () => {
        try{
            await axios.get(`${common.OCCUPANCY_DOMAIN_URL}/occupancy`, REQUEST_CONFIG);
        }catch(error){
            expect.assertions(1);
            expect(error.response.status).toEqual(404);
        }
    });

    it("invalid occupacyId, 404 error!", async () => {
        const postOccupancyRequest = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowNineAMDate(),
            utcOffset:0,
            assetType:"BOAT",
            assetId:"A123",
            referenceType:"WAKESURF_BOOKING"
        }

        await axios.post(`${common.OCCUPANCY_DOMAIN_URL}/occupancy`, postOccupancyRequest, REQUEST_CONFIG);

        try{
            await axios.get(`${common.OCCUPANCY_DOMAIN_URL}/occupancy/NON_EXIST`, REQUEST_CONFIG);
        }catch(error){
            expect.assertions(1);
            expect(error.response.status).toEqual(404);
        }
    });

    it("valid occupacyId, 200!", async () => {
        const postOccupancy1Request = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowNineAMDate(),
            utcOffset:0,
            assetType:"BOAT",
            assetId:"A123",
            referenceType:"WAKESURF_BOOKING"
        }
        const postOccupancy1Response = await axios.post(`${common.OCCUPANCY_DOMAIN_URL}/occupancy`, postOccupancy1Request, REQUEST_CONFIG);
        const getOccupancy1Response = await axios.get(`${common.OCCUPANCY_DOMAIN_URL}/occupancy/${postOccupancy1Response.data.occupancyId}`, REQUEST_CONFIG);

        const postOccupancy2Request = {
            startTime: common.getTomorrowTenAMDate(),
            endTime: common.getTomorrowElevenAMDate(),
            utcOffset:0,
            assetType:"BOAT",
            assetId:"A456",
            referenceType:"MAINTAINANCE"
        }
        const postOccupancy2Response = await axios.post(`${common.OCCUPANCY_DOMAIN_URL}/occupancy`, postOccupancy2Request, REQUEST_CONFIG);
        const getOccupancy2Response = await axios.get(`${common.OCCUPANCY_DOMAIN_URL}/occupancy/${postOccupancy2Response.data.occupancyId}`, REQUEST_CONFIG);

        expect.assertions(20);
        expect(getOccupancy1Response.status).toEqual(200);
        expect(getOccupancy1Response.data.occupancyId).toEqual(postOccupancy1Response.data.occupancyId);
        expect(getOccupancy1Response.data.creationTime).toEqual(postOccupancy1Response.data.creationTime);
        expect(getOccupancy1Response.data.lastUpdateTime).toEqual(postOccupancy1Response.data.lastUpdateTime);
        expect(getOccupancy1Response.data.startTime).toEqual(postOccupancy1Response.data.startTime);
        expect(getOccupancy1Response.data.endTime).toEqual(postOccupancy1Response.data.endTime);
        expect(getOccupancy1Response.data.assetType).toEqual(postOccupancy1Response.data.assetType);
        expect(getOccupancy1Response.data.assetId).toEqual(postOccupancy1Response.data.assetId);
        expect(getOccupancy1Response.data.referenceType).toEqual(postOccupancy1Response.data.referenceType);
        expect(getOccupancy1Response.data.status).toEqual(postOccupancy1Response.data.status);
        expect(getOccupancy2Response.status).toEqual(200);
        expect(getOccupancy2Response.data.occupancyId).toEqual(postOccupancy2Response.data.occupancyId);
        expect(getOccupancy2Response.data.creationTime).toEqual(postOccupancy2Response.data.creationTime);
        expect(getOccupancy2Response.data.lastUpdateTime).toEqual(postOccupancy2Response.data.lastUpdateTime);
        expect(getOccupancy2Response.data.startTime).toEqual(postOccupancy2Response.data.startTime);
        expect(getOccupancy2Response.data.endTime).toEqual(postOccupancy2Response.data.endTime);
        expect(getOccupancy2Response.data.assetType).toEqual(postOccupancy2Response.data.assetType);
        expect(getOccupancy2Response.data.assetId).toEqual(postOccupancy2Response.data.assetId);
        expect(getOccupancy2Response.data.referenceType).toEqual(postOccupancy2Response.data.referenceType);
        expect(getOccupancy2Response.data.status).toEqual(postOccupancy2Response.data.status);
    });
});