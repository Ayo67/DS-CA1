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

// lambdas/getAircraftById.ts
var getAircraftById_exports = {};
__export(getAircraftById_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(getAircraftById_exports);
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

// lambdas/getAircraftById.ts
var handler = async (event, context) => {
  try {
    console.log("Event:", JSON.stringify(event));
    const airlineId = event.pathParameters?.airlineId;
    const aircraftId = event.pathParameters?.aircraftId;
    if (!airlineId) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          message: "Missing required path parameter",
          missing: "airlineId"
        })
      };
    }
    const airlineIdNum = parseInt(airlineId);
    if (aircraftId) {
      const aircraftIdNum = parseInt(aircraftId);
      const params = {
        TableName: process.env.TABLE_NAME,
        Key: {
          airlineId: airlineIdNum,
          aircraftId: aircraftIdNum
        }
      };
      const commandOutput = await ddbDocClient.send(new import_lib_dynamodb2.GetCommand(params));
      if (!commandOutput.Item) {
        return {
          statusCode: 404,
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ message: "Aircraft not found" })
        };
      }
      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          message: "Successfully retrieved aircraft",
          aircraft: commandOutput.Item
        })
      };
    } else {
      const queryParams = {
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: "airlineId = :airlineId",
        ExpressionAttributeValues: {
          ":airlineId": airlineIdNum
        }
      };
      const queryOutput = await ddbDocClient.send(new import_lib_dynamodb2.QueryCommand(queryParams));
      if (!queryOutput.Items || queryOutput.Items.length === 0) {
        return {
          statusCode: 404,
          headers: {
            "content-type": "application/json"
          },
          body: JSON.stringify({ message: "No aircraft found for this airline" })
        };
      }
      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          message: "Successfully retrieved all aircraft for airline",
          count: queryOutput.Items.length,
          aircraft: queryOutput.Items
        })
      };
    }
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        message: "Failed to retrieve aircraft",
        errorMsg: error.message,
        errorStack: error.stack
      })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
