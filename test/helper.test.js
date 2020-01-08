const chai = require("chai");
const assert = chai.assert;
const sinon = require("sinon");

const helper = require("../src/helper");

describe("Test helper", function(){
	describe("test expandStartSearchRange()", function(){
		it("test null startTime, expect error throw", function(){
			try{
				helper.expandStartSearchRange(null);
			}catch(err){
				assert.equal(err.msg,"startTime is mandatory");
			}
		});
	});
});