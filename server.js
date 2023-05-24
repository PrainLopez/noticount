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
    msg = {};
    
    if (req.body.message.chat.type == 'private') {
        msg.upd_id = req.body.update_id;
        msg.user_id = req.body.message.from.id;
        msg.user_name = req.body.message.from.username;
        msg.date = req.body.message.date;
        msg.text = req.body.message.text;
    }
    else{
        next(errGen(400, 'not private chat'));
    }
    res.send(msg);
    
    });

teleWebhook.listen(config.port, () => 
    console.log(`Listening Telegram Webhook on port ${config.port}.`)
);