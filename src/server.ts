import express, {Express, NextFunction, Request, Response} from "express";
import config from '../config.json' assert {type: "json"};

interface AbstractAccountingSession {
  naturalLanguageText: string;
  inTime: number;
}

const listener = express();

listener.use(express.json());

listener.use('/recv', (req: Request, res: Response, next: NextFunction) => {
  if (config.telegramBotListener.enable == true 
    || config.telegramBotListener.botToken == req.headers['x-telegram-bot-token']) {

      
    }

  next();
});

listener.listen(config.port, () => {
  console.log(`[INFO] Listening on port ${config.port}`);
});