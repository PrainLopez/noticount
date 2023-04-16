const express = require('express');
const port = 16913;
const userId = 123456789; // Your Telegram ID

const teleWebhook = express();

teleWebhook.use(express.json()) // for parsing application/json

// Receive message from Telegram
teleWebhook.get('/', (req, res) => { // res need to be removed.
    console.log(req.body); // for test
    res.send('pong!'); // for test, no need to response anything.
    const message = JSON.parse(req.body); //
});

teleWebhook.listen(port, () => {
    console.log(`Listening Telegram Webhook on port ${port}.`);
});