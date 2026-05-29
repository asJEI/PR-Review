import { createReviewsServer } from "./routes/reviews.js";

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "127.0.0.1";

const server = createReviewsServer();
server.listen(port, host, () => {
  console.log(`@pr-review/server listening on http://${host}:${port}`);
  console.log("POST /api/reviews");
  console.log("GET  /api/reviews/:id");
  console.log("GET  /api/reviews/:id/events");
  console.log("GET  /healthz");
});

