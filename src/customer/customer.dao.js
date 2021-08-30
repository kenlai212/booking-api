"use strict";
const lipslideCommon = require("lipslide-common");
const {logger, customError} = lipslideCommon;

const {Customer} = require("./customer.model");

async function save(customer){
    try{
        customer = await customer.save();
    }catch(error){
        logger.error("customer.save error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save Customer Error" };
    }

    return customer;
}

async function find(customerId){
    let customer;
    try{
        customer = await Customer.findOne({customerId: customerId});
    }catch(error){
        logger.error("Customer.findOne error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find Customer Error" };
    }

    if(!customer)
        throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid customerId" };

    return customer;
}

async function del(customerId){
    try{
        await Customer.findOneAndDelete({customerId: customerId});
    }catch(error){
        logger.error("Customer.findOneAndDelete error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Customer Error" };
    }

    return;
}

async function deleteAll(){
    try{
        await Customer.deleteMany();
    }catch(error){
        logger.error("Customer.deleteMany error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete Customer Error" };
    }

    return;
}

module.exports = {
	save,
    find,
    del,
    deleteAll
}