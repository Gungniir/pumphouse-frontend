<template>
  <v-container fluid class="fill-height">
    <v-row class="fill-height overflow-hidden">
      <v-col cols="1" class="d-flex flex-column align-center">
        <div style="width: 100%;">
          <v-img
              class="mb-14"
              :src="require('../assets/logo-small.png')"
          />
        </div>
        <v-btn icon large class="mb-10" to="/residents">
          <v-icon>mdi-account-group</v-icon>
        </v-btn>
        <v-btn icon large class="mb-10" to="/bills">
          <v-icon>mdi-file-document</v-icon>
        </v-btn>
        <v-btn icon large class="mb-10" @click="tariffDialog = true">
          <v-icon>mdi-currency-usd</v-icon>
        </v-btn>
      </v-col>
      <v-col cols="10">
        <v-alert color="error" v-if="connectionError">Не удалось подключиться к серверу. Обновите страницу.</v-alert>
        <v-alert color="error" class="d-flex justify-space-between" v-if="authError">
          Вы не авторизованы
          <v-btn color="accent" to="/auth">Войти</v-btn>
        </v-alert>
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
      </v-col>
      <v-col cols="1">
        <div class="d-flex flex-column align-center fill-height">
          <v-icon x-large color="accent">mdi-account-circle</v-icon>
          <span style="font-size: 13px">Администратор</span>
          <v-speed-dial
              v-model="fab"
              fixed
              bottom
              right
          >
            <template v-slot:activator>
              <v-btn
                  v-model="fab"
                  color="accent"
                  fab
              >
                <v-icon v-if="fab">
                  mdi-close
                </v-icon>
                <v-icon v-else>
                  mdi-plus
                </v-icon>
              </v-btn>
            </template>
            <v-tooltip left>
              <template #activator="{attrs, on}">
                <v-btn
                    fab
                    dark
                    small
                    color="green"
                    v-on="on"
                    v-bind="attrs"
                    @click="residentDialog = true"
                >
                  <v-icon>mdi-account-plus</v-icon>
                </v-btn>
              </template>
              <span>Добавить дачника</span>
            </v-tooltip>
            <v-tooltip
                left
            >
              <template #activator="{attrs, on}">
                <v-btn
                    fab
                    dark
                    small
                    color="indigo"
                    v-bind="attrs"
                    v-on="on"
                    @click="calculateDialog = true"
                >
                  <v-icon>mdi-text-box-plus</v-icon>
                </v-btn>
              </template>
              <span>Рассчитать чеки</span>
            </v-tooltip>
          </v-speed-dial>
        </div>
      </v-col>
    </v-row>
    <v-dialog
        v-model="residentDialog"
        max-width="400"
    >
      <v-card :loading="residentDialogLoading">
        <v-btn
            absolute
            top
            right
            icon
            @click="residentDialog = false"
            :disabled="residentDialogLoading"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-card-title class="d-flex align-center justify-center mb-10 pt-10">Новый дачник</v-card-title>
        <v-card-text class="pb-10">
          <v-form v-model="residentDialogValid" ref="resident-form">
            <v-text-field
                label="ФИО"
                outlined
                placeholder="Иванов Иван Иванович"
                v-model="residentDialogFIO"
                :disabled="residentDialogLoading"
                :rules="[rules.required]"
            ></v-text-field>
            <v-text-field
                label="Площадь огорода (в сотках)"
                outlined
                placeholder="30.2"
                v-model="residentDialogArea"
                type="number"
                :disabled="residentDialogLoading"
                :rules="[rules.required, rules.greaterThanZero]"
            ></v-text-field>
          </v-form>
          <v-btn large block color="accent" @click="addResident"
                 :disabled="residentDialogLoading || !residentDialogValid">Добавить
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog
        v-model="calculateDialog"
        max-width="400"
    >
      <v-card :loading="calculateDialogLoadingFull">
        <v-btn
            absolute
            top
            right
            icon
            @click="calculateDialog = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-card-title class="d-flex align-center justify-center mb-10 pt-10">Генерация чеков</v-card-title>
        <v-card-text class="pb-10">
          <v-alert color="error" v-if="billsDataLoaded && billsAreGeneratedForCurrentPeriod">Чеки на текущий период уже
            сгенерированы. Чтобы продолжить, сначала удалите их.
          </v-alert>
          <v-form v-model="calculateDialogValid" ref="calculate-form">
            <v-text-field
                class="mb-2"
                label="Тариф на текущий месяц"
                outlined
                placeholder="44.2"
                v-model="calculateDialogCost"
                :disabled="calculateDialogDisabled"
                :rules="[rules.required, rules.greaterThanZero]"
                @input="calculateDialogCostChanged = true"
                :messages="calculateDialogCostShowWarning ? 'Тариф на текущий месяц не был установлен. Значение было выбрано на основе предыдущего периода. Будьте внимательны!' : ''"
            >
              <template #message="{message}" v-if="!calculateDialogCostChanged">
                <v-icon x-small color="error" left>mdi-alert-circle-outline</v-icon>
                <span class="error--text">{{ message }}</span>
              </template>
            </v-text-field>
            <v-text-field
                label="Показания счётчика"
                outlined
                placeholder="70.8"
                v-model="calculateDialogRecord"
                type="number"
                :disabled="calculateDialogDisabled"
                :rules="[rules.required, rules.greaterThanZero]"
            ></v-text-field>
          </v-form>
          <v-btn large block color="accent" @click="calculate"
                 :disabled="calculateDialogDisabled || !calculateDialogValid">Сгенерировать
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog
        v-model="tariffDialog"
        width="400"
    >
      <v-card :loading="tariffDialogLoading">
        <v-btn
            absolute
            top
            right
            icon
            @click="tariffDialog = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-card-title class="d-flex align-center justify-center mb-10 pt-10">Тариф</v-card-title>
        <v-card-text class="pb-10">
          <v-form v-model="tariffDialogValid" ref="tariff-dialog">
            <v-menu max-width="352">
              <template #activator="{on, attrs}">
                <v-text-field
                    label="Период"
                    outlined
                    :value="tariffDialogMonth | onlyMonth"
                    readonly
                    v-on="on"
                    v-bind="attrs"
                />
              </template>
              <v-date-picker
                  v-model="tariffDialogMonth"
                  :disabled="tariffDialogLoading"
                  no-title
                  type="month"
                  locale="ru"
                  full-width
              />
            </v-menu>
            <v-text-field
                v-model="tariffDialogCost"
                :rules="[rules.required, rules.greaterThanZero]"
                outlined
                label="Тариф"
            />
          </v-form>
          <v-btn
              :disabled="tariffDialogLoading || !tariffDialogValid"
              color="accent"
              large
              block
              @click="setTariff"
          >
            Уставноить тариф
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
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
    fab: false,
    residentDialog: false,
    residentDialogFIO: "",
    residentDialogArea: 0,
    residentDialogLoading: false,
    residentDialogValid: false,

    calculateDialog: false,
    calculateDialogCost: 0,
    calculateDialogCostChanged: false,
    calculateDialogRecord: 0,
    calculateDialogLoading: false,
    calculateDialogValid: false,

    tariffDialog: false,
    tariffDialogValid: false,
    tariffDialogMonth: `${(new Date()).getFullYear()}-${((new Date()).getMonth() + 1)}`,
    tariffDialogCost: 0,
    tariffDialogLoading: false,

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

    billsAreGeneratedForCurrentPeriod: false,
    billsDataLoaded: false,

    authError: false,
    connectionError: false,
    rules: {
      required: value => !!value || 'Обязательное поле',
      greaterThanZero: value => value > 0 || 'Площадь должна быть положительной',
    }
  }),
  computed: {
    calculateDialogCostShowWarning: function () {
      return this.tariffsDataLoaded && this.nowTariff === 0 && !this.calculateDialogCostChanged
    },
    calculateDialogDisabled: function () {
      return this.calculateDialogLoadingFull || this.billsAreGeneratedForCurrentPeriod
    },
    calculateDialogLoadingFull: function () {
      return !this.tariffsDataLoaded || !this.billsDataLoaded || this.calculateDialogLoading
    }
  },
  filters: {
    onlyMonth: function (value) {
      const date = new Date(value)

      const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

      return `${months[date.getMonth()]} ${date.getFullYear()}`
    }
  },
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
    periods: async function () {
      let records, periods
      try {
        records = await api.recordsIndex()
        periods = await api.periodsIndex()
      } catch (e) {
        if (e.name === 'AuthError') {
          this.authError = true
        } else if (e.name === 'ConnectionError') {
          this.connectionError = true
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
          this.authError = true
        } else if (e.name === 'ConnectionError') {
          this.connectionError = true
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
            this.authError = true
          } else if (e.name === 'ConnectionError') {
            this.connectionError = true
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
    addResident: async function () {
      this.residentDialogLoading = true

      const response = await api.residentsStore(this.residentDialogFIO, this.residentDialogArea)

      if (response === null) {
        this.connectionError = true
      } else if (response === false) {
        this.authError = true
      } else {
        this.residentsDataLoaded = false
        this.residents()
      }

      this.$refs["resident-form"].reset()
      this.residentDialogLoading = false
      this.residentDialog = false
    },
    calculate: async function () {
      this.calculateDialogLoading = true

      // Получаем или создаём период
      let period
      try {
        period = await api.periodsViewOrStore((new Date()).getFullYear(), (new Date()).getMonth() + 1)
      } catch (e) {
        if (e.name === 'AuthError') {
          this.authError = true
        } else if (e.name === 'ConnectionError') {
          this.connectionError = true
        }
        this.calculateDialogLoading = false
        this.calculateDialog = false
        return
      }

      // Устанавливаем тариф
      try {
        // Получаем текущий тариф
        let tariff
        try {
          tariff = await api.tariffsIndex(period.data.id)

          // Тариф есть. Если он отличается, нужно изменить
          if (Number(tariff.data.cost).toFixed(2) !== Number(this.calculateDialogCost).toFixed(2)) {
            await api.tariffsUpdate(tariff.data.id, Number(this.calculateDialogCost))

            this.tariffsDataLoaded = false
            this.tariffs()
          }
        } catch (e) {
          if (e.name !== 'NotFoundError') {
            // noinspection ExceptionCaughtLocallyJS
            throw e
          }
          // Тарифа нет, нужно создать
          await api.tariffsStore(period.data.id, Number(this.calculateDialogCost))

          this.tariffsDataLoaded = false
          this.tariffs()
        }
      } catch (e) {
        console.error(e)
        if (e.name === 'AuthError') {
          this.authError = true
        } else if (e.name === 'ConnectionError') {
          this.connectionError = true
        }
        this.calculateDialogLoading = false
        this.calculateDialog = false
        return
      }

      // Устанавливаем record
      try {
        // Получаем текущий Record
        let record
        try {
          record = await api.recordsIndexPeriod(period.data.id)
          console.log(record)

          // Record есть. Если он отличается, нужно изменить
          if (Number(record.data.amount_volume).toFixed(2) !== Number(this.calculateDialogRecord).toFixed(2)) {
            await api.recordsUpdate(period.data.id, record.data.id, Number(this.calculateDialogRecord))

            this.recordsDataLoaded = false
            this.periods()
          }
        } catch (e) {
          if (e.name !== 'NotFoundError') {
            // noinspection ExceptionCaughtLocallyJS
            throw e
          }
          // Record нет, нужно создать
          await api.recordsStore(period.data.id, Number(this.calculateDialogRecord))

          this.recordsDataLoaded = false
          this.periods()
        }
      } catch (e) {
        if (e.name === 'AuthError') {
          this.authError = true
        } else if (e.name === 'ConnectionError') {
          this.connectionError = true
        }
        console.error(e)
        this.calculateDialogLoading = false
        this.calculateDialog = false
        return
      }

      // Запускаем расчет
      try {
        await api.periodsCalculate(period.data.id)
      } catch (e) {
        if (e.name === 'AuthError') {
          this.authError = true
        } else if (e.name === 'ConnectionError') {
          this.connectionError = true
        }
        console.error(e)
        this.calculateDialogLoading = false
        this.calculateDialog = false
        return
      }

      this.calculateDialogLoading = false
      this.calculateDialog = false

      this.bills()
    },
    // Провеяет, выпущены ли чеки для текущего периода (нужно для блокировки окна генерации)
    bills: async function () {
      try {
        const period = await api.periodsViewOrStore((new Date()).getFullYear(), (new Date()).getMonth() + 1)
        const bills = await api.billsIndexPeriod(period.data.id)

        this.billsAreGeneratedForCurrentPeriod = bills.length > 0
        this.billsDataLoaded = true
      } catch (e) {
        if (e.name === "AuthError") {
          this.authError = true
        } else if (e.name === "ConnectionError") {
          this.connectionError = true
        }
        console.error(e)
      }

    },
    setTariff: async function () {
      this.tariffDialogLoading = true

      const year = this.tariffDialogMonth ? Number(this.tariffDialogMonth.split('-')[0]) : (new Date()).getFullYear()
      const month = this.tariffDialogMonth ? Number(this.tariffDialogMonth.split('-')[1]) : (new Date()).getMonth() + 1

      let period

      try {
        period = (await api.periodsViewOrStore(year, month)).data
      } catch (e) {
        if (e.name === "ConnectionError") {
          this.connectionError = true
        } else if (e.name === "AuthError") {
          this.authError = true
        }
        console.error(e)
        return
      }

      try {
        await api.tariffsStore(period.id, Number(this.tariffDialogCost))
        // Успешно создано
        this.tariffDialog = false
        this.tariffDialogLoading = false
        this.$refs['tariff-dialog'].reset()
        this.tariffDialogMonth = `${(new Date()).getFullYear()}-${((new Date()).getMonth() + 1)}`
        this.tariffsDataLoaded = false
        this.tariffs()
        return
      } catch (e) {
        if (e.name === "ConnectionError") {
          this.connectionError = true
        } else if (e.name === "AuthError") {
          this.authError = true
        } else if (e.name !== "ConflictError") {
          console.error(e)
          return
        }
      }

      // Произошёл конфликт => Обновляем
      try {
        const tariff = (await api.tariffsIndex(period.id)).data
        await api.tariffsUpdate(tariff.id, Number(this.tariffDialogCost))

        // Всё успешно
        this.tariffDialog = false
        this.tariffDialogLoading = false
        this.$refs['tariff-dialog'].reset()
        this.tariffDialogMonth = `${(new Date()).getFullYear()}-${((new Date()).getMonth() + 1)}`
        this.tariffsDataLoaded = false
        this.tariffs()
      } catch (e) {
        if (e.name === "ConnectionError") {
          this.connectionError = true
        } else if (e.name === "AuthError") {
          this.authError = true
          console.error(e)
        }
      }
    }
  },
  mounted() {
    this.residents()
    this.periods()
    this.tariffs()
    this.bills()
  }

}
</script>

<style scoped lang="scss">

</style>
