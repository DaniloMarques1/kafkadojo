const { Kafka } = require('kafkajs');

async function execute() {
  try {
    const kafka = new Kafka({
      clientId: 'my-app',
      brokers: ['localhost:9092'],
    });

    const consumer = kafka.consumer({ groupId: 'node-group' });

    await consumer.connect();
    await consumer.subscribe({ topic: 'hello-world', fromBeginning: true });
    await consumer.run({
      eachMessage: async ({ message }) => {
        console.log(message.value.toString());
      },
    });
  } catch(e) {
    console.log(e);
  }
}

execute();
