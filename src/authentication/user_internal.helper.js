const userService = require("../user/admin.service");
const bookingAPIUser = require("../common/bookingAPIUser");

async function getUser(userId) {
    const sysUser = bookingAPIUser.userObject;

    try {
        return await userService.findUser({ "userId": userId }, sysUser);
    } catch (err) {
        logger.error("userService.findUser() error", err);
        throw err
    }
}

module.exports = {
    getUser
}