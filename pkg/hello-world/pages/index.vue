<template>
  <div>
    <h2>Clusters</h2>

    <ul>
      <li v-for="c in clusters" :key="c.id">
        <div>
          <strong>{{ c.id }}</strong> — 
          <span :class="stateColor(c.metadata?.state)">
            {{ c.metadata?.state?.name || 'unknown' }}
            <span v-if="c.metadata?.state?.message">({{ c.metadata.state.message }})</span>
          </span>
        </div>

        <!-- Nodes -->
        <div v-if="nodesByCluster[c.id] && nodesByCluster[c.id].length" class="ml-4 mt-2">
          <h4>Nodes:</h4>
          <ul>
            <li v-for="n in nodesByCluster[c.id]" :key="n.metadata.name">
              🖥️ <strong>{{ n.metadata.name }}</strong>
              — Ready: {{ isReady(n) ? '✅' : '❌' }}
              <span v-if="n.status.nodeInfo">
                ({{ n.status.nodeInfo.kubeletVersion }})
              </span>
            </li>
          </ul>
        </div>

        <div v-else class="ml-4 mt-2 text-gray-500">
          No nodes found
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { MANAGEMENT } from '@shell/config/types';

export default {
  data() {
    return {
      clusters: [],
      nodesByCluster: {}
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
          const nodes = await this.$store.dispatch('management/request', {
            url: `/k8s/clusters/${cluster.id}/v1/nodes`
          });

          // Vue 3: reactivity-safe assignment
          this.nodesByCluster = { ...this.nodesByCluster, [cluster.id]: nodes };
        } catch (err) {
          console.error(`Failed to fetch nodes for cluster ${cluster.id}`, err);
          this.nodesByCluster = { ...this.nodesByCluster, [cluster.id]: [] };
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
    },
    isReady(node) {
      const cond = node.status?.conditions?.find(c => c.type === "Ready");
      return cond?.status === "True";
    }
  }
};
</script>
