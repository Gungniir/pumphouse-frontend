import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';
// import colors from 'vuetify/lib/util/colors'

Vue.use(Vuetify);

export default new Vuetify({
    theme: {
        themes: {
            light: {
                background: "#E5E5E5",
                primary: "#626DB7",
                accent: "#626DB7",
            },
        },
    },
});
