import cors from "cors";
import express from "express";
import morgan from "morgan";
import connect from "./databases/connection.js";
import { router } from "./router/route.js";
import bodyParser from "body-parser";

const app = express();
const maxRequestBodySize = "50mb";

/** middlewares */
app.use(bodyParser.json({ limit: maxRequestBodySize }));
app.use(bodyParser.urlencoded({ extended: true, limit: maxRequestBodySize }));
app.use(express.json());
app.use(cors());
app.use(morgan("tiny"));
app.disable("x-powered-by");
// fewer hackers know about our stack

const PORT = 8080;
// HTTPS Request
app.get("/", (req, res) => {
  res.status(201).json({
    status: "SUCCESS",
    data: "Backend services run",
  });
});

// Route
app.use("/api", router);

connect()
  .then(() => {
    try {
      // connectToMongo();

      app.listen(PORT, () =>
        console.log(`The server running on: http://localhost:${PORT}`),
      );
    } catch (error) {
      console.log("Cannot connect to the server ...");
    }
  })
  .catch((err) => {
    console.log("err =>", err);
  });
