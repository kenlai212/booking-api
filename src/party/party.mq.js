var amqp = require('amqplib/callback_api');

const amqpURL = "amqps://ngcyevpa:9wOKFMiTPHZkpjU1dseQ9R8DLHWusvMp@gerbil.rmq.cloudamqp.com/ngcyevpa"

function toEditPersonalInfoQueue(personalInfo){
    amqp.connect(amqpURL, function(error0, connection) {
        if (error0) {
            throw error0;
        }
        
        connection.createChannel(function(error1, channel) {
            if (error1) {
                throw error1;
            }
            
            var queue = "editPartyPersonalInfo";
            var msg = JSON.stringify(personalInfo);

            channel.assertQueue(queue, {
                durable: true
            });

            channel.sendToQueue(queue, Buffer.from(msg));
        });

        setTimeout(function() {
            connection.close();
            process.exit(0);
        }, 500);
    });
}

module.exports = {
    toEditPersonalInfoQueue
}