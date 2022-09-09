import { Prisma, PrismaClient } from "@prisma/client";
import express from "express";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());

app.post(`/signup`, async (req, res) => {
  const { name, email } = req.body;

  const result = await prisma.user.create({
    data: {
      name,
      email,
    },
  });
  res.json(result);
});

app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.listen(3000, () =>
  console.log(`
🚀 Server ready at: http://localhost:3000
⭐️ See sample requests: http://pris.ly/e/ts/rest-express#3-using-the-rest-api`)
);
