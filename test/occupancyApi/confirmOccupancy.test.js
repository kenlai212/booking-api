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

describe('Test confrim occupancy', () => {
    it("missing occupacyId, 400 error!", async () => {
        const putOccupancyRequest = {}
        
        try{
            await axios.put(`${common.OCCUPANCY_DOMAIN_URL}/occupancy/confirm`, putOccupancyRequest,REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("occupancyId is required");
        }
    });

    it("missing referenceType, 400 error!", async () => {
        const putOccupancyRequest = {
            occupancyId: "O123"
        }

        try{
            await axios.put(`${common.OCCUPANCY_DOMAIN_URL}/occupancy/confirm`, putOccupancyRequest,REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("referenceType is required");
        }
    });

    it("missing referenceId, 400 error!", async () => {
        const putOccupancyRequest = {
            occupancyId: "O123",
            referenceType: "REFERENCE_TYPE"
        }

        try{
            await axios.put(`${common.OCCUPANCY_DOMAIN_URL}/occupancy/confirm`, putOccupancyRequest,REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("referenceId is required");
        }
    });

    it("invalid occupancyId, 404 error!", async () => {
        const putOccupancyRequest = {
            occupancyId: "O123",
            referenceType: "REFERENCE_TYPE",
            referenceId: "R123"
        }

        try{
            await axios.put(`${common.OCCUPANCY_DOMAIN_URL}/occupancy/confirm`, putOccupancyRequest,REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(404);
            expect(error.response.data.error).toEqual("Occupancy not found");
        }
    });

    it("invalid referenceType, 200", async () => {
        const postOccupancy1Request = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowNineAMDate(),
            utcOffset:0,
            assetType:"BOAT",
            assetId:"A123",
            referenceType:"WAKESURF_BOOKING"
        }
        const postOccupancy1Response = await axios.post(`${common.OCCUPANCY_DOMAIN_URL}/occupancy`, postOccupancy1Request, REQUEST_CONFIG);

        try{
            const putOccupancyRequest = {
                occupancyId: postOccupancy1Response.data.occupancyId,
                referenceType: "INVALID_REFERENCE_TYPE",
                referenceId: "R123"
            }
            await axios.put(`${common.OCCUPANCY_DOMAIN_URL}/occupancy/confirm`, putOccupancyRequest,REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("Invalid referencyType");
        } 
    });

    it("success, 200", async () => {
        const postOccupancy1Request = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowNineAMDate(),
            utcOffset:0,
            assetType:"BOAT",
            assetId:"A123",
            referenceType:"WAKESURF_BOOKING"
        }
        const postOccupancy1Response = await axios.post(`${common.OCCUPANCY_DOMAIN_URL}/occupancy`, postOccupancy1Request, REQUEST_CONFIG);
        const putOccupancyRequest = {
            occupancyId: postOccupancy1Response.data.occupancyId,
            referenceType: "WAKESURF_BOOKING",
            referenceId: "R123"
        }
        const putOccupancyResponse = await axios.put(`${common.OCCUPANCY_DOMAIN_URL}/occupancy/confirm`, putOccupancyRequest,REQUEST_CONFIG);

        expect.assertions(3);
        expect(putOccupancyResponse.status).toEqual(200);
        expect(putOccupancyResponse.data.occupancyId).toEqual(postOccupancy1Response.data.occupancyId);
        expect(putOccupancyResponse.data.status).toEqual("CONFIRMED");
    });
});