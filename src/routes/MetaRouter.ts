import { Request, Response, Router } from "express";
import { prisma } from "..";
import { adminMiddleware } from "../middleware/admin.middleware";
const router = Router();

// GET timeline from timelineEvents table
router.get("/timeline", async (req: Request, res: Response) => {
  return res.json(
    await prisma.timeLineEvents.findMany({
      orderBy: {
        id: "asc",
      },
    })
  );
});

// GET updates from updates table
router.get("/updates", async (req: Request, res: Response) => {
  const data = await prisma.updates.findMany({
    orderBy: {
      id: "asc",
    },
  });
  return res.json(
    data.map((item) => {
      return {
        id: item.id,
        title: item.title,
        description: item.content,
        date: item.createdAt,
      };
    })
  );
});

// POST create new update
router.post(
  "/updates",
  adminMiddleware,
  async (req: Request, res: Response) => {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    if (typeof title !== "string" || typeof description !== "string") {
      return res.status(400).json({
        message: "Invalid type of title or description",
      });
    }
    try {
      return res.json(
        await prisma.updates.create({
          data: {
            title,
            content: description,
          },
        })
      );
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message,
        });
      } else {
        return res.status(500).json({
          message: "An error occured :(",
        });
      }
    }
  }
);

export default router;
