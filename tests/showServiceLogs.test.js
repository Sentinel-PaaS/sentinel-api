const app = require("../app.js");
let { showServiceLogs } = require("../controllers/apps");
let appsHelpers = require("../controllers/appsHelpers");
const AXIOS = require('axios');
const {dockerAPIResponse, sentinelAPIResponse} = require("./showServiceLogsData/showServiceLogsData");
const supertest = require('supertest')

jest.mock('axios');

AXIOS.get.mockResolvedValue({
  data: dockerAPIResponse
});

const request = supertest(app)

describe("get:api/apps/:appName/logs", () => {

  test("getServiceLogs returns logs as received from API", async () => {
    let result = await appsHelpers.getServiceLogs();
    expect(result).toEqual(sentinelAPIResponse);
  });

  test("showServiceLogs calls getServiceLogs", async () => {
    const spy = jest.spyOn(appsHelpers, 'getServiceLogs');
    const req = {
      params: {
        appName: "catnip_production"
      }
    };
    const res = {
      send: () => {},
      set: () => {}
    };
    const next = () => {};
    let result = await showServiceLogs(req, res, next);
    expect(spy).toHaveBeenCalled();
  });

  test("API success returns JSON and 200", async () => {
    let appName = "catnip_production";
    let response = await request.get(`/api/apps/${appName}/logs`).set('Accept', 'text/html');
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toEqual(expect.stringContaining('text/html'));
  });
})