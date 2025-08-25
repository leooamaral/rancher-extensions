<template>
  <div>
    <h2>Clusters</h2>

    <ul>
      <li v-for="c in clusters" :key="c.id">
        <strong>{{ c.id }}</strong> — 
        <span :class="stateColor(c.state)">
          {{ c.state?.name || 'unknown' }}
          <span v-if="c.state?.message">({{ c.state.message }})</span>
        </span>
      </li>
    </ul>
  </div>
</template>

<script>
import { MANAGEMENT } from '@shell/config/types';

export default {
  data() {
    return {
      clusters: []
    }
  },
  async created() {
    try {
      const res = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER, });
      this.clusters = res || [];

      // watch for live updates
      this.$store.dispatch('steve/watch', {
        type: 'cluster',
        watch: (event) => {
          const obj = event.object || event;
          if (!obj?.id) return;

          const idx = this.clusters.findIndex(c => c.id === obj.id);
          if (event.type === 'ADDED' || event.type === 'MODIFIED') {
            if (idx >= 0) {
              this.$set(this.clusters, idx, obj);
            } else {
              this.clusters.push(obj);
            }
          } else if (event.type === 'DELETED' && idx >= 0) {
            this.clusters.splice(idx, 1);
          }
        }
      });
    } catch (err) {
      console.error('Failed to load clusters', err);
    }
  },
  beforeDestroy() {
    this.$store.dispatch('steve/forgetType', 'cluster');
  },
  methods: {
    stateColor(state) {
      if (!state) return 'text-gray-600';
      if (state.name === 'active' && !state.error) return 'text-green-600';
      if (state.transitioning) return 'text-yellow-600';
      if (state.error) return 'text-red-600';
      return 'text-gray-600';
    }
  }
};
</script>
