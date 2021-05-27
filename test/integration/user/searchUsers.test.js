const axios = require("axios");
const { not } = require("joi");
const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

beforeEach(async () => {
    await axios.delete(`${DOMAIN_URL}/people/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/user/people/shitSon`, REQUEST_CONFIG);
    await axios.delete(`${DOMAIN_URL}/users/shitSon`, REQUEST_CONFIG);
});

describe('Test searchUser api', () => {
    it('test get users api', async () => {
        //add person1
        const postPerson1Data = {
            name: "tester1"
        }

        let postPerson1Response;
        try{
            postPerson1Response = await axios.post(`${DOMAIN_URL}/person`, postPerson1Data, REQUEST_CONFIG);
        }catch(error){
            console.error(error);
        }

        //add person2
        const postPerson2Data = {
            name: "tester1"
        }

        let postPerson2Response;
        try{
            postPerson2Response = await axios.post(`${DOMAIN_URL}/person`, postPerson2Data, REQUEST_CONFIG);
        }catch(error){
            console.error(error);
        }

        //register user1
        const postUser1Data = {
            personId: postPerson1Response.data.personId,
            loginId: "A",
            password: "B"
        }

        let postUser1Response;
        try{
            postUser1Response = await axios.post(`${DOMAIN_URL}/user`, postUser1Data, REQUEST_CONFIG);
        }catch(error){
            console.error(error);
        }

        //register user2
        const postUser2Data = {
            personId: postPerson2Response.data.personId,
            loginId: "A",
            password: "B"
        }

        let postUser2Response;
        try{
            postUser2Response = await axios.post(`${DOMAIN_URL}/user`, postUser2Data, REQUEST_CONFIG);
        }catch(error){
            console.error(error);
        }

        //search users
        let getUsersResponse;
        try{
            getUsersResponse = await axios.get(`${DOMAIN_URL}/users`, REQUEST_CONFIG);
        }catch(error){
            console.error(error);
        }
        
        expect(getUsersResponse.data.count).toEqual(2);
        expect(getUsersResponse.data.users[0].userId).toEqual(postUser1Response.data.userId);
        expect(getUsersResponse.data.users[0].status).toEqual("ACTIVE");
        expect(getUsersResponse.data.users[0].registrationTime).not.toEqual(null);
        expect(getUsersResponse.data.users[1].userId).toEqual(postUser2Response.data.userId);
        expect(getUsersResponse.data.users[1].status).toEqual("ACTIVE");
        expect(getUsersResponse.data.users[1].registrationTime).not.toEqual(null);
    });
});