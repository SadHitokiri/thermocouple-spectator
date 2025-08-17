"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const serialport_1 = require("serialport");
const parser_readline_1 = require("@serialport/parser-readline");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
let buffer = [];
app.use(express_1.default.static('public'));
// Укажи актуальный COM-порт
const serial = new serialport_1.SerialPort({ path: 'COM7', baudRate: 9600 });
const parser = serial.pipe(new parser_readline_1.ReadlineParser({ delimiter: '\n' }));
parser.on('data', (data) => {
    const value = parseFloat(data);
    if (!isNaN(value)) {
        io.emit('temperature', value);
    }
});
server.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
