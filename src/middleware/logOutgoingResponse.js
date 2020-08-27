const winston = require("winston");

module.exports = function (res) {
    const defaultWrite = res.write;
    const defaultEnd = res.end;
    const chunks = [];

    res.write = (...restArgs) => {
        chunks.push(new Buffer(restArgs[0]));
        defaultWrite.apply(res, restArgs);
    };

    res.end = (...restArgs) => {
        if (restArgs[0]) {
            chunks.push(new Buffer(restArgs[0]));
        }
        const body = Buffer.concat(chunks).toString('utf8');

        winston.info("Response : " + body);

        defaultEnd.apply(res, restArgs);
    };

    return res;
}