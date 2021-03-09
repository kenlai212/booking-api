const utility = require("../common/utility");
const {logger, customError} = utility;

const customerService = require("../customer/customer.service");

async function findCustomer(input, user){
    try{
        return await customerService.findCustomer(input, user);
    }catch(error){
        console.log(error);
        logger.error("Error while calling customerService.findCustomer() : ", error);
        throw error;
    }
}

async function newCustomer(input, user){
    try{
        return await customerService.newCustomer(input, user);
    }catch(error){
        console.log(error);
        logger.error("Error while calling customerService.newCustomer() : ", error);
        throw error;
    }
}

module.exports = {
    findCustomer,
    newCustomer
}