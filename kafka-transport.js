const Transport = require('winston').Transport,
  kafka = require('kafka-node'),
  kafkaLogging = require('kafka-node/logging'),
  _ = require('underscore');

class KafkaTransport extends Transport {
  constructor(options) {
    super(options);

    this.level = options.level || 'info';
    this.meta = options.meta || {};

    // Connection string, default localhost:2181/kafka0.8
    this.connectionString = options.connectionString || 'localhost:2181';
    this.topic = options.topic;

    // Connect
    this.client = new kafka.KafkaClient({ kafkaHost: this.connectionString });
    this.producer = new kafka.Producer(this.client);

    this.producer.on('ready', function () {
      this.isConnected = true;
      console.log('Connected to kafka server');
    }.bind(this));

    this.producer.on('error', function (err) {
      this.isConnected = false;
      var msg = 'Cannot connect to kafka server';
      console.error(msg, err);
    }.bind(this));
  }

  log(level, message, meta, callback) {
    if (this.isConnected) {

      var payload = this.formatter({
        message: message,
        level: level,
        meta: _.defaults(meta, this.meta),
        timestamp: new Date()
      });

      var payloads = [
        { topic: this.topic, messages: [payload] }
      ];

      try {
        console.log('sending log to kafka', payloads);
        this.producer.send(payloads, function (err, result) {
          if (err) {
            console.error('Failed to send log to kafka', err);
          }
        });
      } catch (err) {
        console.error('Failed to send log to kafka', err);
      }
    }

    callback(null, true);
  }
};

const consoleLoggerProvider = function (name) {
  return {
    debug: console.info.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console)
  };
}

// optional - uncomment to enable debug chatter for node-kafka
// kafkaLogging.setLoggerProvider(consoleLoggerProvider);

module.exports = KafkaTransport;
