import express, {Express, NextFunction, Request, Response} from "express";
import config from '../config.json' assert {type: "json"};

const listener = express();

interface LangInReq extends Request {
    recvTime: number;
}

listener.use('/recv', (req: LangInReq, res: Response, next: NextFunction) => {
/* 
src/server.ts:10:23 - error TS2769: No overload matches this call.
  The last overload gave the following error.
    Argument of type '(req: LangInReq, res: Response, next: NextFunction) => void' is not assignable to parameter of type 'Application<Record<string, any>>'.
      Type '(req: LangInReq, res: Response<any, Record<string, any>>, next: NextFunction) => void' is missing the following properties from type 'Application<Record<string, any>>': init, defaultConfiguration, engine, set, and 63 more.

10 listener.use('/recv', (req: LangInReq, res: Response, next: NextFunction) => {
                         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  node_modules/@types/express-serve-static-core/index.d.ts:185:5
    185     (path: PathParams, subApplication: Application): T;
            ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    The last overload is declared here.
*/
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