const socket = io();
let receiving = true;
let processedDeviceList = [];
const maxAvailableTemp = 30;

const contentContainer = document.getElementById("chartsContainer");

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

function getRandomColor() {
  const colorList = [
    "red",
    "blue",
    "green",
    "orange",
    "purple",
    "cyan",
    "magenta",
  ];
  return colorList[Math.floor(Math.random() * colorList.length)];
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
  if (processedDeviceList.some(d => d.path === device.path)) return;

  const deviceContainer = document.createElement("div");
  deviceContainer.id = `container-${device.path}`;
  deviceContainer.classList.add("device-block");

  const title = document.createElement("h3");
  title.textContent = device.friendlyName || device.path;
  const valueLabel = document.createElement("div");
  valueLabel.id = `temp-${device.path}`;
  valueLabel.textContent = "— °C";

  const canvas = document.createElement("canvas");
  deviceContainer.appendChild(title);
  deviceContainer.appendChild(valueLabel);
  deviceContainer.appendChild(canvas);
  contentContainer.appendChild(deviceContainer);

  const ctx = canvas.getContext("2d");
  const deviceChart = createChart(ctx, device.path, getRandomColor());

  const oDeviceObject = {
    path: device.path,
    id: deviceContainer.id,
    chart: deviceChart,
    tempsArray: [],
  };
  processedDeviceList.push(oDeviceObject);

  const eventName = `temperature:${device.path}`;
  socket.off(eventName);
  socket.on(eventName, (value) => {
    updateChart(deviceChart, oDeviceObject.tempsArray, value, `temp-${device.path}`);
  });
}


//Get devices for chart creation
socket.on("connectedDevice", (deviceList) => {
  deviceList.forEach((device) => {
    setupDevice(device);
  });
});

// const chart1 = createChart(ctx1, "Arduino 1", "blue");

// socket.on("temperature1", (value) => {
//   updateChart(chart1, allTemps1, value, "temp1");
//   checkAndPlayAlert(value, "thresholdInputs1");
// });
