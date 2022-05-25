"use strict";
const axios = require("axios");
const common = require("./bookingTest.common");

const POST_BOOKING_REQUEST = {
    startTime: common.getTomorrowEightAMDate(),
    endTime: common.getTomorrowNineAMDate(),
    utcOffset:0,
    assetId:"A24",
    host: {
        name:"tester",
        phoneNumber:"12345678",
        countryCode:"852"
    },
    channelId:"HOLIMOOD"
}

beforeEach(async() => {
    await common.flushAllCollections();
    await common.createS123Staff();
});

describe('Test fulfill booking', () => {
    it("missing bookingId, 400 error!", async () => {
        const putBookingRequest = {}
        try{
            await axios.put(`${common.BOOKING_DOMAIN_URL}/booking/status/fulfill`, putBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("bookingId is required");
        }
    });

    it("missing bookingTime.startTime, 400 error!", async () => {
        const putBookingRequest = {
            bookingId: "B123",
            fulfillTime:{}
        }

        try{
            await axios.put(`${common.BOOKING_DOMAIN_URL}/booking/status/fulfill`, putBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("fulfillTime.startTime is required");
        }
    });

    it("invalid startTime, 400 error!", async () => {
        const putBookingRequest = {
            bookingId: "B123",
            fulfillTime:{
                startTime: "INVALID_START_TIME"
            }
        }

        try{
            await axios.put(`${common.BOOKING_DOMAIN_URL}/booking/status/fulfill`, putBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("fulfillTime.startTime must be in ISO 8601 date format");
        }
    });

    it("missing endTime, 400 error!", async () => {
        const putBookingRequest = {
            bookingId: "B123",
            fulfillTime:{
                startTime: "2022-01-01T08:00:00"
            }
        }

        try{
            await axios.put(`${common.BOOKING_DOMAIN_URL}/booking/status/fulfill`, putBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("fulfillTime.endTime is required");
        }
    });

    it("invalid endTime, 400 error!", async () => {
        const putBookingRequest = {
            bookingId: "B123",
            fulfillTime:{
                startTime: "2022-01-01T08:00:00",
                endTime: "INVALID_END_TIME"
            }
        }

        try{
            await axios.put(`${common.BOOKING_DOMAIN_URL}/booking/status/fulfill`, putBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("fulfillTime.endTime must be in ISO 8601 date format");
        }
    });

    it("missing utcOffset, 400 error!", async () => {
        const putBookingRequest = {
            bookingId: "B123",
            fulfillTime:{
                startTime: "2022-01-01T08:00:00",
                endTime: "2022-01-01T09:00:00"
            }
        }

        try{
            await axios.put(`${common.BOOKING_DOMAIN_URL}/booking/status/fulfill`, putBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("fulfillTime.utcOffset is required");
        }
    });

    it("invalid bookingId, 404 error!", async () => {
        const putBookingRequest = {
            bookingId: "INVALID_BOOKING_ID"
        }

        try{
            await axios.put(`${common.BOOKING_DOMAIN_URL}/booking/status/fulfill`, putBookingRequest, common.AXIO_REQUEST_CONFIG);
        }catch(error){
            expect.assertions(1);
            expect(error.response.status).toEqual(404);
        }
    });

    it("success original bookingTime, 200", async () => {
        const postBookingResponse = await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, POST_BOOKING_REQUEST, common.AXIO_REQUEST_CONFIG);

        const putBookingRequest = {
            bookingId: postBookingResponse.data.bookingId
        }
        const putBookingResponse = await axios.put(`${common.BOOKING_DOMAIN_URL}/booking/status/fulfill`, putBookingRequest, common.AXIO_REQUEST_CONFIG);

        expect.assertions(4);
        expect(putBookingResponse.status).toEqual(200);
        expect(putBookingResponse.data.bookingId).toEqual(postBookingResponse.data.bookingId);
        expect(putBookingResponse.data.status).toEqual("FULFILLED");
        expect(putBookingResponse.data.fulfillment).toEqual({
            startTime: common.getTomorrowEightAMDate().toISOString(),
            endTime: common.getTomorrowNineAMDate().toISOString()
        });

    });

    it("success new fulfillTime, 200", async () => {
        const postBookingResponse = await axios.post(`${common.BOOKING_DOMAIN_URL}/booking`, POST_BOOKING_REQUEST, common.AXIO_REQUEST_CONFIG);

        const putBookingRequest = {
            bookingId: postBookingResponse.data.bookingId,
            fulfillTime:{
                startTime:"2022-01-01T08:00:00",
                endTime:"2022-01-01T09:00:00",
                utcOffset:8
            }
        }
        const putBookingResponse = await axios.put(`${common.BOOKING_DOMAIN_URL}/booking/status/fulfill`, putBookingRequest, common.AXIO_REQUEST_CONFIG);

        expect.assertions(4);
        expect(putBookingResponse.status).toEqual(200);
        expect(putBookingResponse.data.bookingId).toEqual(postBookingResponse.data.bookingId);
        expect(putBookingResponse.data.status).toEqual("FULFILLED");
        expect(putBookingResponse.data.fulfillment).toEqual({
            startTime: "2022-01-01T00:00:00.000Z",
            endTime: "2022-01-01T01:00:00.000Z"
        });

    });
});