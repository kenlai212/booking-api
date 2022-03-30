"use strict";
const axios = require("axios");
const mongoose = require("mongoose");

const common = require("../../common");

const REQUEST_CONFIG = {headers:{'Authorization': `token ${common.getAccessToken()}`}}
const occupancyDBConnStr = "mongodb://localhost:27017/occupancy";
const bookingDBConnStr = "mongodb://localhost:27017/booking";

let occupancyId;

beforeAll(async() => {
    
    try{
       mongoose.connect(occupancyDBConnStr, { useUnifiedTopology: true, useNewUrlParser: true });
       await mongoose.connection.dropCollection('occupancies');
       mongoose.connection.close();
    }catch(error){
        console.error(`Mongoose Connection Error: ${error}`);
        throw error;
    }
    
    try{
        mongoose.connect(bookingDBConnStr, { useUnifiedTopology: true, useNewUrlParser: true });
        await mongoose.connection.dropCollection('wakesurfbookings');
        mongoose.connection.close();
     }catch(error){
         console.error(`Mongoose Connection Error: ${error}`);
         throw error;	
     }
     
    const postOccupancyRequest = {
        startTime: common.getTomorrowEightAMDate(),
        endTime: common.getTomorrowNineAMDate(),
        utcOffset:0,
        assetType:"BOAT",
        assetId:"A123",
        referenceType:"WAKESURF_BOOKING"
    }

    const response = await axios.post(`${common.OCCUPANCY_DOMAIN_URL}/occupancy`, postOccupancyRequest, REQUEST_CONFIG);
    occupancyId = response.data.occupancyId;
});

beforeEach(async() => {});

afterAll(() => {});

describe('Test post booking', () => {
    it("missing occupancyId, 400 error!", async () => {
        const postBookingRequest = {}
        try{
            await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("occupancyId is required");
        }
    });

    it("missing host, 400 error!", async () => {
        const postBookingRequest = {
            occupancyId: occupancyId
        }

        try{
            await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("host is required");
        }
    });

    it("missing host personId, 400 error!", async () => {
        const postBookingRequest = {
            occupancyId: occupancyId,
            host: {}
        }

        try{
            await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("host must contain at least one of [personId, name]");
        }
    });

    it("missing host phoneNumber, 400 error!", async () => {
        const postBookingRequest = {
            occupancyId: occupancyId,
            host: {
                name:"tester"
            }
        }

        try{
            await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("name missing required peer phoneNumber");
        }
    });

    it("missing host countryCode, 400 error!", async () => {
        const postBookingRequest = {
            occupancyId: occupancyId,
            host: {
                name:"tester",
                phoneNumber:"12345678"
            }
        }

        try{
            await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("name missing required peer countryCode");
        }
    });

    it("SUCCESS, 200!", async () => {
        const postBookingRequest = {
            occupancyId: occupancyId,
            host: {
                name:"tester",
                phoneNumber:"12345678",
                countryCode:"852"
            }
        }

        const postBookingResponse = await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, REQUEST_CONFIG);
        expect.assertions(9);
        expect(postBookingResponse.status).toEqual(200);
        expect(postBookingResponse.data.bookingId).not.toBeNull();
        expect(postBookingResponse.data.creationTime).not.toBeNull();
        expect(postBookingResponse.data.lastUpdateTime).not.toBeNull();
        expect(postBookingResponse.data.occupancyId).toEqual(occupancyId);
        expect(postBookingResponse.data.status).toEqual(`AWAITING_CONFIRMATION`);

        const getOccupanncyResponse = await axios.get(`${common.OCCUPANCY_DOMAIN_URL}/occupancy/${occupancyId}`, REQUEST_CONFIG);
        expect(getOccupanncyResponse.status).toEqual(200);
        expect(getOccupanncyResponse.data.status).toEqual("CONFIRMED");
        expect(getOccupanncyResponse.data.referenceId).toEqual(postBookingResponse.data.bookingId);
    });
});