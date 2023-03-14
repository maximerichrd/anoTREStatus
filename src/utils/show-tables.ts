import { Knex } from 'knex'

export async function showTables(connection: Knex) {
  await connection.raw("SHOW TABLES").then(res => console.log(res))
}