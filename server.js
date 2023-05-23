// 这里更像一个主程序而非功能模块
const express = require('express');
const winston = require('winston');
const config = require('../config');

const teleWebhook = express();

// Quck access to return error
function errGen(status, msg){
    let err = new Error(msg);
    err.status = status;
    return err;
}

// Authenticate secrest token
teleWebhook.use('/', function(req, res, next) {
    console.log('Authenticating...')
    //check secretToken
    let token = req.get('x-telegram-bot-api-secret-token');
    //key empty
    if (!token) return next(errGen(400, 'token required'));
    //key invalid
    if (token != config.secretToken) return next(errGen(401, 'invalid token'))

    next();
})

// parse JSON
teleWebhook.use(express.json())

// Receive message from Telegram
teleWebhook.use('/', function (req, res) {
    console.log(req.body); // for test
    res.send(req.body); // for test, no need to response anything.
    });

teleWebhook.listen(config.port, () => 
    console.log(`Listening Telegram Webhook on port ${config.port}.`)
);