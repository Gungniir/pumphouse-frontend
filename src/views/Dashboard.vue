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
          <v-col cols="8">
            <v-card height="250" :loading="!residentsDataLoaded">
              <v-card-text style="height: 100%">
                <residents-chart ref="resident-chart"
                                 style="height: 100%; width: 100%"
                                 :chart-data="residentsData"
                />
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="4">
            <v-card :loading="!residentsDataLoaded" class="fill-height d-flex flex-column">
              <v-card-title>Всего подключено</v-card-title>
              <v-card-text style="font-size: 42px" class="flex-grow-1 d-flex align-center justify-center">
                {{ residentsCount }}
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="5">
            <v-card height="300" :loading="!recordsDataLoaded" class="d-flex flex-column">
              <v-card-title>Всего потрачено</v-card-title>
              <v-card-text style="font-size: 42px" class="flex-grow-1 d-flex align-center justify-center">{{ totalConsumed }}</v-card-text>
            </v-card>
          </v-col>
          <v-col cols="7">

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
    residentsCount: 0,
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
    recordsDataLoaded: false,
    totalConsumed: 0,
    authError: false,
    connectionError: false,
  }),
  methods: {
    residents: async function () {
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
      let data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      let labels = ['Январь ', 'Февраль ', 'Март ', 'Апрель ', 'Май ', 'Июнь ', 'Июль ', 'Август ', 'Сентябрь ',
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

      // Записываем сначала прошедший год, а затем настоящий
      labels = labels.slice(nowMonth + 1).concat(labels.slice(0, nowMonth + 1))
      data = data.slice(nowMonth + 1).concat(data.slice(0, nowMonth + 1))

      this.$set(this.residentsData.datasets[0], 'data', data)
      this.$set(this.residentsData, 'labels', labels)

      this.residentsCount = residents.data.length

      this.residentsDataLoaded = true

      // Обновляем график
      this.$refs["resident-chart"].$data._chart.update();
    },
    periods: async function() {
      const records = await api.pumpMeterRecordsIndex()

      if (records === null) {
        this.connectionError = true
        return
      }

      if (records === false) {
        this.authError = true
        return
      }

      this.totalConsumed = records.data.reduce((a, {amount_volume}) => a + Number(amount_volume), 0).toFixed(2)
      this.recordsDataLoaded = true
    }
  },
  mounted() {
    this.residents()
    this.periods()
  }

}
</script>

<style scoped lang="scss">

</style>
