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

// lambdas/deleteAircraft.ts
var deleteAircraft_exports = {};
__export(deleteAircraft_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(deleteAircraft_exports);
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

// lambdas/deleteAircraft.ts
var handler = async (event) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));
    const airlineId = event.pathParameters?.airlineId;
    const aircraftId = event.pathParameters?.aircraftId;
    if (!airlineId || !aircraftId) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ message: "Missing airlineId or aircraftId in path" })
      };
    }
    const airlineIdNum = Number(airlineId);
    const aircraftIdNum = Number(aircraftId);
    if (isNaN(airlineIdNum) || isNaN(aircraftIdNum)) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ message: "airlineId and aircraftId must be numbers" })
      };
    }
    await ddbDocClient.send(
      new import_lib_dynamodb2.DeleteCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          airlineId: airlineIdNum,
          aircraftId: aircraftIdNum
        }
      })
    );
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ message: "Aircraft deleted successfully" })
    };
  } catch (error) {
    console.error("[ERROR]", JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ message: "Failed to delete aircraft", error: error.message })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
