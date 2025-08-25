<template>
  <div>
    <h2>Clusters & Nodes</h2>

    <!-- Cluster dropdown -->
    <div class="mb-4">
      <label for="clusterSelect">Select Cluster:</label>
      <select id="clusterSelect" v-model="selectedCluster" class="border rounded p-1 ml-2">
        <option disabled value="">Select a cluster</option>
        <option v-for="c in clusters" :key="c.id" :value="c">
          {{ c.id }} — {{ c.metadata?.state?.name || 'unknown' }}
        </option>
      </select>
    </div>

    <!-- Node dropdown -->
    <div v-if="selectedCluster" class="mb-4">
      <label for="nodeSelect">Select Node:</label>
      <select id="nodeSelect" v-model="selectedNode" class="border rounded p-1 ml-2">
        <option disabled value="">Select a node</option>
        <option 
          v-for="n in nodesByCluster[selectedCluster.id]" 
          :key="n.metadata.name" 
          :value="n"
        >
          {{ n.metadata.name }} — Ready: {{ isReady(n) ? '✅' : '❌' }}
        </option>
      </select>
    </div>

    <!-- Selected node details -->
    <div v-if="selectedNode" class="mt-4">
      <h3>Details for node: {{ selectedNode.metadata.name }}</h3>
      <ul>
        <li>
          🖥️ <strong>{{ selectedNode.metadata.name }}</strong>
          — Ready: {{ isReady(selectedNode) ? '✅' : '❌' }}
          <span v-if="selectedNode.status.nodeInfo">
            ({{ selectedNode.status.nodeInfo.kubeletVersion }})
          </span>
        </li>
      </ul>
    </div>

    <div v-else-if="selectedCluster && (!nodesByCluster[selectedCluster.id] || !nodesByCluster[selectedCluster.id].length)">
      No nodes found
    </div>

    <div v-else class="text-gray-500">
      Select a cluster to see its nodes
    </div>
  </div>
</template>

<script>
import { MANAGEMENT } from '@shell/config/types';

export default {
  data() {
    return {
      clusters: [],
      nodesByCluster: {},
      selectedCluster: null,  // store full cluster object
      selectedNode: null      // store full node object
    };
  },
  async created() {
    try {
      // Fetch all clusters
      const res = await this.$store.dispatch('management/findAll', {
        type: MANAGEMENT.CLUSTER
      });
      this.clusters = res || [];

      // Fetch nodes for all clusters in advance
      for (const cluster of this.clusters) {
        try {
          const res = await this.$store.dispatch('management/request', {
            url: `/k8s/clusters/${cluster.id}/v1/nodes`
          });
          const nodes = res?.data || [];
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
  watch: {
    selectedCluster() {
      // Reset selected node when cluster changes
      this.selectedNode = null;
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
