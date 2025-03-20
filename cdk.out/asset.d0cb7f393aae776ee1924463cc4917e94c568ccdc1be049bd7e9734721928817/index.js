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
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var ddbDocClient = createDDbDocClient();
var handler = async (event, context) => {
  try {
    console.log("Event: ", JSON.stringify(event));
    const airlineId = event.pathParameters?.airlineId;
    if (!airlineId) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ Message: "Missing airlineId parameter" })
      };
    }
    const queryParams = event.queryStringParameters || {};
    const { destination, capacity } = queryParams;
    const params = {
      TableName: process.env.TABLE_NAME,
      IndexName: "CapacityIndex",
      ExpressionAttributeValues: {
        ":airlineId": parseInt(airlineId)
      }
    };
    if (capacity) {
      params.KeyConditionExpression = "airlineId = :airlineId AND capacity >= :capacity";
      params.ExpressionAttributeValues[":capacity"] = parseInt(capacity);
    } else {
      params.KeyConditionExpression = "airlineId = :airlineId";
    }
    let filterExpressions = [];
    if (destination) {
      filterExpressions.push("destination = :destination");
      params.ExpressionAttributeValues[":destination"] = destination;
    }
    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(" AND ");
    }
    const commandOutput = await ddbDocClient.send(new import_lib_dynamodb.QueryCommand(params));
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
function createDDbDocClient() {
  const ddbClient = new import_client_dynamodb.DynamoDBClient({ region: process.env.REGION });
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
