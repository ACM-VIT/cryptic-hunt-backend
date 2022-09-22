import { PrismaClient } from "@prisma/client";
import { readCsv } from "../src/controllers/verify.controllers";

const prisma = new PrismaClient();

async function main() {
  const data = await readCsv();

  //   whitelist createMany, data.map
  const whitelist = await prisma.whitelist.createMany({
    data: data.map((record) => {
      return {
        email: record.email,
      };
    }),
    skipDuplicates: true,
  });

  //   create live config config if not exists
  let liveConfig = await prisma.liveConfig.findFirst({
    where: {
      id: "1",
    },
  });
  if (!liveConfig) {
    liveConfig = await prisma.liveConfig.create({
      data: {
        id: "1",
      },
    });
  }

  return {
    whitelist,
    liveConfig,
  };
}

main()
  .then((data) => {
    console.log("DB seeding done.");
    console.log(data);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
