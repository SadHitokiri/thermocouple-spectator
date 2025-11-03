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
