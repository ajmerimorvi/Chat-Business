import express from "express";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT) || 3e3;
app.use(express.json());
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));
app.get("/Sampark.apk", (_req, res) => {
  const apkPath = path.join(distPath, "Sampark.apk");
  res.setHeader("Content-Type", "application/vnd.android.package-archive");
  res.setHeader("Content-Disposition", 'attachment; filename="Sampark.apk"');
  res.sendFile(apkPath);
});
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "Sampark" });
});
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});
