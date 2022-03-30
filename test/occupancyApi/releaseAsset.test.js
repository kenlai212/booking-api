"use strict";
const axios = require("axios");
const mongoose = require("mongoose");

const common = require("../../common");
const occupancyTestCommon = require("./occupancyTestCommon");

const REQUEST_CONFIG = {headers:{'Authorization': `token ${common.getAccessToken()}`}}

beforeAll(async() => {
    try{
       mongoose.connect(occupancyTestCommon.MONGO_DB_URL, { useUnifiedTopology: true, useNewUrlParser: true });
    }catch(error){
        console.error(`Mongoose Connection Error: ${error}`, "Mongoose Connection Error");	
    }
});

beforeEach(async() => {
    try{
        await mongoose.connection.dropCollection('occupancies');
    }catch(error){
        console.error(error);
    }
});

afterAll(() => {
    mongoose.connection.close();
});

describe('Test delete occupancy', () => {
    it("missing occupancyId, 404 error!", async () => {
        try{
            await axios.delete(`${occupancyTestCommon.OCCUPANCY_DOMAIN_URL}/occupancy`, REQUEST_CONFIG);
        }catch(error){
            expect.assertions(1);
            expect(error.response.status).toEqual(404);
        }
    });

    it("invalid occupacyId, 404 error!", async () => {
        const postOccupancyRequest = {
            startTime: occupancyTestCommon.getTomorrowEightAMDate(),
            endTime: occupancyTestCommon.getTomorrowNineAMDate(),
            utcOffset:0,
            assetType:"BOAT",
            assetId:"A123",
            referenceType:"WAKESURF_BOOKING"
        }

        await axios.post(`${occupancyTestCommon.OCCUPANCY_DOMAIN_URL}/occupancy`, postOccupancyRequest, REQUEST_CONFIG);

        try{
            await axios.delete(`${occupancyTestCommon.OCCUPANCY_DOMAIN_URL}/occupancy/NON_EXIST`, REQUEST_CONFIG);
        }catch(error){
            expect.assertions(1);
            expect(error.response.status).toEqual(404);
        }
    });

    it("valid occupacyId, 200!", async () => {
        const postOccupancy1Request = {
            startTime: occupancyTestCommon.getTomorrowEightAMDate(),
            endTime: occupancyTestCommon.getTomorrowNineAMDate(),
            utcOffset:0,
            assetType:"BOAT",
            assetId:"A123",
            referenceType:"WAKESURF_BOOKING"
        }
        const postOccupancy1Response = await axios.post(`${occupancyTestCommon.OCCUPANCY_DOMAIN_URL}/occupancy`, postOccupancy1Request, REQUEST_CONFIG);
        const getOccupancy1Response = await axios.get(`${occupancyTestCommon.OCCUPANCY_DOMAIN_URL}/occupancy/${postOccupancy1Response.data.occupancyId}`, REQUEST_CONFIG);
        const deleteOccupancy1Response = await axios.delete(`${occupancyTestCommon.OCCUPANCY_DOMAIN_URL}/occupancy/${postOccupancy1Response.data.occupancyId}`, REQUEST_CONFIG);
        
        let getOccupancyError;
        try{
            await axios.get(`${occupancyTestCommon.OCCUPANCY_DOMAIN_URL}/occupancy/${postOccupancy1Response.data.occupancyId}`, REQUEST_CONFIG);
        }catch(err){
            getOccupancyError = err;
        } 

        expect.assertions(6);
        expect(getOccupancy1Response.status).toEqual(200);
        expect(getOccupancy1Response.data.occupancyId).toEqual(postOccupancy1Response.data.occupancyId);
        expect(getOccupancy1Response.data.status).toEqual("RESERVED");
        expect(deleteOccupancy1Response.status).toEqual(200);
        expect(deleteOccupancy1Response.data.status).toEqual("SUCCESS");
        expect(getOccupancyError.response.status).toEqual(404);
    });
});