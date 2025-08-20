const socket = io();
let receiving = true;
const maxAvailableTemp = 30;

let allTemps1 = [];
let allTemps2 = [];
let allTemps3 = [];
let allTemps4 = [];

const ctx1 = document.getElementById("tempChart1").getContext("2d");
const ctx2 = document.getElementById("tempChart2").getContext("2d");
const ctx3 = document.getElementById("tempChart3").getContext("2d");
const ctx4 = document.getElementById("tempChart4").getContext("2d");

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
            unit: "minute", // ⏱ деление по минутам
            displayFormats: {
              minute: "HH:mm", // 🕒 формат: Часы:Минуты
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

const chart1 = createChart(ctx1, "Arduino 1", "blue");
const chart2 = createChart(ctx2, "Arduino 2", "green");
const chart3 = createChart(ctx3, "Arduino 3", "orange");
const chart4 = createChart(ctx4, "Arduino 4", "purple");

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

socket.on("temperature1", (value) => {
  updateChart(chart1, allTemps1, value, "temp1");
  checkAndPlayAlert(value, "thresholdInputs1");
});

socket.on("temperature2", (value) => {
  updateChart(chart2, allTemps2, value, "temp2");
  checkAndPlayAlert(value, "thresholdInputs2");
});

socket.on("temperature3", (value) => {
  updateChart(chart3, allTemps3, value, "temp3");
  checkAndPlayAlert(value, "thresholdInputs3");
});

socket.on("temperature4", (value) => {
  updateChart(chart4, allTemps4, value, "temp4");
  checkAndPlayAlert(value, "thresholdInputs4");
});

function generateThresholdInputs(selectId, containerId) {
  const select = document.getElementById(selectId);
  const container = document.getElementById(containerId);

  select.addEventListener("change", () => {
    const count = parseInt(select.value, 10);
    container.innerHTML = "";

    for (let i = 1; i <= count; i++) {
      const input = document.createElement("input");
      input.type = "number";
      input.placeholder = `Kritiskā temperatūra ${i}`;
      input.step = "0.1";
      input.classList.add("thresholdInput");
      container.appendChild(input);
    }
  });
}

generateThresholdInputs("peakCount1", "thresholdInputs1");
generateThresholdInputs("peakCount2", "thresholdInputs2");

function checkAndPlayAlert(currentTemp, inputContainerId) {
  const inputs = document.querySelectorAll(`#${inputContainerId} input`);
  const thresholds = Array.from(inputs)
    .map((inp) => parseFloat(inp.value))
    .filter((val) => !isNaN(val));

  for (const threshold of thresholds) {
    if (currentTemp >= threshold) {
      const beep = new Audio(
        "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
      );
      beep.play();
      break;
    }
  }
}
