import {Hono} from 'hono'
import {bearerAuth} from "hono/bearer-auth";

const token: string = process.env.BEARER_TOKEN as string;
// console.log("token", token)

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
  if (amount < 0) {
    throw new Error('Amount must be greater than 0');
  }
  return {
    index: table.length + 1, // TODO: Is this safe?
    amount: Math.ceil(amount * 100) / 100,
    remark,
    timestamp: Date.now()
  }
}

const bunFile = Bun.file('data_storage/prainy-account.json', { type: "application/json" })
let table: RecordDto[]
if (await bunFile.exists()) {
  table = await bunFile.json() // this won't check redundant attributes, which will stripped by adapter.
  // console.log(table)
} else {
  table = []
  await Bun.write(bunFile, JSON.stringify(table))
}

const app = new Hono()

// '/'
app.use('/*', bearerAuth({ token }))

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post('/v1.0/Prainy/accounting', async (c) => {
  let recordVo: RecordVo
  let recordDto: RecordDto
  try {
    recordVo = await c.req.json()
    // console.log(recordVo)
    recordDto = dtoAdapter(recordVo)
  } catch (err) {
    console.log(`Error while retrieving record.\n ${err}`)
    return c.text('Invalid record!', 400)
  }

  table.push(recordDto)
  await Bun.write(bunFile, JSON.stringify(table))

  // console.log(table)
  return c.text(JSON.stringify(recordDto), 200)
})

app.get('/v1.0/Prainy/monthlySum', async (c) => {
  // TODO：query month = YYYYMM, default to current month.
})

export default {
  port: 3681,
  fetch: app.fetch
}
