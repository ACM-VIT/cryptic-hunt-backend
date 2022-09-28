import { Prisma, PrismaClient, PrismaPromise } from "@prisma/client";
import { readCsv } from "../src/controllers/verify.controllers";
import logger from "../src/services/logger.service";

const prisma = new PrismaClient();

async function main() {
  const transactions: PrismaPromise<Prisma.BatchPayload>[] = [
    prisma.timeLineEvents.deleteMany(),
    prisma.liveConfig.deleteMany(),
    prisma.whitelist.deleteMany(),
    prisma.submission.deleteMany(),
    prisma.team.deleteMany(),
    prisma.user.deleteMany(),
  ];

  const data = await readCsv();

  //   whitelist createMany, data.map
  transactions.push(
    prisma.whitelist.createMany({
      data: data.map((record) => {
        return {
          email: record.email,
        };
      }),
      skipDuplicates: true,
    })
  );
  transactions.push(
    prisma.liveConfig.createMany({
      data: [
        {
          mainText: "Event starts in ...",
          phaseText: "Are you excited?",
          time: new Date("2022-09-30T10:00:00.000Z"),
          currentPhase: -1,
        },
      ],
    })
  );
  return await prisma.$transaction(transactions);
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
