const request = require("supertest");
const { mockClient } = require("aws-sdk-client-mock");
const { DynamoDBDocumentClient, ScanCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client } = require("@aws-sdk/client-s3");

const dynamoMock = mockClient(DynamoDBDocumentClient);
const s3Mock = mockClient(S3Client);

const app = require("../src/server");

beforeEach(() => {
  dynamoMock.reset();
  s3Mock.reset();
});

describe("GET /pins", () => {
  it("tra ve danh sach pin dang rong", async () => {
    dynamoMock.on(ScanCommand).resolves({ Items: [] });

    const res = await request(app).get("/pins");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("tra ve danh sach pin co du lieu", async () => {
    const fakePin = { id: "1", title: "Ho Guom", lat: 21.03, lng: 105.85 };
    dynamoMock.on(ScanCommand).resolves({ Items: [fakePin] });

    const res = await request(app).get("/pins");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([fakePin]);
  });
});

describe("POST /pins", () => {
  it("tu choi khi thieu title", async () => {
    const res = await request(app)
      .post("/pins")
      .field("lat", "21.03")
      .field("lng", "105.85");

    expect(res.status).toBe(400);
  });

  it("tao pin moi khong kem anh", async () => {
    dynamoMock.on(PutCommand).resolves({});

    const res = await request(app)
      .post("/pins")
      .field("title", "Ho Guom")
      .field("description", "Trung tam Ha Noi")
      .field("lat", "21.03")
      .field("lng", "105.85");

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Ho Guom");
    expect(res.body.photoKey).toBeNull();
  });
});

describe("GET /health", () => {
  it("tra ve status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
