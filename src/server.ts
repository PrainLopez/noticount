import express, { Express, NextFunction, Request, Response } from "express";
import { parser } from "./llmParse.js";
import { InterfaceAccountingSession } from "../types/interfaces.js";

import config from "../config.json" assert { type: "json" };
import { writer } from "./recordWriter.js";
import TelegramBot from "node-telegram-bot-api";

if (config.listener.telegramBotListener.enable === true) {
  const bot = new TelegramBot(config.listener.telegramBotListener.botToken, { polling: false });
  bot.setWebHook(config.listener.telegramBotListener.webhookUrl);
  console.log(`[INFO] Telegram Bot Webhook set to ${config.listener.telegramBotListener.webhookUrl}`);
}

const listener = express();

listener.use(express.json());

// Telegram Bot Webhook Listener
listener.use("/recv", async (req: Request, res: Response, next: NextFunction) => {
  const recvTime = Date.now();

  if (
    config.listener.telegramBotListener.enable == true &&
    config.listener.telegramBotListener.botToken ==
    req.get("X-Telegram-Bot-Api-Secret-Token")
  ) {

    console.log(`[INFO] Received validated message from Telegram Bot`);

    class RecvTelegramBotSession implements InterfaceAccountingSession {
      naturalLanguageText: string | null;
      inTime: number | null;
      recordEvent = null;
      recordAmount = null;

      constructor(req: Request, recvTime: number) {
        this.naturalLanguageText = req.body.message.text;
        this.inTime = recvTime;
      }

      async process(): Promise<InterfaceAccountingSession> {
        return this;
      }
    }

    if (req.body.message.text === undefined) {
      console.log(`[ERROR] message from Telegram Bot is invalid.`);
      res.status(400).send("400 Bad Request");
    }
    else {
      res.status(200).send("200 OK");

      const session = new RecvTelegramBotSession(req, recvTime);
      try {
        await session.process();
        await parser(session);
        writer(session);
      }
      catch (error) {
        console.log(error);
      }
    }

  } else {
    next();
  }
});

// Telegram Bot getUpdate
if (config.listener.telegramBotUpdater.enable === true) {
  setInterval(async () => {
    
  }, config.listener.telegramBotUpdater.interval)
}

// final handler, 404
listener.use((req: Request, res: Response) => {
  res.status(404).send("404 Not Found");
  console.log(`[ERROR] Received unhandled message from ${req.ip}`);
});

listener.listen(config.port, () => {
  console.log(`[INFO] Listening on port ${config.port}`);
});
