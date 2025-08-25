<template>
  <div>
    <h2>Clusters</h2>

    <ul>
      <li v-for="c in clusters" :key="c.id">
        <strong>{{ c.id }}</strong> — 
        <span :class="stateColor(c.metadata?.state)">
          {{ c.metadata?.state?.name || 'unknown' }}
          <span v-if="c.metadata?.state?.message">({{ c.metadata.state.message }})</span>
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
      const res = await this.$store.dispatch('management/findAll', {
        type: MANAGEMENT.CLUSTER
      });
      this.clusters = res || [];
      console.log('Clusters:', this.clusters);

      for (const cluster of this.clusters) {
        try {
          const nodes = await this.$store.dispatch('management/findAll', {
            type: MANAGEMENT.NODE,
            opt: { url: `/k8s/clusters/${cluster.id}/v1/nodes` }
          });

          // Vue 3: assign normally, then replace array to trigger reactivity
          cluster.nodes = nodes;
          this.clusters = [...this.clusters];
        } catch (err) {
          console.error(`Failed to fetch nodes for cluster ${cluster.id}`, err);
          cluster.nodes = [];
        }
      }

    } catch (err) {
      console.error('Failed to load clusters', err);
    }
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
