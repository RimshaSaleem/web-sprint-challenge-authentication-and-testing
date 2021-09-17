const server = require("./server");
const request = require("supertest");
const db = require("../data/dbConfig");

// Write your tests here
test('sanity', () => {
  expect(true).toBe(true);
})

beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
});
beforeEach(async () => {
  await db("users").truncate();
});
afterAll(async () => {
  await db.destroy();
});

it('check process.env.NODE_ENV is "testing" ', () => {
  expect(process.env.NODE_ENV).toBe("testing");
});
describe("checking auth endpoints", () => {
  describe("[POST] /api/auth/register", () => {
    it(" checking if new user can be creates in database", async () => {
    const res = await request(server).post("/api/auth/register").send({
      username: "rimsha",
      password: "123",
      });
      expect(res.body).toMatchObject({ id: 1, username: "rimsha" });
    });

    it(" checking response with proper message if username is taken", async () => {
      const user1 = await request(server).post("/api/auth/register").send({
      username: "rimsha",
      password: "123",
      });
      expect(user1.body).toMatchObject({ id: 1, username: "rimsha" });
      const user2 = await request(server).post("/api/auth/register").send({
      username: "rimsha",
      password: "123",
      });
      expect(user2.body.message).toMatch(/username taken/);
    });
  });

  
  describe("[POST] /api/auth/login", () => {
    let res;

  beforeEach(async () => {
      await request(server).post("/api/auth/register").send({
      username: "rimsha",
      password: "123",
      });
    });

   it(" user must be login with correct user name and password", async () => {
      res = await request(server).post("/api/auth/login").send({
        username: "rimsha",
        password: "123",
      });
      expect(res.body.message).toMatch(/welcome, rimsha/);
    });

    it("checking if username is incorrect it will response will error message", async () => {
      res = await request(server).post("/api/auth/login").send({
      username: "anzalna",
      password: "123",
      });
      expect(res.body.message).toMatch(/invalid credentials/);
    });
  });

  describe("[GET] /api/jokes", () => {
    it("checking response with jokes if token is correct", async () => {
      await request(server).post("/api/auth/register").send({
      username: "anzalna",
      password: "123",
      });
      let res = await request(server).post("/api/auth/login").send({
      username: "anzalna",
      password: "123",
      });
      const theToken = res.body.token;
      res = await request(server)
        .get("/api/jokes")
        .set({ Authorization: theToken });
      expect(res.body[1]).toMatchObject({
        id: "08EQZ8EQukb",
        joke:
          "Did you hear about the guy whose whole left side was cut off? He's all right now.",
      });
    });

    it(" checking invalid message on wrong token", async () => {
      const theToken = "link";
      const res = await request(server)
        .get("/api/jokes")
        .set({ Authorization: theToken });
      expect(res.body.message).toMatch(/token invalid/);
    });
  });
});
