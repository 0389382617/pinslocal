const express = require("express");
const cors = require("cors");
const client = require("prom-client");
const pinsRouter = require("./routes/pins");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

// --- Prometheus metrics (khop voi bai Grafana/Prometheus da hoc) ---
const register = new client.Registry();
client.collectDefaultMetrics({ register });
const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Thoi gian xu ly request HTTP",
  labelNames: ["method", "route", "status"],
  registers: [register],
});
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on("finish", () => {
    end({ method: req.method, route: req.path, status: res.statusCode });
  });
  next();
});
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.use("/pins", pinsRouter);

// error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal error" });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`PinsLocal backend chay tai port ${PORT}`));
}

module.exports = app;
