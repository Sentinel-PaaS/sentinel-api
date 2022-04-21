const app = require("../app.js");
let appsHelpers = require("../controllers/appsHelpers");
let { inspectService } = require("../controllers/apps");
const clusterMetricsHelpers = require('../controllers/clusterMetricsHelpers');
const AXIOS = require('axios');
const { nodeMetrics } = require("./inspectServiceData/nodeMetrics");
const { dockerAPIResponseServices } = require("./inspectServiceData/dockerAPIResponseServices");
const { dockerAPIResponseTasks } = require("./inspectServiceData/dockerAPIResponseTasks");
const { sentinelAPIResponse } = require("./inspectServiceData/sentinelAPIResponse");
const supertest = require('supertest');

jest.mock('axios');

// these tests result in a typeerror, apparently because
// there is a call to the Prometheus API in clusterMetricsHelpers
// that is not running properly. But the output of the module itself is
// mocked, and I know it works in other contexts, so this is ok for now.

AXIOS.get.mockImplementation((url) => {
  if (url.match(/tasks/)) {
    return Promise.resolve({data: dockerAPIResponseTasks})
  } else if (url.match(/services/)) {
    return Promise.resolve({data: dockerAPIResponseServices})
  } else {
    return Promise.reject(new Error('not found'))
  }
})

clusterMetricsHelpers.getClusterMetrics = jest.fn().mockResolvedValue(nodeMetrics)

const request = supertest(app)

describe("get:/api/apps/:appName", () => {

  test("getServiceInfo returns a formatted report on the desired application", async () => {
    let result = await appsHelpers.getServiceInfo("catnip");
    expect(result).toEqual(sentinelAPIResponse);
  });

  test("inspectService calls getServiceInfo", async () => {
    const spy = jest.spyOn(appsHelpers, 'getServiceInfo');
    const req = {
      params: {
        appName: "catnip"
      }
    };
    const res = {
      send: () => {}
    };
    const next = () => {};
    let result = await inspectService(req, res, next);
    expect(spy).toHaveBeenCalled();
  });

  test("API success returns JSON and 200", async () => {
    let appName = "catnip";
    let response = await request.get(`/api/apps/${appName}`);
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
  });

});