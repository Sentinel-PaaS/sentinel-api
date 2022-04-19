const sentinelAPIResponse = {
    "hasCanary": false,
    "message": "For more information on app performance, visit the prometheus and grafana dashboards you have configured with SENTINEL METRICS, or inspect app logs with SENTINEL INSPECT LOGS. You can also view system level metrics for your compute instances with SENTINEL CLUSTER INSPECT.",
    "data": [
        {
            "serviceName": "catnip_production",
            "serviceReplicas": 2,
            "serviceTasks": [
                {
                    "taskStatus": "running",
                    "taskStatusTimestamp": "16/4/2022-17:03:44",
                    "taskSlot": 2,
                    "hostNodeMetrics": {
                        "diskSpace": "4.55GB free out of 8.58GB",
                        "memorySpace": "0.13GB free out of 1.01GB",
                        "cpuUsageAvgLast10Minutes": "1.60%"
                    }
                },
                {
                    "taskStatus": "running",
                    "taskStatusTimestamp": "16/4/2022-17:02:41",
                    "taskSlot": 1,
                    "hostNodeMetrics": {
                        "diskSpace": "4.55GB free out of 8.58GB",
                        "memorySpace": "0.13GB free out of 1.01GB",
                        "cpuUsageAvgLast10Minutes": "1.60%"
                    }
                }
            ]
        }
    ]
}

module.exports = {
  sentinelAPIResponse 
}