module.exports = function(userGroups, allowGroups) {

    if (userGroups == null) {
        userGroups = [];
    }

    const targetGroup = userGroups.filter(value => allowGroups.includes(value));

    if (targetGroup.length == 0) {
        return false;
    } else {
        return true;
    }
}