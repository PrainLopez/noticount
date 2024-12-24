import {Hono} from 'hono'
import {bearerAuth} from "hono/bearer-auth";

const token: string = process.env.BEARER_TOKEN as string;
console.log("token", token) // TODO: comment this

// VO
interface RecordVo {
  amount: number;
  remark?: string | null;
}

// DTO
interface RecordDto {
  index: number;
  amount: number;
  remark?: string | null;
  timestamp: number;
}

function dtoAdapter(vo: RecordVo): RecordDto {
  const { amount, remark } = vo
  return {
    index: table.length + 1,
    amount,
    remark,
    timestamp: Date.now()
  }
}

const bunFile = Bun.file('data_storage/prainy-account.json', { type: "application/json" })
let table: RecordDto[]
if (await bunFile.exists()) {
  table = await bunFile.json() // this won't check redundant attributes, which will stripped by adapter.
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
  let recordVo: RecordVo
  try {
    recordVo = await c.req.json()
    console.log(recordVo)
  } catch (err) {
    console.log(`Error while retrieving record.\n ${err}`)
    return c.text('unmatched record format!', 400)
  }

  const recordDto = dtoAdapter(recordVo)
  table.push(recordDto)
  await Bun.write(bunFile, JSON.stringify(table))

  console.log(table)
  return c.text('OK', 200)
})

export default {
  port: 3681,
  fetch: app.fetch
}
