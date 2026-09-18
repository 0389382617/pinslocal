const express = require("express");
const cors = require("cors");
const multer = require("multer");
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
    // Dung route pattern (vd "/pins/:id") thay vi req.path thuc te (chua id cu the)
    // de tranh bung no so luong time-series theo tung id khac nhau.
    const route = req.route ? `${req.baseUrl}${req.route.path}` : "unmatched";
    end({ method: req.method, route, status: res.statusCode });
  });
  next();
});
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.use("/pins", pinsRouter);

// error handler - phan biet loi do client (tra ve 400/413 kem message an toan)
// voi loi server that su (tra ve 500 chung chung, khong lo message noi bo).
app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "Anh vuot qua 5MB" : "Upload anh khong hop le";
    return res.status(413).json({ error: message });
  }

  if (err.statusCode === 400) {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: "Da co loi xay ra, vui long thu lai sau" });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`PinsLocal backend chay tai port ${PORT}`));
}

module.exports = app;
