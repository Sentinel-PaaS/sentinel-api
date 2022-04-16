// don't rename the service anything else but "node-exporter"

const AXIOS = require('axios');
const HTTPS = require('https');

async function getDiskSpaceFree(managerIP, agent) {
  let data = await AXIOS.get(`http://${managerIP}:9090/api/v1/query`, {
  params: {
    query: "node_filesystem_avail_bytes"
  },
  httpsAgent: agent
  });
  let diskBytesFree = data.data.data.result.map(record => {
    return {
      instance: record.metric.instance,
      diskBytesFree: record.value[1]
    }
  });
  return diskBytesFree;
}

async function getDiskSpaceTotal(managerIP, agent) {
  data = await AXIOS.get(`http://${managerIP}:9090/api/v1/query`, {
  params: {
    query: "node_filesystem_size_bytes"
  },
  httpsAgent: agent
  });
  let diskBytesTotal = data.data.data.result.map(record => {
    return {
      instance: record.metric.instance,
      diskBytesTotal: record.value[1]
    }
  });
  return diskBytesTotal;
}

async function getCpuUsageLast5(managerIP, agent) {
  data = await AXIOS.get(`http://${managerIP}:9090/api/v1/query`, {
  params: {
    // query: "sum(rate(node_cpu{mode!=\"idle\",mode!=\"iowait\",mode!~\"^(?:guest.*)$\"}[5m])) BY (instance)"
    query: "sum by (instance) (irate(node_cpu_seconds_total{mode!=\"idle\",mode!=\"iowait\"}[10m]) * 100)"
  },
  httpsAgent: agent
  });
  let cpuUsage = data.data.data.result.map(record => {
    return {
      instance: record.metric.instance,
      cpuUsagePercentage: Number(record.value[1]).toFixed(2) + "%"
    }
  })
  return cpuUsage;
}

async function getTotalMemory(managerIP, agent) {
  data = await AXIOS.get(`http://${managerIP}:9090/api/v1/query`, {
  params: {
    query: "node_memory_MemTotal_bytes"
  },
  httpsAgent: agent
  });
  let memoryBytesTotal = data.data.data.result.map(record => {
    return {
      instance: record.metric.instance,
      memoryBytesTotal: record.value[1]
    }
  })
  return memoryBytesTotal;
}

async function getFreeMemory(managerIP, agent) {
  data = await AXIOS.get(`http://${managerIP}:9090/api/v1/query`, {
  params: {
    query: "node_memory_MemFree_bytes"
  },
  httpsAgent: agent
  });
  let memoryBytesFree = data.data.data.result.map(record => {
    return {
      instance: record.metric.instance,
      memoryBytesFree: record.value[1]
    }
  });
  return memoryBytesFree;
}

async function getRawMetrics(managerIP, agent) {
  let metrics = await getDiskSpaceFree(managerIP, agent);
  let diskBytesTotal = await getDiskSpaceTotal(managerIP, agent);
  
  metrics.map(record1 => {
    diskBytesTotal.forEach(record2 => {
      if (record1.instance === record2.instance) {
        record1.diskBytesTotal = record2.diskBytesTotal;
      }
    })
  })
  
  let cpuUsage = await getCpuUsageLast5(managerIP, agent);
  
  metrics.map(record1 => {
    cpuUsage.forEach(record2 => {
      if (record1.instance === record2.instance) {
        record1.cpuUsagePercentage = record2.cpuUsagePercentage;
      }
    })
  })
  
  // could calculate the percentage memory free in one query with `100 - (100 * node_memory_MemFree_bytes / node_memory_MemTotal_bytes)`
  
  let memoryBytesTotal = await getTotalMemory(managerIP, agent);
  
  metrics.map(record1 => {
    memoryBytesTotal.forEach(record2 => {
      if (record1.instance === record2.instance) {
        record1.memoryBytesTotal = record2.memoryBytesTotal;
      }
    })
  })
  
  let memoryBytesFree = await getFreeMemory(managerIP, agent);
  
  metrics.map(record1 => {
    memoryBytesFree.forEach(record2 => {
      if (record1.instance === record2.instance) {
        record1.memoryBytesFree = record2.memoryBytesFree;
      }
    })
  })

  return metrics;
};

function formatMetrics(metrics) {
  function convertBytesToGB(bytesValue) {
    let gbValue = (Number(bytesValue) / (1000 * 1000 * 1000)).toFixed(2);
    return gbValue;
  }
  
  metrics = metrics.map(record => {return {
    instance: record.instance,
    cpuUsagePercentage: record.cpuUsagePercentage,
    diskSpace: `${convertBytesToGB(record.diskBytesFree)}GB free out of ${convertBytesToGB(record.diskBytesTotal)}GB`,
    memorySpace: `${convertBytesToGB(record.memoryBytesFree)}GB free out of ${convertBytesToGB(record.memoryBytesTotal)}GB`
  }}
  )

  return metrics;
}

async function getClusterNodes(managerIP) {
  let nodes = await AXIOS.get(`http://${managerIP}:2375/nodes`);

  nodes = nodes.data.map(node => {
    return {
      Role: node.Spec.Role,
      Availability: node.Spec.Availability,
      // internal address does not correspond to service address given by node exporter
      // if we named the nodes themselves, we might be able to match this up
      InternalAddr: node.Status.Addr,
      NodeID: node.ID
    };
  });

  return nodes;
}

async function getNodeExporterTaskAddresses(managerIP) {
  let tasks = await AXIOS.get(`http://${managerIP}:2375/tasks`);
  tasks = tasks.data.filter(record => record.Spec.Networks[0].Aliases[0] === "node-exporter");
  tasks = tasks.map(record => {
    return {
      NodeID: record.NodeID,
      TaskAddress: record.NetworksAttachments[1].Addresses[0]
    }
  });
  return tasks;
}

function appendNodeExporterTaskAddressToMetrics(metrics, tasks) {
  metrics.forEach(record => {
    tasks.forEach(task => {
      let regex = /.*(?=[/:])/
      //console.log(task.TaskAddress.match(regex)[0], record.instance.match(regex)[0]);
      if (task.TaskAddress.match(regex)[0] === record.instance.match(regex)[0]) {
        record.NodeID = task.NodeID
      }
    })
  });
}

function appendMetricsToNodes(metrics, nodes) {
  nodes.forEach(node => {
    metrics.forEach(metric => {
      if (metric.NodeID === node.NodeID) {
        node.diskSpace = metric.diskSpace,
        node.memorySpace = metric.memorySpace,
        node.cpuUsageAvgLast10Minutes = metric.cpuUsagePercentage
      }
    })
  })
}

function formatNodesWithMetrics(nodes) {
  nodes = nodes.map(node => {
    return {
      Role: node.Role,
      Availability: node.Availability,
      NodeID: node.NodeID,
      DiskSpace: node.diskSpace,
      MemorySpace: node.memorySpace,
      cpuUsageAvgLast10Minutes: node.cpuUsageAvgLast10Minutes
    }
  })
  return nodes;
}

async function getClusterMetrics(managerIP) {
  const agent = new HTTPS.Agent({  
    rejectUnauthorized: false
  });

  try {
    let nodes = await getClusterNodes(managerIP);

    let metrics = await getRawMetrics(managerIP, agent);
    metrics = formatMetrics(metrics);
  
    let nodeExporterTasks = await getNodeExporterTaskAddresses(managerIP);
  
    // able to correlate node ids via the tasks address, and the instance associated with each node-exporter metric
  
    appendNodeExporterTaskAddressToMetrics(metrics, nodeExporterTasks);
    appendMetricsToNodes(metrics, nodes);
    let result = formatNodesWithMetrics(nodes);
  
    return result;
  } catch(err) {
    console.log(err);
  }
}

module.exports = {
  getClusterMetrics
}