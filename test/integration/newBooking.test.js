"use strict";
const axios = require("axios");
const common = require("./bookingTest.common");

beforeAll(async() => {
    await common.flushAllCollections();
    await common.createS123Staff();
});

describe('Test post booking', () => {
    it("missing startTime, 400 error!", async () => {
        const postBookingRequest = {}

        try{
            await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            //console.log(error);
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("startTime is required");
        }
    });

    it("missing endTime, 400 error!", async () => {
        const postBookingRequest = {
            startTime: common.getTomorrowEightAMDate()
        }

        try{
            await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("endTime is required");
        }
    });

    it("missing utcOffset, 400 error!", async () => {
        const postBookingRequest = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowNineAMDate()
        }

        try{
            await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("utcOffset is required");
        }
    });

    it("missing assetId, 400 error!", async () => {
        const postBookingRequest = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowNineAMDate(),
            utcOffset: 8
        }

        try{
            await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("assetId is required");
        }
    });

    it("invalid assetId, 400 error!", async () => {
        const postBookingRequest = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowNineAMDate(),
            utcOffset: 8,
            assetId:"INVALID_ASSET_ID"
        }

        try{
            await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("assetId must be one of [A24, NXT20]");
        }
    });

    it("empty quote, 400 error!", async () => {
        const postBookingRequest = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowNineAMDate(),
            utcOffset: 8,
            assetId:"A24",
            quote:{}
        }

        try{
            await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("quote.price is required");
        }
    });

    it("missing quote currency, 400 error!", async () => {
        const postBookingRequest = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowNineAMDate(),
            utcOffset: 8,
            assetId:"A24",
            quote:{
                price:1000
            }
        }

        try{
            await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("quote.currency is required");
        }
    });

    it("invalid quote currency, 400 error!", async () => {
        const postBookingRequest = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowNineAMDate(),
            utcOffset: 8,
            assetId:"A24",
            quote:{
                price:1000,
                currency: "USD"
            }
        }

        try{
            await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("quote.currency must be one of [HKD, RMB]");
        }
    });

    it("missing host, 400 error!", async () => {
        const postBookingRequest = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowNineAMDate(),
            utcOffset: 8,
            assetId:"A24"
        }

        try{
            await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("host is required");
        }
    });

    it("missing host.personId or host.name, 400 error!", async () => {
        const postBookingRequest = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowNineAMDate(),
            utcOffset: 8,
            assetId:"A24",
            host: {}
        }

        try{
            await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("host must contain at least one of [personId, name]");
        }
    });

    it("missing channelId, 400 error!", async () => {
        const postBookingRequest = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowNineAMDate(),
            utcOffset: 8,
            assetId:"A24",
            host: {
                name:"tester1"
            },
            captain:{ staffId:"INVALID_STAFFID" }
        }

        try{
            await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("channelId is required");
        }
    });

    it("invalid channelId, 400 error!", async () => {
        const postBookingRequest = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowNineAMDate(),
            utcOffset: 8,
            assetId:"A24",
            host: {
                name:"tester1"
            },
            captain:{ staffId:"INVALID_STAFFID" },
            channelId: "INVALID_CHANNELID"
        }

        try{
            await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("channelId must be one of [HOLIMOOD, SALES]");
        }
    });

    it("missing captain.staffId, 400 error!", async () => {
        const postBookingRequest = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowNineAMDate(),
            utcOffset: 8,
            assetId:"A24",
            host: {
                name:"tester1"
            },
            channelId: "HOLIMOOD",
            captain:{}
        }

        try{
            await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("captain.staffId is required");
        }
    });

    it("invalid captain.staffId, 404 error!", async () => {
        const postBookingRequest = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowNineAMDate(),
            utcOffset: 8,
            assetId:"A24",
            host: {
                name:"tester1"
            },
            captain:{
                staffId:"INVALID_STAFF"
            },
            channelId: "SALES"
        }

        try{
            await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(404);
            expect(error.response.data.error).toEqual("Staff not found");
        }
    });

    it("crew not array, 400 error!", async () => {
        const postBookingRequest = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowNineAMDate(),
            utcOffset: 8,
            assetId:"A24",
            host: {
                name:"tester1"
            },
            captain:{
                staffId:"S123"
            },
            channelId: "SALES",
            crew: "INVALID_CREW_ARRAY"
        }

        try{
            await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("crew must be an array");
        }
    });

    it("empty crew array, 400 error!", async () => {
        const postBookingRequest = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowNineAMDate(),
            utcOffset: 8,
            assetId:"A24",
            host: {
                name:"tester1"
            },
            captain:{
                staffId:"S123"
            },
            channelId: "SALES",
            crew: []
        }

        try{
            await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("crew must contain at least 1 items");
        }
    });

    it("missing crew staffId, 400 error!", async () => {
        const postBookingRequest = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowNineAMDate(),
            utcOffset: 8,
            assetId:"A24",
            host: {
                name:"tester1"
            },
            captain:{
                staffId:"S123"
            },
            channelId: "SALES",
            crew: [{}]
        }

        try{
            await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("crew[0].staffId is required");
        }
    });

    it("invalid crew staffId, 404 error!", async () => {
        const postBookingRequest = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowNineAMDate(),
            utcOffset: 8,
            assetId:"A24",
            host: {
                name:"tester1"
            },
            captain:{
                staffId:"S123"
            },
            channelId: "SALES",
            crew: [{
                staffId:"INVALID_STAFF_ID"
            }]
        }

        try{
            await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(404);
            expect(error.response.data.error).toEqual("Staff not found");
        }
    });

    it("SUCCESS, 200!", async () => {
        const postBookingRequest = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowNineAMDate(),
            utcOffset: 8,
            assetId:"A24",
            host: {
                name:"tester",
                phoneNumber:"12345678",
                countryCode:"852"
            },
            captain:{
                staffId: "S123"
            },
            quote:{
                price: 1000,
                currency: "HKD"
            },
            crew: [{
                staffId:"S123"
            }],
            channelId: "SALES"
        }
        const postBookingResponse = await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, postBookingRequest, common.AXIO_REQUEST_CONFIG);   

        expect.assertions(13);
        expect(postBookingResponse.status).toEqual(200);
        expect(postBookingResponse.data.bookingId).not.toBeNull();
        expect(postBookingResponse.data.creationTime).not.toBeNull();
        expect(postBookingResponse.data.lastUpdateTime).not.toBeNull();
        expect(postBookingResponse.data.status).toEqual(`AWAITING_CONFIRMATION`);
        expect(postBookingResponse.data.captain.staffId).toEqual("S123");
        expect(postBookingResponse.data.startTime).not.toBeNull();
        expect(postBookingResponse.data.endTime).not.toBeNull();
        expect(postBookingResponse.data.asset.assetId).toEqual("A24");
        expect(postBookingResponse.data.quote.price).toEqual(1000);
        expect(postBookingResponse.data.quote.currency).toEqual("HKD");
        expect(postBookingResponse.data.crew[0]).toEqual({staffId: "S123"});
        expect(postBookingResponse.data.channelId).toEqual("SALES");
    });

});