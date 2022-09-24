import { PrismaClient } from "@prisma/client";
import { readCsv } from "../src/controllers/verify.controllers";
import logger from "../src/services/logger.service";

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
    logger.info("DB seeding done.");
    logger.info(data);
    process.exit(0);
  })
  .catch((e) => {
    logger.error(e);
    process.exit(1);
  });
