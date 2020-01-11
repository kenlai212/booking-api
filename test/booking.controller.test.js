const chai = require("chai");
const assert = chai.assert;
const chaiHttp = require('chai-http');
const server = require('../server');

chai.use(chaiHttp);

describe("Test booking.controller", function(){
	describe("test /get /bookings", function(){
		chai.request(server)
			.get('/bookings')
			.end((err, res) => {
                  res.should.have.status(200);
                  res.body.should.be.a('array');
                  res.body.length.should.be.eql(0);
              done();
            });
	});
});