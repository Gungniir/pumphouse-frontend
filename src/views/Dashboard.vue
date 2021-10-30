<template>
  <v-container fluid class="fill-height">
    <v-row class="fill-height">
      <v-col cols="1" class="d-flex flex-column align-center">
        <div style="width: 100%;">
          <v-img
              class="mb-14"
              :src="require('../assets/logo-small.png')"
          />
        </div>
        <v-btn icon large class="mb-10">
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
        <v-row>
          <v-col cols="6">
            <v-card height="250">
              <v-card-text style="height: 100%">
                <residents-chart style="height: 100%; width: 100%"/>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="1">
        <div class="d-flex flex-column align-center">
          <v-icon x-large color="accent">mdi-account-circle</v-icon>
          <span style="font-size: 13px">Администратор</span>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import ResidentsChart from "@/components/ResidentsChart";

export default {
  name: "Dashboard",
  components: {ResidentsChart}
}
</script>

<style scoped lang="scss">

</style>
