import { PrismaClient } from "@prisma/client";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { authMiddleware } from "./auth";
import teamsRouter from "./routes/TeamRouter";
import adminRouter from "./routes/AdminRouter";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import * as Sentry from "@sentry/node";
import cors from "cors";
import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import usersRouter from "./routes/UserRouter";
import submissionsRouter from "./routes/SubmissionRouter";
import questionGroupsRouter from "./routes/QuestionGroupRouter";
dotenv.config();

const app = express();

Sentry.init({ dsn: process.env.SENTRY_DSN });

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

app.use(helmet());

app.use(express.json());
app.use(express.static("public"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply the rate limiting middleware to all requests
app.use(limiter);

app.use(
  cors({
    origin: true,
    optionsSuccessStatus: 200,
    credentials: true,
  })
);
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(undefined, {
    swaggerOptions: {
      url: "/swagger.json",
    },
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
app.use("/teams", teamsRouter);
app.use("/users", usersRouter);
app.use("/submissions", submissionsRouter);
app.use("/questiongroups", questionGroupsRouter);

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

const port = process.env.PORT || 8081;
app.listen(port, () =>
  console.log(`
🚀 Server ready at: http://localhost:${port}
`)
);
