"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lambdas/seedAirline.ts
var seedAirline_exports = {};
__export(seedAirline_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(seedAirline_exports);
var import_lib_dynamodb2 = require("@aws-sdk/lib-dynamodb");

// shared/dynamodb-client.ts
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
function createDDbDocClient() {
  const ddbClient = new import_client_dynamodb.DynamoDBClient({ region: "eu-west-1" });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true
  };
  const unmarshallOptions = {
    wrapNumbers: false
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return import_lib_dynamodb.DynamoDBDocumentClient.from(ddbClient, translateConfig);
}
var ddbDocClient = createDDbDocClient();

// seed/airlines.ts
var airlines = [
  {
    airlineId: 1,
    aircraftId: 101,
    model: "Boeing 737",
    airlineName: "Delta Airlines",
    country: "United States",
    logo: "/logos/delta.png",
    slogan: "Keep Climbing",
    headQuarters: "Atlanta, Georgia, USA",
    website: "https://www.delta.com",
    established: "1929",
    popularity: 9.5,
    capacity: 800,
    international: true,
    description: "A major U.S. airline offering domestic and international flights.",
    destination: "New York, USA"
  },
  {
    airlineId: 1,
    aircraftId: 102,
    model: "Airbus A320",
    airlineName: "Delta Airlines",
    country: "United States",
    logo: "/logos/delta.png",
    slogan: "Keep Climbing",
    headQuarters: "Atlanta, Georgia, USA",
    website: "https://www.delta.com",
    established: "1929",
    popularity: 9.3,
    capacity: 800,
    international: true,
    description: "Known for its extensive domestic and international route network.",
    destination: "Los Angeles, USA"
  },
  {
    airlineId: 1,
    aircraftId: 103,
    model: "Boeing 767",
    airlineName: "Delta Airlines",
    country: "United States",
    logo: "/logos/delta.png",
    slogan: "Keep Climbing",
    headQuarters: "Atlanta, Georgia, USA",
    website: "https://www.delta.com",
    established: "1929",
    popularity: 9.4,
    capacity: 800,
    international: true,
    description: "Provides transatlantic and long-haul services.",
    destination: "Paris, France"
  },
  {
    airlineId: 2,
    aircraftId: 201,
    model: "Boeing 777",
    airlineName: "Emirates",
    country: "United Arab Emirates",
    logo: "/logos/emirates.png",
    slogan: "Fly Better",
    headQuarters: "Dubai, UAE",
    website: "https://www.emirates.com",
    established: "1985",
    popularity: 9.8,
    capacity: 260,
    international: true,
    description: "A luxury airline with world-class service based in Dubai.",
    destination: "London, UK"
  },
  {
    airlineId: 3,
    aircraftId: 301,
    model: "Airbus A350",
    airlineName: "Qatar Airways",
    country: "Qatar",
    logo: "/logos/qatar.png",
    slogan: "Going Places Together",
    headQuarters: "Doha, Qatar",
    website: "https://www.qatarairways.com",
    established: "1993",
    popularity: 9.7,
    capacity: 250,
    international: true,
    description: "A premium airline known for its excellent in-flight experience.",
    destination: "Doha, Qatar"
  },
  {
    airlineId: 4,
    aircraftId: 401,
    model: "Boeing 787 Dreamliner",
    airlineName: "Singapore Airlines",
    country: "Singapore",
    logo: "/logos/singapore.png",
    slogan: "A Great Way to Fly",
    headQuarters: "Singapore",
    website: "https://www.singaporeair.com",
    established: "1947",
    popularity: 9.6,
    capacity: 140,
    international: true,
    description: "Renowned for its top-tier service and premium cabin experience.",
    destination: "Singapore"
  },
  {
    airlineId: 5,
    aircraftId: 501,
    model: "Airbus A380",
    airlineName: "British Airways",
    country: "United Kingdom",
    logo: "/logos/british-airways.png",
    slogan: "To Fly. To Serve.",
    headQuarters: "London, England, UK",
    website: "https://www.britishairways.com",
    established: "1974",
    popularity: 9.2,
    capacity: 280,
    international: true,
    description: "A leading UK airline with a strong global presence.",
    destination: "Dubai, UAE"
  }
];

// lambdas/seedAirline.ts
async function sendResponse(event, status, data) {
  const responseBody = {
    Status: status,
    Reason: "See the details in CloudWatch Log Stream",
    PhysicalResourceId: event.LogicalResourceId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: data
  };
  console.log("Response Body:\n", JSON.stringify(responseBody));
  const https = require("https");
  const url = require("url");
  const parsedUrl = url.parse(event.ResponseURL);
  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: "PUT",
    headers: {
      "content-type": "",
      "content-length": JSON.stringify(responseBody).length
    }
  };
  return new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      console.log(`Status code: ${response.statusCode}`);
      resolve(null);
    });
    request.on("error", (error) => {
      console.log(`Send response failed: ${error}`);
      reject(error);
    });
    request.write(JSON.stringify(responseBody));
    request.end();
  });
}
var handler = async (event) => {
  try {
    console.log("Received event", JSON.stringify(event));
    if (event.RequestType === "Delete") {
      await sendResponse(event, "SUCCESS", { Message: "Resource deletion successful" });
      return;
    }
    const tableName = process.env.TABLE_NAME;
    if (!tableName) {
      throw new Error("TABLE_NAME environment variable is not set");
    }
    const batchItems = [];
    for (const airline of airlines) {
      batchItems.push({
        PutRequest: {
          Item: airline
        }
      });
    }
    const batchChunks = [];
    for (let i = 0; i < batchItems.length; i += 25) {
      batchChunks.push(batchItems.slice(i, i + 25));
    }
    console.log(`Seeding ${batchItems.length} airline records to ${tableName}`);
    for (const chunk of batchChunks) {
      const params = {
        RequestItems: {
          [tableName]: chunk
        }
      };
      await ddbDocClient.send(new import_lib_dynamodb2.BatchWriteCommand(params));
      console.log(`Seeded ${chunk.length} items to DynamoDB`);
    }
    console.log("Seeding completed successfully");
    await sendResponse(event, "SUCCESS", { Message: "Resource creation successful" });
  } catch (error) {
    console.error("Error during seeding:", error);
    await sendResponse(event, "FAILED", { Message: `Operation failed: ${error}` });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
