const userService = require("../user/user.service");

function getUser() {
    userService.findUser(input)
}

module.exports = {
    getUser
}