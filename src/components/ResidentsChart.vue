
<script>
import { Bar } from 'vue-chartjs'

export default {
  extends: Bar,
  data: () => ({
    chartdata: {
      labels: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май'],
      datasets: [
        {
          label: 'Подключено дачников',
          backgroundColor: '#599CC2CC',
          barThickness: 8,
          data: [30, 10, 25, 30, 10],
        },
        {
          label: 'Создано аккаунтов',
          backgroundColor: '#E75F88CC',
          barThickness: 8,
          data: [30, 20, 10, 30, 20],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        yAxes: [{
          ticks: {
            suggestedMin: 0,
            suggestedMax: 30 + 30 * 0.05,
            beginAtZero: true
          }
        }]
      }
    }
  }),

  mounted () {
    this.renderChart(this.chartdata, this.options)
  }
}
</script>
