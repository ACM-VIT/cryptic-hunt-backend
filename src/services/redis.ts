// -------------------------------------- Initialize redis + config --------------------------------------
// import { promisify } from 'util'
import { RedisClientOptions, createClient } from "redis";
import { promisify } from "util";
import { env } from "../configs/redis";

const { REDIS_HOST, REDIS_PORT, REDIS_PASS } = env;
const url = `redis://${
  REDIS_PASS ? `:${REDIS_PASS}@` : ""
}${REDIS_HOST}:${REDIS_PORT}`;
const options: RedisClientOptions = { url };
if (REDIS_PASS) options.password = REDIS_PASS;
const client = createClient(options);

const getAsync = promisify(client.get).bind(client);

client.on("error", (err: any) => {
  console.log(`>>>> Redis Error: ${err}`);
});
console.log(`<<<< Connected to Redis >>>>`);

// -------------------------------------- Redis Functions --------------------------------------
function set(key: string, value: Object): Promise<boolean> {
  return Promise.resolve(!client.set(key, JSON.stringify(value)));
}

async function get(keyPattern: string): Promise<any> {
  try {
    const result = await getAsync(keyPattern);
    console.log(">>>>>>>> getAsync result: ", result);
    if (!result) return false;
    return JSON.parse(result);
  } catch (err) {
    console.log("Redis Error - Fetch Data: ", err);
    throw err;
  }
}

export default { set, get };

// export default client;
