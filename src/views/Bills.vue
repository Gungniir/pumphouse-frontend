<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>
            <v-row>
              <v-col>ФИО</v-col>
              <div class="pl-14"/>
              <v-menu
                  v-model="monthDialogOpened"
                  offset-y
                  :close-on-content-click="false"
                  max-width="300"
              >
                <template #activator="{on, attrs}">
                  <v-col align="center">
                    Месяц
                    <v-btn icon x-small v-on="on" v-bind="attrs">
                      <v-icon>mdi-chevron-down</v-icon>
                    </v-btn>

                  </v-col>
                </template>
                <v-card>
                  <v-card-text>
                    <v-form>
                      <v-date-picker
                          v-model="picker"
                          @input="selectNewPeriod"
                          type="month"
                          full-width
                          locale="ru"
                      />
                    </v-form>
                  </v-card-text>
                </v-card>
              </v-menu>
              <v-col align="center">Итог в рублях</v-col>
              <div style="width: 32px"/>
            </v-row>
          </v-card-title>
          <v-card-subtitle style="font-size: 0.8em">
            <div style="border-top: 1px solid #BEBEBE; padding-top: 4px; margin-top: 12px">ЧЕКИ
              ({{ residentsWithBill.length }})
            </div>
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-if="billsLoaded && residentsLoaded">
      <v-col>
        <v-list style="background: inherit">
          <bills-row
              v-for="residentWithBill of residentsWithBill"
              :key="residentWithBill.bill.id"
              :bill="residentWithBill.bill"
              :resident="residentWithBill.resident"
              :period="period"
              @reload="reload"
              @error="processError"
          />
        </v-list>
      </v-col>
    </v-row>
    <v-row v-else style="height: 50vh">
      <v-col class="fill-height d-flex justify-center align-center">
        <v-progress-circular
            size="100"
            width="5"
            indeterminate
            color="accent"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import api from "@/api";
import BillsRow from "@/components/BillsRow";

export default {
  name: "Bills",
  components: {BillsRow},
  data: () => ({
    monthDialogOpened: false,
    picker: '',

    authError: false,
    connectionError: false,

    period: {},
    periodLoaded: false,

    residents: [],
    residentsLoaded: false,

    bills: [],
    billsLoaded: false,
  }),
  computed: {
    residentsWithBill: function () {
      return this.residents.map(resident => ({
        resident,
        bill: this.bills.find(({resident_id}) => resident_id === resident.id)
      })).filter(({bill}) => !!bill)
    },
    updateBills: function() {
      return this.$store.state.updateBills
    },
  },
  methods: {
    loadPeriod: async function () {
      try {
        const year = this.picker ? Number(this.picker.split('-')[0]) : (new Date()).getFullYear()
        const month = this.picker ? Number(this.picker.split('-')[1]) : (new Date()).getMonth() + 1

        const periodResponse = await api.periodsViewOrStore(year, month)
        this.period = periodResponse.data
      } catch (e) {
        if (e.name === "ConnectionError") {
          this.$store.state.connectionError = true
        } else if (e.name === "AuthError") {
          this.$store.state.authError = true
        }
        console.error(e)
      }
    },
    loadBills: async function () {
      try {
        this.bills = await api.billsIndexPeriod(this.period.id)
        this.billsLoaded = true
      } catch (e) {
        if (e.name === "ConnectionError") {
          this.$store.state.connectionError = true
        } else if (e.name === "AuthError") {
          this.$store.state.authError = true
        }
        console.error(e)
      }
    },
    loadResidents: async function () {
      const residents = await api.residentsIndex();

      if (residents === null) {
        this.$store.state.connectionError = true
        return
      }

      if (residents === false) {
        this.$store.state.authError = true
        return
      }

      this.residents = residents.data.sort((a, b) => a.fio.toLowerCase().localeCompare(b.fio.toLowerCase()))
      this.residentsLoaded = true
    },
    selectNewPeriod: function () {
      this.monthDialogOpened = false
      this.residentsLoaded = false
      this.periodLoaded = false
      this.billsLoaded = false

      this.loadPeriod().then(() => {
        this.loadBills()
      })
      this.loadResidents()
    },
    reload: function () {
      this.selectNewPeriod()
    },
    processError: function (e) {
      if (e.name === "ConnectionError") {
        this.$store.state.connectionError = true
      } else if (e.name === "AuthError") {
        this.$store.state.authError = true
      }
      console.error(e)
    }
  },
  watch: {
    updateBills: function (value) {
      if (!value) return
      this.$store.state.updateBills = false

      this.periodLoaded = false
      this.residentsLoaded = false
      this.billsLoaded = false

      this.loadPeriod().then(() => {
        this.loadBills()
      })
      this.loadResidents()
    },
  },
  beforeCreate() {
    this.$store.commit('resetUpdates')
  },
  mounted() {
    this.loadPeriod().then(() => {
      this.loadBills()
    })
    this.loadResidents()
  }

}
</script>

<style scoped lang="scss">

</style>
