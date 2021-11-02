<template>
  <v-list-item
      class="mb-1 bill-row"

      @mouseenter="hover = true"
      @mouseleave="hover = false"
  >
    <v-list-item-avatar
        :color="resident.fio | colorFromName"
        style="color: white"
    >{{ resident.fio | initials }}
    </v-list-item-avatar>
    <v-list-item-content class="justify-space-between">
      <v-row>
        <v-col>
          {{ resident.fio }}
        </v-col>
        <v-col align="center">
          {{ period.begin_date | onlyMonth }}
        </v-col>
        <v-col align="center">{{ Number(bill.amount_rub).toFixed(2) }}</v-col>
      </v-row>
    </v-list-item-content>
    <v-list-item-action>
      <v-list-item-action-text>
        <template v-if="hover">
          <v-tooltip bottom>
            <template #activator="{attrs, on}">
              <v-btn
                  icon
                  small
                  class="mr-1"
                  v-on="on"
                  v-bind="attrs"
                  @click="dialog = true"
              >
                <v-icon>mdi-delete-outline</v-icon>
              </v-btn>
            </template>
            <span>Удалить чек</span>
          </v-tooltip>
        </template>
        <div v-else style="padding-left: 32px"/>
      </v-list-item-action-text>
    </v-list-item-action>
    <v-dialog
      v-model="dialog"
      width="700"
    >
      <v-card :loading="dialogLoading">
        <v-card-title>Вы действительно хотите удалить чек?</v-card-title>
        <v-card-text>
          <div>Чек выписан: {{ resident.fio }}</div>
          <div>Месяц: {{ period.begin_date | onlyMonth }}</div>
          <div>Стоимость: {{ Number(bill.amount_rub).toFixed(2) }}</div>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" :disabled="dialogLoading" @click="deleteOne">Удалить чек</v-btn>
          <v-btn outlined color="primary" :disabled="dialogLoading" @click="dialog = false">Назад</v-btn>
          <v-btn plain :disabled="dialogLoading" @click="deleteAll">Удалить все чеки за {{period.begin_date | onlyMonth}}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-list-item>
</template>

<script>
import api from "@/api";

export default {
  name: "ResidentsRow",
  data: () => ({
    hover: false,

    dialog: false,
    dialogLoading: false,
  }),
  props: {
    bill: {
      type: Object,
      required: true
    },
    period: {
      type: Object,
      required: true
    },
    resident: {
      type: Object,
      required: true
    }
  },
  filters: {
    initials: function (value) {
      return value.split(' ').slice(0, 2).map(item => item[0].toUpperCase()).join('')
    },
    /**
     * @param {string} value
     */
    colorFromName: function (value) {
      const partLength = Number((value.length / 3).toFixed(0))

      const parts = [value.substr(0, partLength), value.substr(partLength, partLength), value.substr(partLength * 2)]

      const partsNumeric = parts.map(item => {
        let code = 0
        for (const char of item) {
          code += char.charCodeAt(0)
        }
        return 100 + code % 128
      })

      return `rgb(${partsNumeric.join(',')})`
    },
    onlyMonth: function (value) {
      const date = new Date(value)

      const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

      return `${months[date.getMonth()]} ${date.getFullYear()}`
    }
  },
  methods: {
    deleteOne: async function() {
      this.dialogLoading = true

      try {
        await api.billsDestroy(this.bill.id)
      } catch (e) {
        this.$emit('error', e)
      }

      this.dialogLoading = false
      this.dialog = false

      this.$emit('reload')
    },
    deleteAll: async function() {
      this.dialogLoading = true

      try {
        await api.billsDestroyAllPeriod(this.period.id)
      } catch (e) {
        this.$emit('error', e)
      }

      this.dialogLoading = false
      this.dialog = false

      this.$emit('reload')
    },
  },
}
</script>

<style scoped lang="scss">
.bill-row {
  border-radius: 8px;
  background: white;

  &:hover {
    background: #BEBEBE;
  }
}
</style>
