import { Hono } from 'hono'
import { bearerAuth } from "hono/bearer-auth";

const token: string = process.env.BEARER_TOKEN as string;
console.log("token", token) // TODO: comment this

// Notion: Is this DTO?
interface Record {
  index: number;
  amount: number;
  remark?: string | null;
  timestamp: number;
}

const bunFile = Bun.file('data_storage/prainy-account.json', { type: "application/json" })
let table: Record[]
if (await bunFile.exists()) {
  table = await bunFile.json()
  console.log(table)
} else {
  table = []
  await Bun.write(bunFile, JSON.stringify(table))
}

const app = new Hono()

// '/'
app.use('/', bearerAuth({ token }))

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// TODO: Server-gen index
// TODO: Server-gen timestamp
app.post('/v1.0/Prainy/accounting', async (c) => {
  let record: Record
  try {
    record = await c.req.json()
  } catch (err) {
    console.log(`Error while retrieving record.\n ${err}`)
    return c.text('unmatched record format!', 400)
  }

  table.push(record)
  await Bun.write(bunFile, JSON.stringify(table))

  console.log(table)
  return c.text('OK', 200)
})

export default {
  port: 3681,
  fetch: app.fetch
}
