<template>
  <div>
    <h2>Install Ollama</h2>
    
    <label>Choose Node:</label>
    <select v-model="selectedNode">
      <option v-for="node in nodes" :key="node.id" :value="node.metadata.name">
        {{ node.metadata.name }}
      </option>
    </select>

    <button @click="installOllama">Install Ollama</button>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useStore } from '@shell/core/store';

const store = useStore();
const selectedNode = ref('');
const nodes = ref([]);

onMounted(async () => {
  nodes.value = await store.dispatch('management/findAll', { type: 'node' });
});

async function installOllama() {
  const helmValues = {
    nodeSelector: {
      "kubernetes.io/hostname": selectedNode.value
    }
  };

  await store.dispatch('management/create', {
    type: 'helm.cattle.io.clusterhelmchart',
    metadata: { name: 'ollama' },
    spec: {
      chart: 'ollama',
      repoName: 'myrepo',
      version: '1.0.0',
      targetNamespace: 'ollama',
      values: helmValues
    }
  });

  alert('Ollama installation triggered.');
}
</script>
