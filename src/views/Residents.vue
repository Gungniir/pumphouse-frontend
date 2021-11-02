<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>
            <v-row>
              <v-col>ФИО</v-col>
              <div class="pl-14"/>
              <v-col align="center">Дата подключения</v-col>
              <v-col align="center">Площадь участка (в сотках)</v-col>
              <div style="width: 32px"/>
            </v-row>
          </v-card-title>
          <v-card-subtitle style="font-size: 0.8em">
            <div style="border-top: 1px solid #BEBEBE; padding-top: 4px; margin-top: 12px">ДАЧНИКИ
              ({{ residents.length }})
            </div>
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-if="residentsLoaded" >
      <v-col>
        <v-list style="background: inherit">
          <residents-row v-for="resident of residents" :key="resident.id" :resident="resident"/>
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
import ResidentsRow from "@/components/ResidentsRow";

export default {
  name: "Residents",
  components: {ResidentsRow},
  data: () => ({
    residents: [],
    residentsLoaded: false,
  }),
  methods: {
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
    }
  },
  computed: {
    updateResidents: function() {
      return this.$store.state.updateResidents
    },
  },
  watch: {
    updateResidents: function (value) {
      if (!value) return
      this.$store.state.updateResidents = false

      this.residentsLoaded = false
      this.loadResidents()
    },
  },
  beforeCreate() {
    this.$store.commit('resetUpdates')
  },
  mounted() {
    this.loadResidents()
  }
}
</script>
