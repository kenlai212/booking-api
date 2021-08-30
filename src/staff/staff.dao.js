"use strict";
const lipslideCommon = require("lipslide-common");
const {logger, customError} = lipslideCommon;

const {Staff} = require("./staff.model");

async function save(staff){
    try{
        staff = await staff.save();
    }catch(error){
        logger.error("staff.save error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Save staff Error" };
    }

    return staff;
}

async function find(staffId){
    let staff;
    try{
        staff = await Staff.findOne({staffId: staffId});
    }catch(error){
        logger.error("staff.findOne error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Find staff Error" };
    }

    if(!staff)
        throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid staffId" };

    return staff;
}

async function del(staffId){
    try{
        await Staff.findOneAndDelete({staffId: staffId});
    }catch(error){
        logger.error("staff.findOneAndDelete error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete staff Error" };
    }

    return;
}

async function deleteAll(){
    try{
        await Staff.deleteMany();
    }catch(error){
        logger.error("staff.deleteMany error : ", error);
        throw { name: customError.INTERNAL_SERVER_ERROR, message: "Delete staff Error" };
    }

    return;
}

module.exports = {
	save,
    find,
    del,
    deleteAll
}