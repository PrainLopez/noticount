import express, {Express, NextFunction, Request, Response} from "express";
import config from '../config.json' assert {type: "json"};

const listener = express();

interface LangInReq extends Request {
    recvTime: number;
}

listener.use('/recv', (req: LangInReq, res: Response, next: NextFunction) => {
    req.recvTime = Date.now();
    
    let token = req.get('x-telegram-bot-api-secret-token');
    if(token !== config.telegram.botToken) {
        console.log(`[WARN] Unauthorized request from ${req.ip} with token ${token}`);
        return;
    }

    next();
})

listener.use(express.json());

listener.use('/recv', (req: LangInReq) => {
    
})