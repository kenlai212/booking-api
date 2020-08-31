const { createLogger, format, transports } = require("winston");

const env = process.env.NODE_ENV || "development";

const logger = createLogger({
    // change level if in dev environment versus production
    level: env === "development" ? "debug" : "info",
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(
            info => `${info.timestamp} ${info.level} : ${info.message}`
        )
    ),
    transports: [
        new transports.Console({
            level: 'info',
            format: format.combine(
                format.colorize(),
                format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
            )
        })
    ]
});

module.exports = {
    logger
}