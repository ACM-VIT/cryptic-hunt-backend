import { PrismaClient } from "@prisma/client";
import express from "express";
import { authMiddleware } from "./auth";
import router from "./routes/TeamRouter";
import adminRouter from "./routes/AdminRouter";
import cors from "cors";
import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import user_router from "./routes/UserRouter";
dotenv.config();

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: true,
    optionsSuccessStatus: 200,
    credentials: true,
  })
);

app.use(adminRouter);
export const prisma = new PrismaClient();
// app.post(`/signup`, async (req, res) => {
//   const { name, email } = req.body;
//   const result = await prisma.user.create({
//     data: {
//       name,
//       email,
//     },
//   });
//   res.json(result);
// });

// / route
app.get("/", (req, res) => {
  return res.status(200).json({
    message: "online",
  });
});

app.use(authMiddleware);

// app.get("/users", async (req, res) => {
//   const users = await prisma.user.findMany();
//   res.json(users);
// });
app.use("/teams", router);
app.use("/user", user_router);

const port = 8081;
app.listen(port, () =>
  console.log(`
🚀 Server ready at: http://localhost:${port}
`)
);
