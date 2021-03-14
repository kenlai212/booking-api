const config = require("config");

function validateAssetId(assetId){
    if(assetId != "MC_NXT20")
    throw { name: customError.BAD_REQUEST_ERROR, message: "Invalid assetId" };
}

module.exports = {
    validateAssetId
}