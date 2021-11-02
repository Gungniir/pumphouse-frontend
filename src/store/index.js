import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    authError: false,
    connectionError: false,

    updateTariffs: false,
    updateBills: false,
    updateResidents: false,
    updateRecords: false,
  },
  mutations: {
    resetUpdates: function(state) {
      state.updateTariffs = false
      state.updateBills = false
      state.updateResidents = false
      state.updateRecords = false
    }
  },
  actions: {
  },
  modules: {
  }
})
