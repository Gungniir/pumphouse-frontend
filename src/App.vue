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
            <app-dialog-new-resident @close="residentDialog = false"/>
          </v-dialog>
          <v-dialog
              v-model="calculateDialog"
              max-width="400"
          >
            <app-dialog-calculate v-if="calculateDialog" @close="calculateDialog = false"/>
          </v-dialog>
          <v-dialog
              v-model="tariffDialog"
              width="400"
          >
            <app-dialog-tariff @close="tariffDialog = false"/>
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
import AppDialogNewResident from "@/components/AppDialogNewResident";
import AppDialogCalculate from "@/components/AppDialogCalculate";
import AppDialogTariff from "@/components/AppDialogTariff";

export default {
  name: 'App',
  components: {AppDialogTariff, AppDialogCalculate, AppDialogNewResident},
  data: () => ({
    fab: false,

    residentDialog: false,

    calculateDialog: false,

    tariffDialog: false,
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
  },
};
</script>
