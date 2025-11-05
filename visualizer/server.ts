import express from "express";
import http from "http";
import { Server } from "socket.io";
import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";
import fs from "fs";
import path from "path";

type arduinoPort = {
  path: string;
  manufacturer?: string;
  serialNumber?: string;
  pnpId?: string;
  locationId?: string;
  friendlyName?: string;
  vendorId?: string;
  productId?: string;
};

const app = express();
const server = http.createServer(app);
const io = new Server(server);
let arduinoList: arduinoPort[] = [];

app.use("/script", express.static(path.join(__dirname, "../script")));
app.use("/style", express.static(path.join(__dirname, "../style")));
app.use("/view", express.static(path.join(__dirname, "../view")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../view/index.html"));
});

function logTemperatureToFile(source: string, value: number) {
  const timestamp = new Date().toISOString();
  const line = `${timestamp} [${source}]: ${value}°C\n`;

  fs.appendFile(`temperature_log-${source}.txt`, line, (err) => {
    if (err) console.error("Error with file initialization", err);
  });
}

async function getArduino(): Promise<arduinoPort[]> {
  let ports = await SerialPort.list();
  ports.forEach((item: arduinoPort) => {
    const validVendors = ["0843", "1A86", "10C4"];
    if (item.vendorId && validVendors.includes(item.vendorId)) {
      arduinoList.push(item);
    }
  });
  return arduinoList;
}

async function init() {
  const arduinoPorts = await getArduino();

  arduinoPorts.forEach((item: any) => {
    const serialPort = new SerialPort({ path: item?.path, baudRate: 9600 });
    const parser = serialPort.pipe(new ReadlineParser({ delimiter: "\n" }));

    parser.on("data", (data: string) => {
      const valueFloat = parseFloat(data);
      const value = valueFloat / 1.71;
      if (!isNaN(value)) {
        io.emit(`temperature:${item.path}`, value);
        io.emit(`connectedDevice`, arduinoList);
        logTemperatureToFile(`arduino:${item.friendlyName}`, value);
      }
    });
  });

  server.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
  });
}

init().catch((err) => {
  console.error("Initialization error:", err);
  process.exit(1);
});

// === Simple mock for frontend testing (insert into your server file) ===
const mockIntervals: Map<string, NodeJS.Timeout> = new Map();

function startMockDevice(fakePath: string, intervalMs = 1000) {
  // avoid duplicates
  if (arduinoList.some(d => d.path === fakePath)) {
    console.log(`Mock already exists: ${fakePath}`);
    return;
  }

  const dev = { path: fakePath, friendlyName: `MOCK-${fakePath}`, manufacturer: "mock" };
  arduinoList.push(dev);
  io.emit("connectedDevice", arduinoList);
  console.log(`Mock device added: ${fakePath}`);

  // simulate temperature values
  let t = 0;
  const timer = setInterval(() => {
    const base = 20 + 5 * Math.sin(t / 6);       // smooth oscillation
    const noise = (Math.random() - 0.5) * 1.5;   // small noise
    const value = +(base + noise).toFixed(2);    // two decimals
    io.emit(`temperature:${fakePath}`, value);
    t++;
  }, intervalMs);

  mockIntervals.set(fakePath, timer);
}

function stopMockDevice(fakePath: string) {
  const timer = mockIntervals.get(fakePath);
  if (timer) {
    clearInterval(timer);
    mockIntervals.delete(fakePath);
  }
  arduinoList = arduinoList.filter(d => d.path !== fakePath);
  io.emit("connectedDevice", arduinoList);
  console.log(`Mock device stopped: ${fakePath}`);
}

function stopAllMocks() {
  for (const [path, timer] of mockIntervals) {
    clearInterval(timer);
  }
  mockIntervals.clear();
  // remove all mock devices (we assume mock devices have manufacturer "mock")
  arduinoList = arduinoList.filter(d => d.manufacturer !== "mock");
  io.emit("connectedDevice", arduinoList);
  console.log("All mock devices stopped");
}

// HTTP endpoints to control mock (easy to call from browser or curl)
app.get("/mock/start", (req, res) => {
  const count = parseInt(String(req.query.count || "1"), 10);
  const intervalMs = parseInt(String(req.query.intervalMs || "1000"), 10);

  for (let i = 0; i < count; i++) {
    const fakePath = `MOCK_COM${Date.now().toString(36).slice(-4)}_${i}`;
    startMockDevice(fakePath, intervalMs);
  }
  res.json({ status: "started", count });
});

app.get("/mock/stop", (req, res) => {
  stopAllMocks();
  res.json({ status: "stopped" });
});

// auto-start mocks if env var set
if (process.env.MOCK === "true") {
  // start 2 mocks by default on server start
  startMockDevice("MOCK_COM1", 1000);
  startMockDevice("MOCK_COM2", 1000);
}
