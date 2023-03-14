import { Knex, knex } from 'knex'
import { exit } from "./utils/exit"
import { showTables } from './utils/show-tables';
import { v4 as uuidv4 } from "uuid"
import got from "got";
/*
const connection: Knex = knex({
  client: "mysql",
  version: '5.7',
  connection: {
    host : '127.0.0.1',
    user : 'user',
    password : 'password',
    database : 'node-boots-db',
    port: 6606
  }
})
*/

const msaBaseUrl = 'https://msa-alb.rct.cloudh.io/mystockapp/v1'
const storeId = '200'
const receivingStoreId = '100'
const products = [{
		"sku": "V21239",
		"quantity": 1
	}]
const date = "2023-03-14"
const operationId = uuidv4()


const body1 = {
  products,
	"trackingReference": null,
	"receivingStockroomId": null,
	"date": date,
	"storeId": storeId,
	"receivingStoreId": receivingStoreId,
	"comment": null,
	operationId,
	"stockroomId": storeId
}

const body2 = {
	"stockroomId": storeId,
  products,
	storeId,
	date
}

type ResponseTransfer = {
  documentNumber: number
  internalReference: string
}

// response
// { documentNumber: 163068, internalReference: 'REF20230314802138655' }

async function run(connection: Knex | undefined) {

  const res: ResponseTransfer = await createTransfer()
  console.log(res.documentNumber)

  setTimeout({

  }, 10)


  exit()
}

run(undefined)

async function createTransfer(): Promise<ResponseTransfer> {
    return got.post(msaBaseUrl + '/transfer', { 
    json: body1,
    headers: { Authorization: 'Bearer ' +  'h.eyJpZGVudGl0aWVzIjpbeyJ1c2VySWQiOiAiY19mYWJ0dG8ifV19Cg==.s' }
  })
  .json()
  .then(res => res as any)
  .catch(e => console.log(e))
}
https://itg.geoapi.hermes.com/mystockapp/v1/receptiondocument/TRV-163066/receive
async function receiveTransfer(trvNumber: number): any {
    return got.post(msaBaseUrl + `receptiondocument/TRV-${trvNumber}/receive`, { 
    json: body2.add,
    headers: { Authorization: 'Bearer ' +  'h.eyJpZGVudGl0aWVzIjpbeyJ1c2VySWQiOiAiY19mYWJ0dG8ifV19Cg==.s' }
  })
  .json()
  .then(res => res as any)
  .catch(e => console.log(e))
}

