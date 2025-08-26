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
          {{ n.metadata.name }} — Ready: {{ isReady(n) ? 'yes' : 'no' }}
        </option>
      </select>
    </div>

    <!-- Selected node details -->
    <div v-if="selectedNode" class="mt-4">
      <h3>Details for node: {{ selectedNode.metadata.name }}</h3>
      <ul>
        <li>
          🖥️ <strong>{{ selectedNode.metadata.name }}</strong>
          — Ready: {{ isReady(selectedNode) ? 'yes' : 'no' }}
          <span v-if="selectedNode.status.nodeInfo">
            ({{ selectedNode.status.nodeInfo.kubeletVersion }})
          </span>
        </li>
      </ul>

      <!-- Install Ollama button -->
      <button 
        @click="installOllama"
        :disabled="installing"
        class="bg-blue-600 text-white p-2 rounded mt-2"
      >
        {{ installing ? 'Installing...' : 'Install Ollama on Selected Node' }}
      </button>
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
import jsyaml from 'js-yaml';

export default {
  data() {
    return {
      clusters: [],
      nodesByCluster: {},
      selectedCluster: null,
      selectedNode: null,
      installing: false
    };
  },

  async created() {
    try {
      const res = await this.$store.dispatch('management/findAll', {
        type: MANAGEMENT.CLUSTER
      });
      this.clusters = res || [];

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
      this.selectedNode = null;
    }
  },

  methods: {
    isReady(node) {
      const cond = node.status?.conditions?.find(c => c.type === "Ready");
      return cond?.status === "True";
    },

    async getDefaultProject(clusterId) {
      const projects = await this.$store.dispatch('rancher/findAll', {
      type: 'project',
      opt: { url: `/v3/clusters/${clusterId}/projects` }
    });
      return projects[0];
    },

    async installOllama() {
      if (!this.selectedCluster || !this.selectedNode) return;

      this.installing = true;

      try {
        const project = await this.getDefaultProject(this.selectedCluster.id);
        if (!project) {
          alert('No project found in the selected cluster.');
          this.installing = false;
          return;
        }

        const helmValues = {
          replicaCount: 1,
          image: {
            repository: 'ollama/ollama',
            tag: 'latest'
          },
          nodeSelector: {
            "kubernetes.io/hostname": this.selectedNode.metadata.name
          },
          resources: {
            limits: {
              cpu: "2",
              memory: "4Gi"
            }
          }
        };

        const valuesYaml = jsyaml.dump(helmValues);

        const appResource = {
          type: 'apps.project.cattle.io.app',
          metadata: {
            name: 'ollama',
            namespace: project.id.split(':')[1] // Get just the namespace part
          },
          spec: {
            externalId: 'catalog://?catalog=stable&template=ollama&version=latest',
            projectName: project.id,
            targetNamespace: 'ollama', // optional: change if needed
            valuesYaml
          }
        };

        await this.$store.dispatch('management/create', {
          type: 'apps.project.cattle.io.app',
          resource: appResource
        });

        alert('Ollama chart installed successfully!');
      } catch (err) {
        console.error('Failed to install Ollama chart:', err);
        alert('Failed to install Ollama chart, check console.');
      } finally {
        this.installing = false;
      }
    }
  }
};
</script>
