import { Request, Response, Router } from "express";
import { prisma } from "..";
const router = Router();

router.get("/timeline", async (req: Request, res: Response) => {
  return res.json(
    await prisma.timeLineEvents.findMany({
      orderBy: {
        id: "asc",
      },
    })
  );
});

export default router;
