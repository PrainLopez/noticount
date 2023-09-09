import express, {Express, NextFunction, Request, Response} from "express";
import config from '../config.json' assert {type: "json"};

const listener = express();

listener.use('/recv', (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    req.local.recvTime = Date.now();
    
    let token = req.get('x-telegram-bot-api-secret-token');
    if(token !== config.telegramBotListener.botToken) {
        console.log(`[WARN] Unauthorized request from ${req.ip} with token ${token}`);
        return;
    }

    next();
});

listener.use(express.json());

listener.use('/recv', (req, res, next) => {
    
});

listener.listen(config.port, () => {
  console.log(`[INFO] Listening on port ${config.port}`);
});