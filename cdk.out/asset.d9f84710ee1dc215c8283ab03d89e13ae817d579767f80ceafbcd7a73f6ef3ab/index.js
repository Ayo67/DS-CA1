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

// lambdas/deleteAirline.ts
var deleteAirline_exports = {};
__export(deleteAirline_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(deleteAirline_exports);
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

// lambdas/deleteAirline.ts
var handler = async (event, context) => {
  try {
    console.log("[EVENT]", JSON.stringify(event));
    const airlineId = event.pathParameters?.airlineId;
    if (!airlineId) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ message: "Missing airline ID in path" })
      };
    }
    const airlineIdNum = Number(airlineId);
    if (isNaN(airlineIdNum)) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ message: "Airline ID must be a number" })
      };
    }
    const queryParams = {
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "airlineId = :airlineId",
      ExpressionAttributeValues: {
        ":airlineId": airlineIdNum
      }
    };
    const queryResult = await ddbDocClient.send(new import_lib_dynamodb2.QueryCommand(queryParams));
    if (!queryResult.Items || queryResult.Items.length === 0) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ message: "Airline not found" })
      };
    }
    for (const item of queryResult.Items) {
      await ddbDocClient.send(
        new import_lib_dynamodb2.DeleteCommand({
          TableName: process.env.TABLE_NAME,
          Key: {
            airlineId: airlineIdNum,
            aircraftId: item.aircraftId
          }
        })
      );
    }
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ message: "Airline deleted successfully" })
    };
  } catch (error) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ error })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
