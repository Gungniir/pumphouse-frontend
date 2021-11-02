<template>
  <v-app :style="{background: $vuetify.theme.themes[theme].background}">
    <v-main>
      <template v-if="$route.name !== 'Auth'">
        <v-container fluid class="fill-height">
          <v-row class="fill-height overflow-hidden">
            <v-col cols="1" class="d-flex flex-column align-center">
              <div style="width: 100%;">
                <router-link to="/dashboard">
                  <v-img
                      class="mb-14"
                      :src="require('./assets/logo-small.png')"
                  />
                </router-link>
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
              <v-alert color="error" v-if="connectionError">Не удалось подключиться к серверу. Обновите страницу.
              </v-alert>
              <v-alert color="error" class="d-flex justify-space-between" v-if="authError">
                Вы не авторизованы
                <v-btn color="accent" to="/auth">Войти</v-btn>
              </v-alert>
              <router-view/>
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
                <v-alert color="error" v-if="billsDataLoaded && billsAreGeneratedForCurrentPeriod">Чеки на текущий
                  период уже
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
      <template v-else>
        <router-view/>
      </template>
    </v-main>
  </v-app>
</template>

<script>

import api from "@/api";

export default {
  name: 'App',

  data: () => ({
    fab: false,
    residentDialog: false,
    residentDialogFIO: "",
    residentDialogArea: 0,
    residentDialogLoading: false,
    residentDialogValid: false,

    calculateDialog: false,
    calculateDialogCost: 0,
    calculateDialogCostPrevious: false, // Тариф взят с предыдущего периода
    calculateDialogCostChanged: false,
    calculateDialogRecord: 0,
    calculateDialogLoading: false,
    calculateDialogValid: false,
    calculateDialogTariffChecked: false,

    tariffDialog: false,
    tariffDialogValid: false,
    tariffDialogMonth: `${(new Date()).getFullYear()}-${((new Date()).getMonth() + 1)}`,
    tariffDialogCost: 0,
    tariffDialogLoading: false,

    billsAreGeneratedForCurrentPeriod: false,
    billsDataLoaded: false,

    rules: {
      required: value => !!value || 'Обязательное поле',
      greaterThanZero: value => value > 0 || 'Число должно быть положительным',
    }
  }),
  computed: {
    connectionError: function () {
      return this.$store.state.connectionError
    },
    authError: function () {
      return this.$store.state.authError
    },
    theme() {
      return (this.$vuetify.theme.dark) ? 'dark' : 'light'
    },
    calculateDialogCostShowWarning: function () {
      return this.calculateDialogTariffChecked && this.calculateDialogCostPrevious && !this.calculateDialogCostChanged
    },
    calculateDialogDisabled: function () {
      return this.calculateDialogLoadingFull || this.billsAreGeneratedForCurrentPeriod
    },
    calculateDialogLoadingFull: function () {
      return !this.calculateDialogTariffChecked || !this.billsDataLoaded || this.calculateDialogLoading
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
          }
        } catch (e) {
          if (e.name !== 'NotFoundError') {
            // noinspection ExceptionCaughtLocallyJS
            throw e
          }
          // Тарифа нет, нужно создать
          await api.tariffsStore(period.data.id, Number(this.calculateDialogCost))
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
          }
        } catch (e) {
          if (e.name !== 'NotFoundError') {
            // noinspection ExceptionCaughtLocallyJS
            throw e
          }
          // Record нет, нужно создать
          await api.recordsStore(period.data.id, Number(this.calculateDialogRecord))
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

      this.checkBills()
    },
    checkBills: async function () {
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
    checkTariff: async function () {
      // Проверяем, установлен ли тариф на текущий период
      let tariff

      try {
        const period = await api.periodsViewOrStore((new Date()).getFullYear(), (new Date()).getMonth() + 1)
        tariff = await api.tariffsIndex(period.data.id)

        this.calculateDialogCost = Number(tariff.data.cost)
        this.calculateDialogTariffChecked = true
        return
      } catch (e) {
        if (e.name === "AuthError") {
          this.authError = true
        } else if (e.name === "ConnectionError") {
          this.connectionError = true
        } else if (e.name !== 'NotFoundError') {
          console.error(e)
          return
        }
      }

      // Тариф не найден, берем предыдущий тариф

      try {
        const period = await api.periodsViewOrStore((new Date()).getFullYear(), (new Date()).getMonth())
        tariff = await api.tariffsIndex(period.data.id)

        this.calculateDialogCost = Number(tariff.data.cost)
        this.calculateDialogCostPrevious = true
        this.calculateDialogTariffChecked = true
        return
      } catch (e) {
        if (e.name === "AuthError") {
          this.authError = true
        } else if (e.name === "ConnectionError") {
          this.connectionError = true
        } else if (e.name !== 'NotFoundError') {
          console.error(e)
          return
        }
      }

      this.calculateDialogTariffChecked = true
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
    if (this.$route.name !== 'Auth') {
      this.checkBills()
      this.checkTariff()
    }
  }
};
</script>
