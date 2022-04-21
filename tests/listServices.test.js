const app = require("../app.js");
let { listServices } = require("../controllers/apps");
let appsHelpers = require("../controllers/appsHelpers");
const AXIOS = require('axios');
const {dockerAPIResponse, sentinelAPIResponse} = require("./listServicesData/listServicesData");
const supertest = require('supertest')

jest.mock('axios');

AXIOS.get.mockResolvedValue({
  data: dockerAPIResponse
});

const request = supertest(app)

describe("get:/api/apps/", () => {

  test("getServicesList returns a formatted list of applications", async () => {
    let result = await appsHelpers.getServicesList();
    expect(result).toEqual(sentinelAPIResponse);
  });

  test("listServices calls getServicesList", async () => {
    const spy = jest.spyOn(appsHelpers, 'getServicesList');
    const req = {};
    const res = {
      send: () => {}
    };
    const next = () => {};
    let result = await listServices(req, res, next);
    expect(spy).toHaveBeenCalled();
  });

  test("API success returns JSON and 200", async () => {
    let response = await request.get("/api/apps/");
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toEqual(expect.stringContaining('json'));
  });
})