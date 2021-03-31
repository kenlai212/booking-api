"use strict";
const mongoose = require('mongoose');

const utility = require("../../../src/common/utility");
const dbHandler = require('../db-handler');

const personDomain = require("../../../src/person/person.domain");
const personRead = require("../../../src/person/person.read");

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

let user = {};

describe("Test person.domain.createPerson",() => {
    it("successfully create person A & B", async () => {
        //mock publish event
        utility.publishEvent = jest.fn().mockImplementation(() => { return true; });

        const inputA = { name: "A" }
        const createResultA = await personDomain.createPerson(inputA, user);
        expect(createResultA.status).toEqual("SUCCESS");
        expect(createResultA.message).toEqual(`Published event to newPerson queue`);
        expect(createResultA.eventMsg._id).toBeTruthy();
        expect(createResultA.eventMsg.creationTime).toBeTruthy();
        expect(createResultA.eventMsg.lastUpdateTime).toBeTruthy();
        expect(createResultA.eventMsg.name).toEqual("A");

        const inputB = { name: "B" }
        const createResultB = await personDomain.createPerson(inputB, user);
        
        const readResultA = await personRead.readPerson({personId: createResultA.eventMsg._id.toString()});
        expect(readResultA.id).toEqual(createResultA.eventMsg._id.toString());
        expect(readResultA.creationTime).toBeTruthy();
        expect(readResultA.lastUpdateTime).toBeTruthy();
        expect(readResultA.name).toEqual("A");

        const readResultB = await personRead.readPerson({personId: createResultB.eventMsg._id.toString()});
        expect(readResultB.id).toEqual(createResultB.eventMsg._id.toString());
        expect(readResultB.creationTime).toBeTruthy();
        expect(readResultB.lastUpdateTime).toBeTruthy();
        expect(readResultB.name).toEqual("B");

        return;
    });
})

describe("Test person.domain.deletePerson", () => {
    it("sucessfully create person A & B, sucessfully delete person B", async () => {
        //mock publish event
        utility.publishEvent = jest.fn().mockImplementation(() => { return true; });

        const inputA = { name: "A" }
        const createResult = await personDomain.createPerson(inputA, user);

        const inputB = { name: "B" }
        await personDomain.createPerson(inputB, user);

        //assert 2 persons had been created
        let searchResult = await personRead.readPersons();
        expect(searchResult.count).toEqual(2);

        await personDomain.deletePerson({personId: createResult.eventMsg._id.toString()});

        //assert only 1 person left
        searchResult = await personRead.readPersons();
        expect(searchResult.count).toEqual(1);
    });
});