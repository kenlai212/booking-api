const logger = require("../common/logger").logger;

const userService = require("../user/user.service");
const bookingAPIUser = require("../common/bookingAPIUser");

async function getUser(userId) {
    try {
        return await userService.findUser({ "userId": userId }, bookingAPIUser.userObject);
    } catch (err) {
        logger.error("userService.findUser() error", err);
        throw err
    }
}

async function getSocialUser(provider, providerUserId) {
    try {
        return await userService.findSocialUser({provider: provider, providerUserId, providerUserId}, bookingAPIUser.userObject);
    } catch (err) {
        logger.error("userService.findSocialUser() error", err);
        throw err
    }
}

module.exports = {
    getUser,
    getSocialUser
}