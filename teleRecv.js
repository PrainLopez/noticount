const express = require('express');
const port = 16913;
const secretToken = "Prainy_here";

const teleWebhook = express();

teleWebhook.get('/', (req, res) => {  // res need to be removed.
    console.log(req.body);
});

teleWebhook.listen(port, () => {
    console.log('Listening Telegram Webhook on port ${port}.');
});