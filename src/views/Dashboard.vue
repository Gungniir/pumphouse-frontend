<template>
  <v-container fluid class="fill-height">
    <v-row class="fill-height">
      <v-col cols="1" class="d-flex flex-column align-center">
        <div style="width: 100%;">
          <v-img
              class="mb-14"
              :src="require('../assets/logo-small.png')"
          />
        </div>
        <v-btn icon large class="mb-10">
          <v-icon>mdi-account-group</v-icon>
        </v-btn>
        <v-btn icon large class="mb-10">
          <v-icon>mdi-file-document</v-icon>
        </v-btn>
        <v-btn icon large class="mb-10">
          <v-icon>mdi-currency-usd</v-icon>
        </v-btn>
      </v-col>
      <v-col cols="10">
        <v-row>
          <v-col cols="6">
            <v-card height="250" :loading="!residentsDataLoaded">
              <v-card-text style="height: 100%">
                <residents-chart ref="resident-chart"
                    style="height: 100%; width: 100%"
                    :chart-data="residentsData"
                />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="1">
        <div class="d-flex flex-column align-center">
          <v-icon x-large color="accent">mdi-account-circle</v-icon>
          <span style="font-size: 13px">Администратор</span>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import ResidentsChart from "@/components/ResidentsChart";
import api from "@/api";

export default {
  name: "Dashboard",
  components: {ResidentsChart},
  data: () => ({
    residentsDataLoaded: false,
    residentsData: {
      labels: [],
      datasets: [
        {
          label: 'Подключено дачников',
          backgroundColor: '#599CC2CC',
          barThickness: 8,
          data: [],
        },
      ],
    },
    authError: false,
    connectionError: false,
  }),
  async mounted() {
    const residents = await api.residentsIndex();

    if (residents === null) {
      this.connectionError = true
      return
    }

    if (residents === false) {
      this.authError = true
      return
    }

    const nowMonth = (new Date()).getMonth()
    const nowYear = (new Date()).getFullYear()
    const data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    const labels = ['Январь ', 'Февраль ', 'Март ', 'Апрель ', 'Май ', 'Июнь ', 'Июль ', 'Август ', 'Сентябрь ',
      'Октябрь ', 'Ноябрь ', 'Декабрь ']

    for (let i = 0; i < 12; i++) {
      if (i > nowMonth) {
        labels[i] += nowYear - 1
      } else {
        labels[i] += nowYear
      }
    }

    for (const {start_date} of residents.data) {
      const date = new Date(start_date)

      if (date.getFullYear() === nowYear && date.getMonth() <= nowMonth) {
        data[date.getMonth()]++
      } else if (date.getFullYear() === nowYear - 1 && date.getMonth() > nowMonth) {
        data[date.getMonth()]++
      }
    }

    this.$set(this.residentsData.datasets[0], 'data', data)
    this.$set(this.residentsData, 'labels', labels)

    this.residentsDataLoaded = true

    console.log(this.$refs["resident-chart"].$data._chart.update());
  }

}
</script>

<style scoped lang="scss">

</style>
