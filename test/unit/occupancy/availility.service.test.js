const moment = require('moment');

const availibilityService = require("../../../src/occupancy/availibility.service");
const Occupancy = require("../../../src/occupancy/occupancy.model").Occupancy;

describe('Test availibility.service', () => {
    describe("testing checckAvailibility()", function () {

        var startTime = moment("2020-02-02T11:00:00Z");
        var endTime = moment("2020-02-02T12:00:00Z");

        test("No occupancies overlapped, expect return true", async () => {    

            //mock Occupancy.find to return no occupancies
            Occupancy.find = function () {
                return Promise.resolve([]);
            }

            await expect(availibilityService.checkAvailibility(startTime, endTime, "ASSET_123")).resolves.toEqual(true);
            
        });
        
        test("One occupancy in between startTime and endTime, expect return false", async () => {

            //mock Occupancy.find to return no occupancies
            Occupancy.find = function () {
                return Promise.resolve([{
                    startTime: moment("2020-02-02T11:00:00Z"),
                    endTime: moment("2020-02-02T11:05:00Z")
                }]);
            }

            await expect(availibilityService.checkAvailibility(startTime, endTime, "ASSET_123")).resolves.toEqual(false);
        });
        
        test("One occupancy in between overlap the startTime, expect return false", async () => {

            //mock Occupancy.find to return no occupancies
            Occupancy.find = function () {
                return Promise.resolve([{
                    startTime: moment("2020-02-02T10:00:00Z"),
                    endTime: moment("2020-02-02T11:05:00Z")
                }]);
            }

            await expect(availibilityService.checkAvailibility(startTime, endTime, "ASSET_123")).resolves.toEqual(false);
        });

        test("One occupancy in between overlap endTime, expect return false", async () => {

            //mock Occupancy.find to return no occupancies
            Occupancy.find = function () {
                return Promise.resolve([{
                    startTime: moment("2020-02-02T11:30:00Z"),
                    endTime: moment("2020-02-02T12:30:00Z")
                }]);
            }

            await expect(availibilityService.checkAvailibility(startTime, endTime, "ASSET_123")).resolves.toEqual(false);
        });

        test("One occupancy outside of startTime and endTime, expect return true", async () => {

            //mock Occupancy.find to return no occupancies
            Occupancy.find = function () {
                return Promise.resolve([{
                    startTime: moment("2020-02-02T08:00:00Z"),
                    endTime: moment("2020-02-02T09:00:00Z")
                }]);
            }

            await expect(availibilityService.checkAvailibility(startTime, endTime, "ASSET_123")).resolves.toEqual(true);
        });

        test("Occupancy.find() error, expect throw err", async () => {

            //mock Occupancy.find to return no occupancies
            Occupancy.find = function () {
                return Promise.reject("db error");
            }

            await expect(availibilityService.checkAvailibility(startTime, endTime, "ASSET_123")).reject;
        });
        
    });
});
