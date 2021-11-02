<template>
  <v-card :loading="tariffDialogLoading">
    <v-btn
        absolute
        top
        right
        icon
        @click="$emit('close')"
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
</template>

<script>
import api from "@/api";

export default {
  name: "AppDialogTariff",
  data: () => ({
    tariffDialogValid: false,
    tariffDialogMonth: `${(new Date()).getFullYear()}-${((new Date()).getMonth() + 1)}`,
    tariffDialogCost: 0,
    tariffDialogLoading: false,

    rules: {
      required: value => !!value || 'Обязательное поле',
      greaterThanZero: value => value > 0 || 'Число должно быть положительным',
    }
  }),
  filters: {
    onlyMonth: function (value) {
      const date = new Date(value)

      const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

      return `${months[date.getMonth()]} ${date.getFullYear()}`
    }
  },
  methods: {
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
        this.$emit('close')
        this.tariffDialogLoading = false
        this.$refs['tariff-dialog'].reset()
        this.tariffDialogMonth = `${(new Date()).getFullYear()}-${((new Date()).getMonth() + 1)}`
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
        this.$emit('close')
        this.tariffDialogLoading = false
        this.$refs['tariff-dialog'].reset()
        this.tariffDialogMonth = `${(new Date()).getFullYear()}-${((new Date()).getMonth() + 1)}`
      } catch (e) {
        if (e.name === "ConnectionError") {
          this.connectionError = true
        } else if (e.name === "AuthError") {
          this.authError = true
        }
        console.error(e)
      }
    }
  },
}
</script>
