"use strict";
const axios = require("axios");

const {DOMAIN_URL, REQUEST_CONFIG} = require("../common");

async function setupPersonAndRegisterUser(){
    //add new person
    const postPersonData = {
        name: "tester1"
    }

    let postPersonResponse;
    try{
        postPersonResponse = await axios.post(`${DOMAIN_URL}/person`, postPersonData, REQUEST_CONFIG);
    }catch(error){
        console.error(error);
    }

    //add new user
    const postUserData = {
        personId: postPersonResponse.data.personId,
        loginId: "A",
        password: "B"
    }

    let postUserResponse;
    try{
        postUserResponse = await axios.post(`${DOMAIN_URL}/user`, postUserData, REQUEST_CONFIG);
    }catch(error){
        console.error(error);
    }

    return postUserResponse.data;
}

module.exports = {
	setupPersonAndRegisterUser
}