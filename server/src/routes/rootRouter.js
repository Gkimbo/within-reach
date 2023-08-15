import express from "express";
import activityRouter from "./api/v1/activityRouter.js";
import popularDestinationRouter from "./api/v1/popularDestinationRouter.js";
import userSessionsRouter from "./api/v1/userSessionsRouter.js";
import usersRouter from "./api/v1/usersRouter.js";
import clientRouter from "./clientRouter.js";
const rootRouter = new express.Router();
rootRouter.use("/", clientRouter);
rootRouter.use("/api/v1/user-sessions", userSessionsRouter);
rootRouter.use("/api/v1/users", usersRouter);

rootRouter.use("/api/v1/destinations", popularDestinationRouter);
rootRouter.use("/api/v1/activity", activityRouter);

export default rootRouter;
