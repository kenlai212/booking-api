const chai = require("chai");
const assert = chai.assert;
const sinon = require("sinon");

const occupancyService = require("../src/occupancy.service");
const occupancyModel = require("../src/occupancy.model");
const helper = require("../src/helper");

describe("Test user.service", function(){
	
	var searchOccupancyByTimeStub;
    
	before(function(){
		searchOccupancyByTimeStub = sinon.stub(occupancyModel, "searchOccupancyByTime");
	});
	
	after(function () {
		occupancyModel.searchOccupancyByTime.restore();
	});
	
	describe("test checkAvailability()", function(){
		it("test null startTime, expect 400 error", async function(){
			const input = new Object();
			
			try{
				await occupancyService.checkAvailability(input);
			}catch(err){
				assert.equal(err.message,"startTime is mandatory");
				assert.equal(err.status, 400);
			}
		});

		it("test null startTime, expect 400 error", async function(){
			const input = new Object();
			input.startTime = "2020-01-05T15:00:00+0800";
			
			try{
				await occupancyService.checkAvailability(input);
			}catch(err){
				assert.equal(err.message,"endTime is mandatory");
				assert.equal(err.status, 400);
			}
		});

		it("test endTime befor startTime, expect 400 error", async function(){
			const input = new Object();
			input.startTime = "2020-01-05T15:00:00+0800";
			input.endTime = "2020-01-05T14:00:00+0800";
			
			try{
				await occupancyService.checkAvailability(input);
			}catch(err){
				assert.equal(err.message,"Invalid endTime");
				assert.equal(err.status, 400);
			}
		});

		it("test startTime overlap, expect false", async function(){
			const input = new Object();
			input.startTime = "2020-01-07 10:00:00";
			input.endTime = "2020-01-07 10:59:59";
			
			const occupancies = [
				{
					startTime : new Date("2020-01-07 09:00:00"),
					endTime: new Date("2020-01-07 10:59:59")
				}
			]
			searchOccupancyByTimeStub.returns(occupancies);

			const isAvailable = await occupancyService.checkAvailability(input);
			assert.isFalse(isAvailable);
		});
		
		it("test endTime overlap, expect false", async function(){
			const input = new Object();
			input.startTime = "2020-01-07 08:00:00";
			input.endTime = "2020-01-07 10:00:00";
			
			const occupancies = [
				{
					startTime : new Date("2020-01-07 09:00:00"),
					endTime: new Date("2020-01-07 10:59:59")
				}
			]
			searchOccupancyByTimeStub.returns(occupancies);

			const isAvailable = await occupancyService.checkAvailability(input);
			assert.isFalse(isAvailable);
		});
		
		it("both startTime and endTime are beyond and after occupancy, expect false", async function(){
			const input = new Object();
			input.startTime = "2020-01-07 08:00:00";
			input.endTime = "2020-01-07 11:00:00";
			
			const occupancies = [
				{
					startTime : new Date("2020-01-07 09:00:00"),
					endTime: new Date("2020-01-07 10:59:59")
				}
			]
			searchOccupancyByTimeStub.returns(occupancies);

			const isAvailable = await occupancyService.checkAvailability(input);
			assert.isFalse(isAvailable);
		});
		
		it("no conflict, expect true", async function(){
			const input = new Object();
			input.startTime = "2020-01-07 11:00:00";
			input.endTime = "2020-01-07 11:59:59";
			
			const occupancies = [
				{
					startTime : new Date("2020-01-07 09:00:00"),
					endTime: new Date("2020-01-07 10:59:59")
				}
			]
			searchOccupancyByTimeStub.returns(occupancies);

			const isAvailable = await occupancyService.checkAvailability(input);
			assert.isTrue(isAvailable);
		});
		
		it("test startTime overlap on second occupancy, expect false", async function(){
			const input = new Object();
			input.startTime = "2020-01-07 05:00:00";
			input.endTime = "2020-01-07 06:59:59";
			
			const occupancies = [
				{
					startTime : new Date("2020-01-07 03:00:00"),
					endTime: new Date("2020-01-07 03:59:59")
				},
				{
					startTime : new Date("2020-01-07 04:00:00"),
					endTime: new Date("2020-01-07 05:59:59")
				}
			]
			searchOccupancyByTimeStub.returns(occupancies);

			const isAvailable = await occupancyService.checkAvailability(input);
			assert.isFalse(isAvailable);
		});
		
		it("test endTime overlap on second occupancy, expect false", async function(){
			const input = new Object();
			input.startTime = "2020-01-07 04:00:00";
			input.endTime = "2020-01-07 05:59:59";
			
			const occupancies = [
				{
					startTime : new Date("2020-01-07 03:00:00"),
					endTime: new Date("2020-01-07 03:59:59")
				},
				{
					startTime : new Date("2020-01-07 05:00:00"),
					endTime: new Date("2020-01-07 06:59:59")
				}
			]
			searchOccupancyByTimeStub.returns(occupancies);

			const isAvailable = await occupancyService.checkAvailability(input);
			assert.isFalse(isAvailable);
		});
	});
}); 
