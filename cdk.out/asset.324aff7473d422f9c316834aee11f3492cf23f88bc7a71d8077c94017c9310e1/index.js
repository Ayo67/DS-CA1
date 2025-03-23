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

// lambdas/getAirlineById.ts
var getAirlineById_exports = {};
__export(getAirlineById_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(getAirlineById_exports);
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

// lambdas/getAirlineById.ts
var handler = async (event, context) => {
  try {
    console.log("Event: ", JSON.stringify(event));
    const airlineId = event.pathParameters?.airlineId;
    const queryParams = event.queryStringParameters || {};
    const { international, capacity } = queryParams;
    let params;
    if (capacity) {
      params = {
        TableName: process.env.TABLE_NAME,
        IndexName: "CapacityIndex",
        // Using a GSI named "CapacityIndex"
        KeyConditionExpression: "#capacity = :capacity and airlineId = :airlineId",
        // Adding airlineId for GSI query
        ExpressionAttributeNames: {
          "#capacity": "capacity"
          // Alias for the reserved word "capacity"
        },
        ExpressionAttributeValues: {
          ":capacity": parseInt(capacity),
          ":airlineId": airlineId ? parseInt(airlineId) : void 0
          // Ensure airlineId is defined before parsing
        }
      };
    } else if (airlineId) {
      params = {
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: "airlineId = :airlineId",
        // Ensuring airlineId is included for primary key query
        ExpressionAttributeValues: {
          ":airlineId": airlineId ? parseInt(airlineId) : void 0
        }
      };
    } else {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ Message: "Missing required parameters: airlineId or capacity" })
      };
    }
    let filterExpressions = [];
    if (international) {
      filterExpressions.push("international = :international");
      params.ExpressionAttributeValues[":international"] = international;
    }
    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(" AND ");
    }
    const commandOutput = await ddbDocClient.send(new import_lib_dynamodb2.QueryCommand(params));
    console.log("QueryCommand response: ", commandOutput);
    if (!commandOutput.Items || commandOutput.Items.length === 0) {
      return {
        statusCode: 404,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ Message: "No results match the given filters" })
      };
    }
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        data: commandOutput.Items,
        count: commandOutput.Count
      })
    };
  } catch (error) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ error })
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
