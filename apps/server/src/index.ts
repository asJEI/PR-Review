import { createReviewsServer } from "./routes/reviews.js";

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "127.0.0.1";

const server = createReviewsServer();

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use on ${host}. Stop the existing server or set PORT to another value.`,
    );
    console.error(`Example: netstat -ano | findstr :${port}`);
    process.exit(1);
  }

  console.error("Failed to start server:", error.message);
  process.exit(1);
});

server.listen(port, host, () => {
  console.log(`@pr-review/server listening on http://${host}:${port}`);
  console.log("POST /api/reviews");
  console.log("GET  /api/reviews/:id");
  console.log("GET  /api/reviews/:id/events");
  console.log("GET  /api/healthz");
});

