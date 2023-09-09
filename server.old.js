// 这里更像一个主程序而非功能模块
const express = require('express');
const config = require('./config.json');

const teleWebhook = express();

// Quck access to return error
function errGen(status, msg){
    let err = new Error(msg);
    err.status = status;
    return err;
}

// Authenticate secrest token
teleWebhook.use('/', function(req, res, next) {
    //check telegram secretToken
    let token = req.get('x-telegram-bot-api-secret-token');
    //key empty
    if (!token) return next(errGen(400, 'token required'));
    //key invalid
    if (token != config.secretToken) return next(errGen(401, 'invalid token'))
    console.log('token verified'); // TODO: 测试用，应删除

    // 需要进一步鉴权：
    next();
})

// parse JSON
teleWebhook.use(express.json())

// Receive message from Telegram
teleWebhook.use('/', function (req, res) {
    const body = req.body;
    msg = {};
    
    if (body.message.chat.type == 'private') {
        msg.upd_id = body.update_id;
        msg.user_id = body.message.from.id;
        msg.user_name = body.message.from.username;
        msg.date = body.message.date;
        msg.text = body.message.text;
    }
    else{
        next(errGen(400, 'not private chat'));
    }
    req.extracted = msg;
    res.send(msg); // TODO: 测试用，应删除
    
    });

teleWebhook.listen(config.port, () => 
    console.log(`Listening Telegram Webhook on port ${config.port}.`)
);