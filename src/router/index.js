import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import(/* webpackChunkName: "auth" */ '../views/Auth.vue')
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import(/* webpackChunkName: "dashboard" */ '../views/Dashboard.vue')
  },
  {
    path: '/residents',
    name: 'Residents',
    component: () => import(/* webpackChunkName: "residents" */ '../views/Residents.vue')
  },
  {
    path: '/resident/:residentID',
    props: true,
    name: 'Resident',
    component: () => import(/* webpackChunkName: "resident" */ '../views/Resident.vue')
  },
  {
    path: '/bills',
    props: true,
    name: 'Bills',
    component: () => import(/* webpackChunkName: "bills" */ '../views/Bills.vue')
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
