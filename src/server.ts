import express, {Express, Request, Response} from "express";

const app: Express = express();

interface LangInReq extends Request {
    recvTime: number;
}

app.use('/recv', (req: LangInReq) => {
    req.recvTime = Date.now();
})

app.use(express.json());

app.use('/recv', (req: Request, res: Response) => {
    let recvTime: number = Date.now();

})