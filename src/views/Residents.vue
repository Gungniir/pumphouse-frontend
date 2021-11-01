<template>
  <v-container fluid class="fill-height">
    <v-row class="fill-height overflow-hidden">
      <v-col cols="1" class="d-flex flex-column align-center">
        <div style="width: 100%;">
          <router-link to="/dashboard">
            <v-img
                class="mb-14"
                :src="require('../assets/logo-small.png')"
            />
          </router-link>
        </div>
        <v-btn icon large class="mb-10" to="/residents">
          <v-icon>mdi-account-group</v-icon>
        </v-btn>
        <v-btn icon large class="mb-10">
          <v-icon>mdi-file-document</v-icon>
        </v-btn>
        <v-btn icon large class="mb-10">
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
          <v-col>
            <v-card>
              <v-card-title>
                <v-row>
                  <v-col>ФИО</v-col>
                  <div class="pl-14"/>
                  <v-col align="center">Дата подключения</v-col>
                  <v-col align="center">Площадь участка (в сотках)</v-col>
                  <div style="padding-left: 60px"/>
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
        <v-list v-if="residentsLoaded" style="background: inherit">
          <residents-row v-for="resident of residents" :key="resident.id" :resident="resident"/>
        </v-list>
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
      </v-col>
      <v-col cols="1">
        <div class="d-flex flex-column align-center fill-height">
          <v-icon x-large color="accent">mdi-account-circle</v-icon>
          <span style="font-size: 13px">Администратор</span>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import api from "@/api";
import ResidentsRow from "@/components/ResidentsRow";

export default {
  // todo: loading animation
  name: "Residents",
  components: {ResidentsRow},
  data: () => ({
    authError: false,
    connectionError: false,

    residents: [],
    residentsLoaded: false,
  }),
  computed: {},
  methods: {
    loadResidents: async function () {
      const residents = await api.residentsIndex();

      if (residents === null) {
        this.connectionError = true
        return
      }

      if (residents === false) {
        this.authError = true
        return
      }

      this.residents = residents.data.sort((a, b) => a.fio.toLowerCase().localeCompare(b.fio.toLowerCase()))
      this.residentsLoaded = true
    }
  },
  mounted() {
    this.loadResidents()
  }

}
</script>

<style scoped lang="scss">

</style>
