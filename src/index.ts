import { PrismaClient } from "@prisma/client";
import express from "express";

// Middlewares
import { adminMiddleware } from "./middleware/admin.middleware";
import { authMiddleware } from "./middleware/auth.middleware";
import { teamMiddleware } from "./middleware/team.middleware";

// Routers
import teamsRouter from "./routes/TeamRouter";
import adminRouter from "./routes/AdminRouter";
import verifyRouter from "./routes/VerifyRouter";
import usersRouter from "./routes/UserRouter";
import submissionsRouter from "./routes/SubmissionRouter";
import questionGroupsRouter from "./routes/QuestionGroupRouter";

// Security
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import cors from "cors";
import redis from "redis";
import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { whitelistMiddleware } from "./middleware/whitelist.middleware";
dotenv.config();

const app = express();

// const redisClient = redis.createClient();

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app }),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});

// RequestHandler creates a separate execution context using domains, so that every
// transaction/span/breadcrumb is attached to its own Hub instance
app.use(Sentry.Handlers.requestHandler());
// TracingHandler creates a trace for every incoming request
app.use(Sentry.Handlers.tracingHandler());

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

app.use("/admin", adminMiddleware, adminRouter);
export const prisma = new PrismaClient();

// health route
app.get("/", (req, res) => {
  return res.status(200).json({
    message: "online",
  });
});

app.use(authMiddleware);
app.use(whitelistMiddleware);

// app.get("/users", async (req, res) => {
//   const users = await prisma.user.findMany();
//   res.json(users);
// });
app.use("/verify", verifyRouter);
app.use("/users", usersRouter);
app.use("/teams", teamsRouter);

// Check whether user is in a team
app.use(teamMiddleware);
app.use("/submissions", submissionsRouter);
app.use("/questiongroups", questionGroupsRouter);

app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});

// The error handler must be before any other error middleware and after all controllers
app.use(
  Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      if (error.status && error.status >= 400) {
        return true;
      }
      return false;
    },
  })
);

const port = process.env.PORT || 8081;
app.listen(port, () =>
  console.log(`
🚀 Server ready at: http://localhost:${port}
`)
);
