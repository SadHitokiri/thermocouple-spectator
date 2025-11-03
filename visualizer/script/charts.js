const socket = io();
let receiving = true;
let processedDeviceList = [];
const maxAvailableTemp = 30;

let allTemps1 = [];

const contentContainer = document.getElementById("contentContainer");

//Chart creation
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
      ],
    },
    options: {
      animation: { duration: 100 },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        decimation: {
          enabled: true,
          algorithm: "min-max",
          samples: 500,
        },
      },
      scales: {
        x: {
          type: "time",
          time: {
            unit: "minute",
            displayFormats: {
              minute: "HH:mm",
            },
            tooltipFormat: "HH:mm:ss",
          },
          title: { display: true, text: "Laiks" },
          ticks: {
            autoSkip: true,
            maxRotation: 0,
            minRotation: 0,
          },
        },
        y: {
          title: { display: true, text: "Temperature (°C)" },
          min: 0,
          max: 300,
          ticks: {
            stepSize: 5,
          },
        },
      },
    },
  });
}

function updateChart(chart, tempsArray, value, labelId) {
  if (!receiving) return;

  const time = new Date();

  chart.data.labels.push(time);
  chart.data.datasets[0].data.push(value);
  chart.data.datasets[1].data = Array(chart.data.labels.length).fill(
    maxAvailableTemp
  );
  chart.update();

  tempsArray.push(value);

  document.getElementById(labelId).textContent = value.toFixed(2);
}

function setupDevice(device) {
  if (processedDeviceList.includes(device.path)) {
    return; // Device already set up
  }



}

//Get devices for chart creation
socket.on("connectedDevice", (deviceList) => {
  deviceList.forEach(device => {
    setupDevice(device);
  });
});

// const chart1 = createChart(ctx1, "Arduino 1", "blue");

// socket.on("temperature1", (value) => {
//   updateChart(chart1, allTemps1, value, "temp1");
//   checkAndPlayAlert(value, "thresholdInputs1");
// });


