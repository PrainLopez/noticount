import express, {Express, NextFunction, Request, Response} from "express";
import config from '../config.json' assert {type: "json"};

interface AbstractAccountingSession {
  naturalLanguageText: string | undefined;
  inTime: number | undefined;

  process(): Promise<AbstractAccountingSession>;
}

const listener = express();

listener.use(express.json());

listener.use('/recv', (req: Request, res: Response, next: NextFunction) => {
  const recvTime = Date.now();

  if (config.telegramBotListener.enable == true 
    || config.telegramBotListener.botToken == req.get('X-Telegram-Bot-Api-Secret-Token')) {
      
      class RecvTelegramBotSession implements AbstractAccountingSession {
        naturalLanguageText: string | undefined;
        inTime: number | undefined;

        constructor(req: Request, recvTime: number) {
          this.naturalLanguageText = req.body.message.text;
          this.inTime = recvTime;
        }

        async process(): Promise<AbstractAccountingSession> {
          return new Promise((resolve, reject) => {
            try {
              resolve(this);
            } catch (error) {
              reject(error);
            }
          });
        }
      }

      const session = new RecvTelegramBotSession(req, recvTime);
      session.process()
        .then((session) => {
          // TODO: Next process
        })
        .catch((error) => {
          // TODO: Handle error
        });
    }

  next();
});

listener.listen(config.port, () => {
  console.log(`[INFO] Listening on port ${config.port}`);
});