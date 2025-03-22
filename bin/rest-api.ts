#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ApiStack } from "../lib/api-stack";
import { DatabaseStack } from "../lib/database-stack";
import { LambdaStack } from "../lib/lambda-stack"; 
import { AirlinesApiConstruct } from "../lib/airline-api-construct";

const app = new cdk.App();
const region = "eu-west-1";

if(app.node.tryGetContext("useMultiStack") === "true") {
    // Create the database stack first
    const databaseStack = new DatabaseStack(app, "AirlineDatabaseStack", {
        env: { region: region },
        airlinesTable: "AirlinesTable"
    });

    
    const lambdaStack = new LambdaStack(app, "AirlinesLambdaStack", {
        env: { region: region },
        airlinesTable: databaseStack.airlinesTable,
        enableSeed: true
    });

    // Create API stack that depends on Lambda functions
    new ApiStack(app, "ApiStack", {
        env: { region: region },
        lambdaFunctions: lambdaStack.functions, // Pass Lambda functions from LambdaStack
        apiKeyName: "airlines-api-key",
        stageName: app.node.tryGetContext("stage") || "dev",
    });
} else {
    const stack = new cdk.Stack(app, "AirlineStack", {
        env: { region: region },
    });

    new AirlinesApiConstruct(stack, "AirlineAPI", {
        tableName: "AirlinesTable",
        stageName: "dev",
        apiKeyName: "airlines-api-key2",
        enableSeed: true
        
    });

}

