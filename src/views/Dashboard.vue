<template>
  <v-container fluid>
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
        <v-card height="250" :loading="!recordsDataLoaded" class="d-flex flex-column">
          <v-card-title>Всего потрачено</v-card-title>
          <v-card-text class="flex-grow-1 d-flex align-center justify-center">
            <span style="font-size: 42px">{{ totalConsumed }}</span><span class="ml-1">куб. м</span>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="7">
        <v-card height="250" :loading="!recordsDataLoaded">
          <v-card-text style="height: 100%">
            <water-chart ref="water-chart"
                         style="height: 100%; width: 100%"
                         :chart-data="waterData"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row class="mb-4">
      <v-col cols="9">
        <v-card height="250" :loading="!tariffsDataLoaded">
          <v-card-text style="height: 100%">
            <water-chart ref="tariff-chart"
                         style="height: 100%; width: 100%"
                         :chart-data="tariffsData"
            />
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="3">
        <v-card height="250" :loading="!tariffsDataLoaded" class="d-flex flex-column">
          <v-card-title>Текущий тариф</v-card-title>
          <v-card-text class="flex-grow-1 d-flex align-center justify-center">
            <span style="font-size: 42px">{{ nowTariff }}</span><span class="ml-1">руб/куб. м</span>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import api from "@/api";
import WaterChart from "@/components/WaterChart";
import ResidentsChart from "@/components/ResidentsChart";

export default {
  name: "Dashboard",
  components: {ResidentsChart, WaterChart},
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
    waterData: {
      labels: [],
      datasets: [
        {
          label: 'Расход воды (в куб. м)',
          backgroundColor: '#ED81A1',
          data: [],
        },
      ],
    },

    tariffsDataLoaded: false,
    nowTariff: 0,
    tariffsData: {
      labels: [],
      datasets: [
        {
          label: 'Стоимость воды',
          backgroundColor: '#599CC2CC',
          data: [],
        },
      ],
    },
  }),
  computed: {
    updateTariffs: function() {
      return this.$store.state.updateTariffs
    },
    updateResidents: function() {
      return this.$store.state.updateResidents
    },
    updateRecords: function() {
      return this.$store.state.updateRecords
    },
  },
  watch: {
    updateTariffs: function (value) {
      if (!value) return
      this.$store.state.updateTariffs = false

      this.tariffsDataLoaded = false
      this.tariffs()
    },
    updateResidents: function (value) {
      if (!value) return
      this.$store.state.updateResidents = false

      this.residentsDataLoaded = false
      this.residents()
    },
    updateRecords: function (value) {
      if (!value) return
      this.$store.state.updateRecords = false

      this.recordsDataLoaded = false
      this.periods()
    },
  },
  methods: {
    residents: async function () {
      const residents = await api.residentsIndex();

      if (residents === null) {
        this.$store.state.connectionError = true
        return
      }

      if (residents === false) {
        this.$store.state.authError = true
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
    periods: async function () {
      let records, periods
      try {
        records = await api.recordsIndex()
        periods = await api.periodsIndex()
      } catch (e) {
        if (e.name === 'AuthError') {
          this.$store.state.authError = true
        } else if (e.name === 'ConnectionError') {
          this.$store.state.connectionError = true
        }
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

      /**
       * @type {({id: Number, begin_date: string, end_date: string, record: {id: Number, period_id: Number, amount_volume: Number}|undefined})[]}
       */
      const periodsWithRecords = periods.data.map(item => ({
        ...item,
        record: records.data.find(({period_id}) => period_id === item.id)
      }))

      for (const {begin_date, record} of periodsWithRecords) {
        if (record === undefined) {
          continue
        }

        const date = new Date(begin_date)

        if (date.getFullYear() === nowYear && date.getMonth() <= nowMonth) {
          data[date.getMonth()] = record.amount_volume
        } else if (date.getFullYear() === nowYear - 1 && date.getMonth() > nowMonth) {
          data[date.getMonth()] = record.amount_volume
        }
      }

      // Записываем сначала прошедший год, а затем настоящий
      labels = labels.slice(nowMonth + 1).concat(labels.slice(0, nowMonth + 1))
      data = data.slice(nowMonth + 1).concat(data.slice(0, nowMonth + 1))

      this.$set(this.waterData.datasets[0], 'data', data)
      this.$set(this.waterData, 'labels', labels)

      this.totalConsumed = records.data.reduce((a, {amount_volume}) => a + Number(amount_volume), 0).toFixed(2)
      this.recordsDataLoaded = true

      // Обновляем график
      this.$refs["water-chart"].$data._chart.update();
    },
    tariffs: async function () {
      let periods
      try {
        periods = await api.periodsIndex()
      } catch (e) {
        if (e.name === 'AuthError') {
          this.$store.state.authError = true
        } else if (e.name === 'ConnectionError') {
          this.$store.state.connectionError = true
        }
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

      for (const period of periods.data) { // TODO: Переписать на асинхронную обработку
        let tariff
        try {
          tariff = await api.tariffsIndex(period.id)
        } catch (e) {
          if (e.name === 'AuthError') {
            this.$store.state.authError = true
          } else if (e.name === 'ConnectionError') {
            this.$store.state.connectionError = true
          } else if (e.name === 'NotFoundError') {
            period.tariff = {cost: 0}
            continue
          }
          return
        }

        period.tariff = tariff.data
      }

      for (const {begin_date, tariff} of periods.data) {
        const date = new Date(begin_date)

        if (date.getFullYear() === nowYear && date.getMonth() === nowMonth) {
          this.nowTariff = tariff.cost
        }
        if (date.getFullYear() === nowYear && date.getMonth() <= nowMonth) {
          data[date.getMonth()] = tariff ? Number(tariff.cost) : 0
        } else if (date.getFullYear() === nowYear - 1 && date.getMonth() > nowMonth) {
          data[date.getMonth()] = tariff ? Number(tariff.cost) : 0
        }
      }

      // Записываем сначала прошедший год, а затем настоящий
      labels = labels.slice(nowMonth + 1).concat(labels.slice(0, nowMonth + 1))
      data = data.slice(nowMonth + 1).concat(data.slice(0, nowMonth + 1))

      this.$set(this.tariffsData.datasets[0], 'data', data)
      this.$set(this.tariffsData, 'labels', labels)

      this.tariffsDataLoaded = true

      // Обновляем график
      this.$refs["tariff-chart"].$data._chart.update();

      if (this.nowTariff === 0) {
        // Берём тариф за предыдущий период
        try {
          const period = await api.periodsViewOrStore(nowYear, nowMonth) // nowMonth Хранит месяц в Java формате (т.е. 0..11), а сервер - в человеческом
          const tariff = await api.tariffsIndex(period.data.id)
          this.calculateDialogCost = tariff.data.cost
        } catch (e) {
          console.error(e)
          console.warn("Не удалось получить цену на воду за предыдущий период")
        }
      } else {
        this.calculateDialogCost = this.nowTariff
      }
    },
  },
  beforeCreate() {
    this.$store.commit('resetUpdates')
  },
  mounted() {
    this.residents()
    this.periods()
    this.tariffs()
  }
}
</script>

<style scoped lang="scss">

</style>
