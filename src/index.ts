import { v4 as uuidv4 } from "uuid"
import { exit } from './utils/exit'
import { Knex, knex } from 'knex'
import got, { HTTPError } from "got";

// need a local ssh tunnel on 3306
const connection: Knex = knex({
  client: "mysql",
  version: '5.7',
  connection: {
    host: '127.0.0.1',
    user : 'mscbr',
    password : '',
    database : 'mscbr',
    port: 3306
  }
})

type TRVCreationResponse = {
  documentNumber: number
  internalReference: string
}
type TRECreationResponse = {
  documentNumber: number
}

const ITERATIONS = 15
const msaBaseUrl = 'https://msa-alb.rct.cloudh.io/mystockapp/v1'
const userTokenHeader = 'Bearer h.eyJpZGVudGl0aWVzIjpbeyJ1c2VySWQiOiAiY19mYWJ0dG8ifV19Cg==.s'
const TRECheckQuery = (ref: string) => 
  `SELECT INTERNAL_REF FROM STATUS WHERE INTERNAL_REF = '${ref}' AND TYPE = 'TRE'`

const internalRefs: string[] = []
const verifiedTREs: string[] = []

const storeId = '200'
const receivingStoreId = '100'
const products = [{
		"sku": "V21239",
		"quantity": 1
	}]
const date = "2023-03-15"
const bodyCreateTRV = {
  products,
	"trackingReference": null,
	"receivingStockroomId": null,
	"date": date,
	"storeId": storeId,
	"receivingStoreId": receivingStoreId,
	"comment": null,
	"stockroomId": storeId
}

const bodyCreateTRE = {
	"stockroomId": receivingStoreId,
  products,
	storeId: receivingStoreId,
	date
}

runAll()

async function runAll() {

  try {

    // create/receive documents
    console.log('start creating/receiving TRV/TRE')
    const iterations = []
    for (let j = 0; j < ITERATIONS; j++) {
     iterations.push(createTRVAndTRE())
    }
    await Promise.allSettled(iterations)

  } catch (e) {
    logPromiseError(e, 'runAll')
    console.log('could not check DB')
    exit()
  }

  try {

    // check STATUS table
    console.log('start DB Status TRE checks')

    const dbStatusTREChecks = internalRefs.map(async (ref) => {
      return new Promise((resolve) => {
    
      const res = connection.raw(TRECheckQuery(ref))
      return resolve(res)
    })})

    const TRECheckResults: any[] = await Promise.all(dbStatusTREChecks)

    TRECheckResults.forEach((maybeTRE) => {
     if(maybeTRE.length && maybeTRE[0].length) {
       console.log(maybeTRE[0])
       verifiedTREs.push(maybeTRE[0])
     }
    })

  } catch(e) {
    console.log('Error during DB Status TRE Checks: ', e)
  } finally {
    connection.destroy()
  }

  console.log('created TRV count : ', internalRefs.length)
  console.log('verified TRE count : ', verifiedTREs.length)

}

async function createTRVAndTRE() {

  const { documentNumber, internalReference } = await createTransfer()
  await sleep(8000);
  internalRefs.push(internalReference)
  await receiveTransfer(documentNumber)
  .then((res: TRECreationResponse) => { 
      console.log(`TRE generated. Reception ok ! `)
      console.log(`{ GP_NUMERO = ${res.documentNumber} AND GP_REFINTERNE = '${internalReference}'`)
  })

}

async function createTransfer(): Promise<TRVCreationResponse> {
    return got.post(msaBaseUrl + '/transfer', { 
    json: { ...bodyCreateTRV, operationId: uuidv4() },
    headers: { Authorization: userTokenHeader }
  })
  .json()
  .then(res => res as any)
  .catch(e => logPromiseError(e, 'createTransfer'))
}

async function receiveTransfer(trvNumber: number): Promise<TRECreationResponse> {
    return got.post(msaBaseUrl + `/receptiondocument/TRV-${trvNumber}/receive`, { 
    json: { ...bodyCreateTRE, documentId: `TRV-${trvNumber}` },
    headers: { Authorization: userTokenHeader}
  })
  .json()
  .then(res => res as any)
  .catch(e => logPromiseError(e, 'receiveTransfer'))

}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logPromiseError(e: unknown, task: string) {
  // clean Got error
  if (e instanceof HTTPError)
    console.log(`got ${task} error with message: `, e.message)
  // unknown error
  else console.log(`got ${task} error: `, e)
  throw e
}
