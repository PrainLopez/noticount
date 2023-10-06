# noticount
a node.js web microservice for automate accounting.

this was initially use for API from Telegram Bot, openAI, and Notion.so.
but all parts are modular and extendable, and easy to fork and add new API support for it as it fits ``Receive-Parse-Write`` chain.

to add components to any step on the chain, go to the src folder, each file stands for a step. the receive and parse step are designed in chain of duty pattern, and the writer use observer pattern for enabling multiple api writers.
add new component, change ``config.json``, and it's added.