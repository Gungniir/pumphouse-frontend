<template>
  <v-list-item
      class="mb-1 bill-row"
  >
    <v-skeleton-loader
        v-if="!residentLoaded"
        type="list-item-avatar"
    />
    <v-list-item-avatar
        v-else
        :color="resident.fio | colorFromName"
        style="color: white"
    >{{ resident.fio | initials }}
    </v-list-item-avatar>
    <v-list-item-content class="justify-space-between">
      <v-row>
        <v-col>
          <v-skeleton-loader
              v-if="!residentLoaded"
              type="text"
          />
          <template v-else>
            {{ resident.fio }}
          </template>
        </v-col>
        <v-col align="center">
          <v-skeleton-loader
              v-if="!periodLoaded"
              type="text"
          />
          <template v-else>
            {{ period.begin_date | onlyMonth }}
          </template>
        </v-col>
        <v-col align="center">{{ Number(bill.amount_rub).toFixed(2) }}</v-col>
      </v-row>
    </v-list-item-content>
  </v-list-item>
</template>

<script>
export default {
  name: "ResidentsRow",
  data: () => ({
    residentLoaded: true,

    periodLoaded: true,
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
