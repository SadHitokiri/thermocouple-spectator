import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import { SerialPort } from 'serialport'
import { ReadlineParser } from '@serialport/parser-readline'
import fs from 'fs'
import path from 'path'

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use('/script', express.static(path.join(__dirname, '../script')))
app.use('/style', express.static(path.join(__dirname, '../style')))
app.use('/view', express.static(path.join(__dirname, '../view')))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../view/index.html'))
})

const serial1 = new SerialPort({ path: 'COM7', baudRate: 9600 })
const parser1 = serial1.pipe(new ReadlineParser({ delimiter: '\n' }))

parser1.on('data', (data: string) => {
  const valueFloat = parseFloat(data)
  const value = valueFloat/1.71 
  if (!isNaN(value)) {
    io.emit('temperature1', value)
    logTemperatureToFile("arduino1", value)
  }
})

const serial2 = new SerialPort({ path: 'COM8', baudRate: 9600 })
const parser2 = serial2.pipe(new ReadlineParser({ delimiter: '\n' }))

parser2.on('data', (data: string) => {
  const valueFloat = parseFloat(data)
  const value = valueFloat/1.71 
  if (!isNaN(value)) {
    io.emit('temperature2', value)
    logTemperatureToFile("arduino2", value)
  }
})

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000')
})

function logTemperatureToFile(source: string, value: number) {
  const timestamp = new Date().toISOString()
  const line = `${timestamp} [${source}]: ${value}°C\n`

  fs.appendFile(`temperature_log-${source}.txt`, line, (err) => {
    if (err) console.error("Error with file initialization", err)
  })
}
