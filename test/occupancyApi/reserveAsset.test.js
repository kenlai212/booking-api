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

describe('Test post occupancy', () => {
    it("missing startTime, 400 error!", async () => {
        const postOccupancyRequest = {}
        try{
            await axios.post(`${common.OCCUPANCY_DOMAIN_URL}/occupancy`, postOccupancyRequest, REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("startTime is required");
        }
    });

    it("missing endTime, 400 error!", async () => {
        const postOccupancyRequest = {
            startTime:"2022-03-01T08:00:00"
        }

        try{
            await axios.post(`${common.OCCUPANCY_DOMAIN_URL}/occupancy`, postOccupancyRequest, REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("endTime is required");
        }
    });

    it("missing utcOffset, 400 error!", async () => {
        const postOccupancyRequest = {
            startTime:"2022-03-01T08:00:00",
            endTime:"2022-03-01T08:00:00"
        }

        try{
            await axios.post(`${common.OCCUPANCY_DOMAIN_URL}/occupancy`, postOccupancyRequest, REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("utcOffset is required");
        }
    });

    it("missing assetType, 400 error!", async () => {
        const postOccupancyRequest = {
            startTime:"2022-03-01T08:00:00",
            endTime:"2022-03-01T08:00:00",
            utcOffset:0
        }

        try{
            await axios.post(`${common.OCCUPANCY_DOMAIN_URL}/occupancy`, postOccupancyRequest, REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("assetType is required");
        }
    });

    it("invalid assetType, 400 error!", async () => {
        const postOccupancyRequest = {
            startTime:"2022-03-01T08:00:00",
            endTime:"2022-03-01T08:00:00",
            utcOffset:0,
            assetType:"INVALID_ASSETYPE"
        }

        try{
            await axios.post(`${common.OCCUPANCY_DOMAIN_URL}/occupancy`, postOccupancyRequest, REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("assetType must be [BOAT]");
        }
    });

    it("missing assetId, 400 error!", async () => {
        const postOccupancyRequest = {
            startTime:"2022-03-01T08:00:00",
            endTime:"2022-03-01T08:00:00",
            utcOffset:0,
            assetType:"BOAT"
        }

        try{
            await axios.post(`${common.OCCUPANCY_DOMAIN_URL}/occupancy`, postOccupancyRequest, REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("assetId is required");
        }
    });

    it("missing referenceType, 400 error!", async () => {
        const postOccupancyRequest = {
            startTime:"2022-03-01T08:00:00",
            endTime:"2022-03-01T08:00:00",
            utcOffset:0,
            assetType:"BOAT",
            assetId:"A123"
        }

        try{
            await axios.post(`${common.OCCUPANCY_DOMAIN_URL}/occupancy`, postOccupancyRequest, REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("referenceType is required");
        }
    });

    it("invalid referenceType, 400 error!", async () => {
        const postOccupancyRequest = {
            startTime:"2022-03-01T08:00:00",
            endTime:"2022-03-01T08:00:00",
            utcOffset:0,
            assetType:"BOAT",
            assetId:"A123",
            referenceType:"INVALID_REFERENCT_TYPE"
        }

        try{
            await axios.post(`${common.OCCUPANCY_DOMAIN_URL}/occupancy`, postOccupancyRequest, REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("referenceType must be one of [WAKESURF_BOOKING, MAINTAINANCE]");
        }
    });

    it("startTime same as endTime, 400 error!", async () => {
        const postOccupancyRequest = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowEightAMDate(),
            utcOffset:0,
            assetType:"BOAT",
            assetId:"A123",
            referenceType:"WAKESURF_BOOKING"
        }

        try{
            await axios.post(`${common.OCCUPANCY_DOMAIN_URL}/occupancy`, postOccupancyRequest, REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("endTime cannot be same as startTime");
        }
    });

    it("startTime in the past, 400 error!", async () => {
        const postOccupancyRequest = {
            startTime: common.getYesterdayEightAMDate(),
            endTime: common.getTomorrowNineAMDate(),
            utcOffset:0,
            assetType:"BOAT",
            assetId:"A123",
            referenceType:"WAKESURF_BOOKING"
        }

        try{
            await axios.post(`${common.OCCUPANCY_DOMAIN_URL}/occupancy`, postOccupancyRequest, REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("startTime or endTime cannot be in the past");
        }
    });

    it("endTime befor startTime, 400 error!", async () => {
        const postOccupancyRequest = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowSevenAmDate(),
            utcOffset:0,
            assetType:"BOAT",
            assetId:"A123",
            referenceType:"WAKESURF_BOOKING"
        }

        try{
            await axios.post(`${common.OCCUPANCY_DOMAIN_URL}/occupancy`, postOccupancyRequest, REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("endTime cannot be earlier then startTime");
        }
    });

    it("success, returns 200!", async () => {
        const postOccupancyRequest = {
            startTime: common.getTomorrowEightAMDate(),
            endTime: common.getTomorrowNineAMDate(),
            utcOffset:0,
            assetType:"BOAT",
            assetId:"A123",
            referenceType:"WAKESURF_BOOKING"
        }

        const response = await axios.post(`${common.OCCUPANCY_DOMAIN_URL}/occupancy`, postOccupancyRequest, REQUEST_CONFIG);
        expect.assertions(10);
        expect(response.status).toEqual(200);
        expect(response.data.occupancyId).not.toBeNull();
        expect(response.data.creationTime).not.toBeNull();
        expect(response.data.lastUpdateTime).not.toBeNull();
        expect(response.data.startTime).toEqual(common.getTomorrowEightAMDate().toISOString());
        expect(response.data.endTime).toEqual(common.getTomorrowNineAMDate().toISOString());
        expect(response.data.assetType).toEqual("BOAT");
        expect(response.data.assetId).toEqual("A123");
        expect(response.data.referenceType).toEqual("WAKESURF_BOOKING");
        expect(response.data.status).toEqual("RESERVED");
/*
        try{
            const kafka = new Kafka({
                clientId: "sit",
                brokers: "localhost:9092".split(" ")
            });
        
            const admin = kafka.admin();
	        await admin.connect();
            await admin.deleteTopics({
                topics: ["RESERVE_OCCUPANCY"]
            })
	        await admin.createTopics({
		        topics: [{topic: "RESERVE_OCCUPANCY"}]
	        });
	        await admin.disconnect();

            const consumer = kafka.consumer({
                groupId: "sit-reserve-asset-group"
            });
            await consumer.connect();
            await consumer.subscribe({
                topic: "RESERVE_OCCUPANCY",
                fromBeginning: false
            });
        
            await consumer.run({
                eachMessage: async result => {
                    const kafkaEvent = JSON.parse(result.message.value);
                    console.log(kafkaEvent);

                    expect(kafkaEvent.occupancyId).toEqual(response.data.occupancyId);
                    expect(kafkaEvent.creationTime).toEqual(response.data.creationTime);
                    expect(kafkaEvent.lastUpdateTime).toEqual(response.data.lastUpdateTime);
                    expect(kafkaEvent.startTime).toEqual(response.data.startTime);
                    expect(kafkaEvent.endTime).toEqual(response.data.endTime);
                    expect(kafkaEvent.assetType).toEqual(response.data.assetType);
                    expect(kafkaEvent.assetId).toEqual(response.data.assetId);
                    expect(kafkaEvent.referenceType).toEqual(response.data.referenceType);
                    expect(kafkaEvent.status).toEqual(response.data.status);
                }
            });

            await consumer.disconnect();
        }catch(error){
            console.error(`Error while consuming from kafka: ${error}`);
        }
*/
    });

    it("two occupancies overlap, 400 error!", async () => {
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
            await axios.post(`${common.OCCUPANCY_DOMAIN_URL}/occupancy`, postOccupancyRequest, REQUEST_CONFIG);
        }catch(error){
            expect.assertions(2);
            expect(error.response.status).toEqual(400);
            expect(error.response.data.error).toEqual("target startTime and endTime overlaps existing");
        }
    });
});