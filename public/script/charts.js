const socket = io();
let receiving = true;
const maxPoints = 50;
const maxAvailableTemp = 30;

let allTemps1 = [];
let allTemps2 = [];

const ctx1 = document.getElementById("tempChart1").getContext("2d");
const ctx2 = document.getElementById("tempChart2").getContext("2d");

function createChart(ctx, label, color) {
  return new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label,
          data: [],
          borderColor: color,
          fill: false,
          tension: 0.1,
        },
        {
          label: "Max Threshold",
          data: [],
          borderColor: "red",
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        },
      ],
    },
    options: {
      animation: { duration: 100 },
      scales: {
        x: { title: { display: true, text: "Time" } },
        y: { title: { display: true, text: "Temperature (°C)" } },
      },
    },
  });
}

const chart1 = createChart(ctx1, "Arduino 1", "blue");
const chart2 = createChart(ctx2, "Arduino 2", "green");

function updateChart(chart, tempsArray, value, labelId, minId, maxId) {
  if (!receiving) return;

  const time = new Date().toLocaleTimeString();

  if (chart.data.labels.length >= maxPoints) {
    chart.data.labels = [];
    chart.data.datasets.forEach(ds => ds.data = []);
    tempsArray.length = 0;
  }

  chart.data.labels.push(time);
  chart.data.datasets[0].data.push(value);
  chart.data.datasets[1].data = Array(chart.data.labels.length).fill(maxAvailableTemp);
  chart.update();

  tempsArray.push(value);

  document.getElementById(labelId).textContent = value.toFixed(2);
  document.getElementById(minId).textContent = Math.min(...tempsArray).toFixed(2);
  document.getElementById(maxId).textContent = Math.max(...tempsArray).toFixed(2);
}

socket.on("temperature1", value => {
  updateChart(chart1, allTemps1, value, "temp1", "minTemp1", "maxTemp1");
});
socket.on("temperature2", value => {
  updateChart(chart2, allTemps2, value, "temp2", "minTemp2", "maxTemp2");
});

document.getElementById("startBtn").addEventListener("click", () => receiving = true);
document.getElementById("stopBtn").addEventListener("click", () => receiving = false);
