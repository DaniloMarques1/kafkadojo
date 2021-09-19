const { Kafka } = require('kafkajs');
const express = require('express');
const app = express();

app.use(express.json());

app.post('/payment', async (req, res) => {
  try {
    const body = req.body;
    console.log(body);
    // do some stuff
    await produceMessage(body);
  } catch(e) {
    console.log(e);
  }

  return res.status(204).json();
});

async function produceMessage(body) {
  const producer = await connectProducer();
  await producer.send({
    topic: 'payment-transaction',
    messages: [
      { value: JSON.stringify(body) }
    ]
  });

  await producer.disconnect();
}

async function connectProducer() {
  const kafka = new Kafka({
    clientId: 'payment-producer',
    brokers: ['localhost:9092'],
  });

  const producer = await kafka.producer();
  await producer.connect();

  return producer;
}

console.log('Starting server...');
app.listen(3000);
