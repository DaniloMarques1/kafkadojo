const { Kafka } = require('kafkajs');

async function execute() {
  const consumer = await connectConsumer();
  await consumePayments(consumer, produceReport);
}

async function connectConsumer() {
  const kafka = new Kafka({
    clientId: 'report-consumer',
    brokers: ['localhost:9092'],
  });

  const consumer = kafka.consumer({groupId: 'payment-report'});
  await consumer.connect();
  await consumer.subscribe({topic: 'payment-transaction', fromBeginning: true});

  return consumer;
}

async function consumePayments(consumer, cb) {
  consumer.run({
    eachMessage: async ({_topic, _partition, message}) => {
      await cb(JSON.parse(message.value.toString()));
    },
  });
}

async function produceReport(json) {
  console.log('Mensagem recebida... Emitindo nota fiscal');
  console.log(json);
}

execute();
