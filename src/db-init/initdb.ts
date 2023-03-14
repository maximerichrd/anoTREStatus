/* import Knex from "knex"
import {insertCustomers, insertStores} from "./generateData"

const knex: Knex = Knex({
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


run(knex)

async function run(knex: Knex) {
  const c = await insertCustomers(knex)
  const s = await insertStores(knex)
  console.log("customers and stores are now inserted")
  return
} */