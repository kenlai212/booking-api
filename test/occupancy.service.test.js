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

		it("test multiple occupancy return", async function(){
			const input = new Object();
			input.startTime = "2020-01-05T15:00:00+0800";
			input.endTime = "2020-01-05T15:59:59+0800";
			
			const occupancies = [
				{
					startTime : "2020-01-05T07:00:00.000+00:00",
					endTime: "2020-01-05T07:59:59.000+00:00"
				}
			]
			searchOccupancyByTimeStub.returns(occupancies);

			try{
				await occupancyService.checkAvailability(input);
			}catch(err){
				assert.equal(err.message,"Invalid endTime");
				assert.equal(err.status, 400);
			}
		});
	});
}); 
