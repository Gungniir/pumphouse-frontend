<script>
import {Line, mixins} from 'vue-chartjs'
const { reactiveProp } = mixins

export default {
  extends: Line,
  mixins: [reactiveProp],
  data: () => ({
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
  mounted() {
    this.renderChart(this.chartData, this.options)
  }
}
</script>
