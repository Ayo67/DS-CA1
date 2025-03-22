#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ApiStack } from "../lib/api-stack";
import { DatabaseStack } from "../lib/database-stack";
import { LambdaStack } from "../lib/lambda-stack"; // Assuming you'll create this

const app = new cdk.App();
const region = "eu-west-1";

if(app.node.tryGetContext("useMultiStack") === "true") {
    // Create the database stack first
    const databaseStack = new DatabaseStack(app, "DatabaseStack", {
        env: { region: region },
        airlinesTable: "AirlinesTable", // Fixed property name
    });

    // Create Lambda functions stack that depends on the database
    const lambdaStack = new LambdaStack(app, "LambdaStack", {
        env: { region: region },
        airlinesTable: databaseStack.airlinesTable,
    });

    // Create API stack that depends on Lambda functions
    new ApiStack(app, "ApiStack", {
        env: { region: region },
        lambdaFunctions: lambdaStack.functions, // Pass Lambda functions from LambdaStack
        apiKeyName: "airlines-api-key",
        stageName: app.node.tryGetContext("stage") || "dev",
    });
} else {
    // Single stack implementation if preferred
    // This would combine all resources into a single stack
    // Implement this if needed
    console.log("Using single stack approach. Not implemented yet.");
}

