<template>
  <v-card :loading="calculateDialogLoadingFull">
    <v-btn
        absolute
        top
        right
        icon
        @click="$emit('close')"
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
</template>

<script>
import api from "@/api";

export default {
  name: "AppDialogCalculate",
  data: () => ({
    calculateDialogCost: 0,
    calculateDialogCostPrevious: false, // Тариф взят с предыдущего периода
    calculateDialogCostChanged: false,
    calculateDialogRecord: 0,
    calculateDialogLoading: false,
    calculateDialogValid: false,
    calculateDialogTariffChecked: false,

    billsAreGeneratedForCurrentPeriod: false,
    billsDataLoaded: false,

    rules: {
      required: value => !!value || 'Обязательное поле',
      greaterThanZero: value => value > 0 || 'Число должно быть положительным',
    }
  }),
  computed: {
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
  methods: {
    calculate: async function () {
      this.calculateDialogLoading = true

      // Получаем или создаём период
      let period
      try {
        period = await api.periodsViewOrStore((new Date()).getFullYear(), (new Date()).getMonth() + 1)
      } catch (e) {
        if (e.name === 'AuthError') {
          this.$store.state.authError = true
        } else if (e.name === 'ConnectionError') {
          this.$store.state.connectionError = true
        }
        this.calculateDialogLoading = false
        this.$emit('close')
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
          this.$store.state.authError = true
        } else if (e.name === 'ConnectionError') {
          this.$store.state.connectionError = true
        }
        this.calculateDialogLoading = false
        this.$emit('close')
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
          this.$store.state.authError = true
        } else if (e.name === 'ConnectionError') {
          this.$store.state.connectionError = true
        }
        console.error(e)
        this.calculateDialogLoading = false
        this.$emit('close')
        return
      }

      // Запускаем расчет
      try {
        await api.periodsCalculate(period.data.id)
      } catch (e) {
        if (e.name === 'AuthError') {
          this.$store.state.authError = true
        } else if (e.name === 'ConnectionError') {
          this.$store.state.connectionError = true
        }
        console.error(e)
        this.calculateDialogLoading = false
        this.$emit('close')
        return
      }

      this.calculateDialogLoading = false
      this.$emit('close')
    },
    checkBills: async function () {
      try {
        const period = await api.periodsViewOrStore((new Date()).getFullYear(), (new Date()).getMonth() + 1)
        const bills = await api.billsIndexPeriod(period.data.id)

        this.billsAreGeneratedForCurrentPeriod = bills.length > 0
        this.billsDataLoaded = true
      } catch (e) {
        if (e.name === "AuthError") {
          this.$store.state.authError = true
        } else if (e.name === "ConnectionError") {
          this.$store.state.connectionError = true
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
          this.$store.state.authError = true
        } else if (e.name === "ConnectionError") {
          this.$store.state.connectionError = true
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
          this.$store.state.authError = true
        } else if (e.name === "ConnectionError") {
          this.$store.state.connectionError = true
        } else if (e.name !== 'NotFoundError') {
          console.error(e)
          return
        }
      }

      this.calculateDialogTariffChecked = true
    },
  },
  mounted() {
    this.checkBills()
    this.checkTariff()
  }
}
</script>
