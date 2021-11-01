<template>
  <v-list-item
      class="mb-1"
      :style="style"

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
        <v-col>{{ resident.fio }}</v-col>
        <v-col align="center">{{ resident.start_date | onlyDate}}</v-col>
        <v-col align="center">{{ Number(resident.area).toFixed(2) }}</v-col>
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
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </template>
            <span>Добавить аккаунт</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template #activator="{attrs, on}">
              <v-btn
                  icon
                  small
                  v-on="on"
                  v-bind="attrs"
                  :to="`/resident/${resident.id}`"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </template>
            <span>Редактровать дачника</span>
          </v-tooltip>
        </template>
        <div v-else style="padding-left: 60px"/>
      </v-list-item-action-text>
    </v-list-item-action>
  </v-list-item>
</template>

<script>
export default {
  name: "ResidentsRow",
  data: () => ({
    hover: false,
  }),
  computed: {
    style: function () {
      return `background: ${this.hover ? '#EAEAEA' : 'white'}; border-radius: 8px`
    }
  },
  props: {
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
    onlyDate: function (value) {
      const date = new Date(value)

      function leadingZero(a) {
        return (a > 9 ? `` : `0`) + a
      }

      return `${date.getFullYear()}.${leadingZero(date.getMonth() + 1)}.${leadingZero(date.getDate())}`
    }
  },
}
</script>

<style scoped>

</style>
