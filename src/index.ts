import {Hono} from 'hono'
import {bearerAuth} from "hono/bearer-auth";
import {prettyJSON} from "hono/pretty-json";

const bearerToken: string = process.env.BEARER_TOKEN as string;
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

app.use(prettyJSON())

// Auth
app.use('/*', bearerAuth({token: bearerToken}))

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
  return c.json(recordDto)
})

// query: ?month=YYYYMM
app.get('/v1.0/Prainy/monthRecords', async (c) => {
  const now = new Date()
  const queryMonth = c.req.query('month') ?? ""
  const queryRequest = {
    year: parseInt(queryMonth.slice(0, 4)) || now.getUTCFullYear(),
    month: parseInt(queryMonth.slice(4)) || now.getUTCMonth() + 1
  }
  
  const queryRecords = table.filter((record) => {
    const date = new Date(record.timestamp)
    return date.getUTCFullYear() == queryRequest.year && date.getUTCMonth() + 1 == queryRequest.month
  })
  
  const responseText = {
    request: queryRequest,
    records: queryRecords
  }
  return c.json(responseText)
})

export default {
  port: 3681,
  fetch: app.fetch
}
