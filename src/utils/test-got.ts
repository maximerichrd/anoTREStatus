import got from "got";

export async function testGot(id: number) {
  await got(`https://httpstat.us/${id}`)
  .json()
  .then(res => console.log(res))
}