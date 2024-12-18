import { Hono } from 'hono'
import { bearerAuth } from "hono/bearer-auth";

const token: string = process.env.BEARER_TOKEN as string;
console.log("token", token)

interface record {
  index: number;
  amount: number;
  remark?: string | null;
  timestamp: number;
}

const bunFile = Bun.file('data/prainy-account.json', { type: "application/json" })
let table: Array<record>
if (await bunFile.exists()) {
  table = await bunFile.json()
} else {
  table = new Array<record>()
}

const app = new Hono()

// '/'
app.use('/', bearerAuth({ token }))

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post('/v1.0/Prainy/account', async (c) => {
  try {
    const record: record = await c.req.json()
  } catch (err) {
    console.log(`Error while retrieving record: ${err}`)
  }


})

export default {
  port: 3681,
  fetch: app.fetch,
}
