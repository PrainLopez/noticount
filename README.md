# noticount
a node.js web microservice for automate accounting.

this was initially use for API from Telegram Bot, openAI, and Notion.so.
but all parts are modular and extendable, and easy to fork and add new API support for it as it fits ``Receive-Parse-Write`` 

To add component, go to the src folder, each file stands for a step. the receive ``server.ts`` and parse ``llmParse.ts`` step are designed in chain of duty pattern, and the writer ``recordWriter.ts`` use observer pattern for enabling multiple api writers.
add new component, change ``config.json``, and it's done.