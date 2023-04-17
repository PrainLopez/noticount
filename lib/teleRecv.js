const express = require('express');
const winston = require('winston');
const config = require('../config');

const teleWebhook = express();

teleWebhook.use(express.json()) // for parsing application/json

// Receive message from Telegram
teleWebhook.get('/', (req, res) => { // res need to be removed.
    console.log(req.body); // for test
    res.send('pong!'); // for test, no need to response anything.
    const message = JSON.parse(req.body); //
});

teleWebhook.listen(config.port, () => {
    console.log(`Listening Telegram Webhook on port ${config.port}.`);
});