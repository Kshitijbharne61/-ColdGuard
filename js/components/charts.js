// ============================================================================
// ColdGuard - Telemetry & Viability Chart Components
// High-Resolution Time-Series, Threshold Bands, & Viability Projections
// ============================================================================

export class TelemetryCharts {
  constructor() {
    this.telemetryChart = null;
    this.viabilityProjectionChart = null;
    this.activeTimeWindow = "1h"; // 1h, 6h, 12h, 24h, 7d
    this.activeMetric = "temperature"; // "temperature" or "humidity" or "both"
  }

  setTimeWindow(windowStr, shipment) {
    this.activeTimeWindow = windowStr;
    if (shipment) {
      this.updateTelemetryChart(shipment);
    }
  }

  setMetric(metricStr, shipment) {
    this.activeMetric = metricStr;
    if (shipment) {
      this.updateTelemetryChart(shipment);
    }
  }

  /**
   * Initializes or updates the main Environmental Telemetry Chart
   */
  updateTelemetryChart(shipment) {
    const canvas = document.getElementById("telemetry-chart-canvas");
    if (!canvas || typeof window.Chart === "undefined") return;

    const ctx = canvas.getContext("2d");
    const history = shipment.history || [];

    // Filter points based on active window (simulated density)
    let displayPoints = [...history];
    if (this.activeTimeWindow === "1h") {
      displayPoints = history.slice(-15);
    } else if (this.activeTimeWindow === "6h") {
      displayPoints = history.slice(-25);
    } else {
      displayPoints = history;
    }

    const labels = displayPoints.map(p => {
      const d = new Date(p.timestamp);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    });

    const tempData = displayPoints.map(p => p.temperature);
    const humData = displayPoints.map(p => p.humidity);

    const minTemp = shipment.minAllowedTemperature;
    const maxTemp = shipment.maxAllowedTemperature;
    const minHum = shipment.minAllowedHumidity;
    const maxHum = shipment.maxAllowedHumidity;

    // Detect out-of-range points for point color styling
    const pointColors = displayPoints.map(p => {
      if (p.temperature > maxTemp || p.temperature < minTemp) {
        return "#EF4444"; // Red for excursion
      }
      return "#2563EB"; // Blue safe
    });

    const datasets = [];

    if (this.activeMetric === "temperature" || this.activeMetric === "both") {
      datasets.push({
        label: "Temperature (°C)",
        data: tempData,
        borderColor: "#2563EB",
        backgroundColor: "rgba(37, 99, 235, 0.08)",
        borderWidth: 2.5,
        pointBackgroundColor: pointColors,
        pointBorderColor: "#FFFFFF",
        pointBorderWidth: 2,
        pointRadius: 4.5,
        pointHoverRadius: 7,
        fill: true,
        tension: 0.35,
        yAxisID: "yTemp"
      });

      // Max allowed threshold line
      datasets.push({
        label: `Max Permitted (${maxTemp}°C)`,
        data: new Array(displayPoints.length).fill(maxTemp),
        borderColor: "rgba(239, 68, 68, 0.8)",
        borderWidth: 1.5,
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false,
        yAxisID: "yTemp"
      });

      // Min allowed threshold line
      datasets.push({
        label: `Min Permitted (${minTemp}°C)`,
        data: new Array(displayPoints.length).fill(minTemp),
        borderColor: "rgba(59, 130, 246, 0.7)",
        borderWidth: 1.5,
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false,
        yAxisID: "yTemp"
      });
    }

    if (this.activeMetric === "humidity" || this.activeMetric === "both") {
      datasets.push({
        label: "Humidity (% RH)",
        data: humData,
        borderColor: "#06B6D4",
        backgroundColor: "rgba(6, 182, 212, 0.06)",
        borderWidth: 2,
        pointBackgroundColor: "#06B6D4",
        pointBorderColor: "#FFFFFF",
        pointBorderWidth: 1.5,
        pointRadius: 3.5,
        fill: true,
        tension: 0.35,
        yAxisID: this.activeMetric === "both" ? "yHum" : "yTemp"
      });

      if (this.activeMetric === "humidity") {
        datasets.push({
          label: `Max Humidity (${maxHum}%)`,
          data: new Array(displayPoints.length).fill(maxHum),
          borderColor: "rgba(245, 158, 11, 0.8)",
          borderWidth: 1.5,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
          yAxisID: "yTemp"
        });
        datasets.push({
          label: `Min Humidity (${minHum}%)`,
          data: new Array(displayPoints.length).fill(minHum),
          borderColor: "rgba(245, 158, 11, 0.8)",
          borderWidth: 1.5,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
          yAxisID: "yTemp"
        });
      }
    }

    if (this.telemetryChart) {
      this.telemetryChart.data.labels = labels;
      this.telemetryChart.data.datasets = datasets;
      this.telemetryChart.update("none");
      return;
    }

    // Create new chart instance
    this.telemetryChart = new window.Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false
        },
        plugins: {
          legend: {
            position: "top",
            labels: {
              boxWidth: 12,
              font: { family: "Inter", size: 11, weight: "500" },
              color: "#475569"
            }
          },
          tooltip: {
            backgroundColor: "#0F172A",
            titleFont: { family: "Inter", size: 12, weight: "600" },
            bodyFont: { family: "Inter", size: 12 },
            padding: 10,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: { color: "rgba(226, 232, 240, 0.6)" },
            ticks: {
              font: { family: "Inter", size: 10 },
              color: "#64748B",
              maxRotation: 0,
              autoSkip: true,
              maxTicksLimit: 7
            }
          },
          yTemp: {
            type: "linear",
            display: true,
            position: "left",
            grid: { color: "rgba(226, 232, 240, 0.6)" },
            ticks: {
              font: { family: "Inter", size: 11 },
              color: "#64748B"
            }
          },
          yHum: {
            type: "linear",
            display: this.activeMetric === "both",
            position: "right",
            grid: { drawOnChartArea: false },
            ticks: {
              font: { family: "Inter", size: 11 },
              color: "#06B6D4"
            }
          }
        }
      }
    });
  }

  /**
   * Initializes or updates the Viability Trajectory Projection Chart
   */
  updateViabilityProjectionChart(trajectoryData) {
    const canvas = document.getElementById("viability-projection-canvas");
    if (!canvas || typeof window.Chart === "undefined") return;

    const ctx = canvas.getContext("2d");
    const labels = trajectoryData.map(d => d.timeLabel);
    const histData = trajectoryData.map(d => d.historical);
    const uncorrectedData = trajectoryData.map(d => d.projectedUncorrected);
    const stabilizedData = trajectoryData.map(d => d.projectedStabilized);
    const thresholdData = trajectoryData.map(d => d.criticalThreshold);

    const datasets = [
      {
        label: "Observed Viability",
        data: histData,
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        borderWidth: 2.5,
        pointBackgroundColor: "#10B981",
        pointRadius: 4,
        fill: true,
        tension: 0.3
      },
      {
        label: "Projected (Uncorrected Excursion)",
        data: uncorrectedData,
        borderColor: "#EF4444",
        borderWidth: 2.5,
        borderDash: [5, 5],
        pointBackgroundColor: "#EF4444",
        pointRadius: 4,
        fill: false,
        tension: 0.25
      },
      {
        label: "Projected (If Immediate Intervention)",
        data: stabilizedData,
        borderColor: "#3B82F6",
        borderWidth: 2,
        borderDash: [3, 3],
        pointBackgroundColor: "#3B82F6",
        pointRadius: 3,
        fill: false,
        tension: 0.25
      },
      {
        label: "Critical Efficacy Threshold (80%)",
        data: thresholdData,
        borderColor: "#F59E0B",
        borderWidth: 1.5,
        borderDash: [8, 4],
        pointRadius: 0,
        fill: false
      }
    ];

    if (this.viabilityProjectionChart) {
      this.viabilityProjectionChart.data.labels = labels;
      this.viabilityProjectionChart.data.datasets = datasets;
      this.viabilityProjectionChart.update("none");
      return;
    }

    this.viabilityProjectionChart = new window.Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false
        },
        plugins: {
          legend: {
            position: "top",
            labels: {
              boxWidth: 12,
              font: { family: "Inter", size: 10, weight: "500" },
              color: "#475569"
            }
          },
          tooltip: {
            backgroundColor: "#0F172A",
            padding: 10,
            cornerRadius: 8
          }
        },
        scales: {
          x: {
            grid: { color: "rgba(226, 232, 240, 0.6)" },
            ticks: { font: { family: "Inter", size: 10 }, color: "#64748B" }
          },
          y: {
            min: 50,
            max: 100,
            grid: { color: "rgba(226, 232, 240, 0.6)" },
            ticks: {
              font: { family: "Inter", size: 10 },
              color: "#64748B",
              callback: (val) => `${val}%`
            }
          }
        }
      }
    });
  }

  destroy() {
    if (this.telemetryChart) {
      this.telemetryChart.destroy();
      this.telemetryChart = null;
    }
    if (this.viabilityProjectionChart) {
      this.viabilityProjectionChart.destroy();
      this.viabilityProjectionChart = null;
    }
  }
}
