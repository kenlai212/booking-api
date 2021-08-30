"use strict";
const lipslideCommon = require("lipslide-common");
const {logger, customError} = lipslideCommon;

const {Boat} = require("./boat.model");

async function save(boat){
    try{
        boat = await boat.save();
    }catch(error){
        logger.error("boat.save error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save boat Error" };
    }

    return boat;
}

async function find(boatId){
    let boat;
    try{
        boat = await Boat.findOne({boatId: boatId});
    }catch(error){
        logger.error("boat.findOne error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find boat Error" };
    }

    if(!boat)
        throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid customerId" };

    return boat;
}

async function del(boatId){
    try{
        await Boat.findOneAndDelete({boatId: boatId});
    }catch(error){
        logger.error("boat.findOneAndDelete error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete boat Error" };
    }

    return;
}

async function deleteAll(){
    try{
        await Boat.deleteMany();
    }catch(error){
        logger.error("boat.deleteMany error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete boat Error" };
    }

    return;
}

module.exports = {
	save,
    find,
    del,
    deleteAll
}