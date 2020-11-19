<script>
import Vue from 'vue';
import { VueIplusSample } from '@/entry';

export default Vue.extend({
  name: 'ServeDev',
  components: {
    VueIplusSample,
  }
});
</script>

<template>
  <div id="app">
    <vue-iplus-sample />
  </div>
</template>
