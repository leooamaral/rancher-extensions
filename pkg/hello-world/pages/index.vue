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

        <!-- Show cluster nodes -->
        <ul class="ml-6 mt-2">
          <li v-for="n in c.nodes" :key="n.id">
            🖥️ <strong>{{ n.id }}</strong>
            — {{ n.status?.nodeInfo?.kubeletVersion || 'unknown version' }}
            <span v-if="n.status?.conditions">
              (Ready: {{
                (n.status.conditions.find(cond => cond.type === 'Ready') || {}).status
              }})
            </span>
          </li>
        </ul>
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
      const clusters = await this.$store.dispatch('management/findAll', {
        type: MANAGEMENT.CLUSTER
      });

      this.clusters = clusters;

      for (const c of this.clusters) {
        try {
          const nodes = await this.$store.dispatch('management/findAll', {
            type: MANAGEMENT.NODE,
            opt: { url: `/k8s/clusters/${c.id}/v1/nodes` }
          });
          this.$set(c, 'nodes', nodes);
        } catch (e) {
          console.warn(`Failed to fetch nodes for cluster ${c.id}`, e);
          this.$set(c, 'nodes', []);
        }
      }

      console.log('Clusters:', this.clusters);
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
