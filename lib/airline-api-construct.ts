import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { SeedConstructs } from "./seed-construct";

export interface AirlineAPIProps {
    tableName?: string;
    stageName?: string;
    apiKeyName?: string;
    enableSeed?: boolean;
}

export class AirlinesApiConstruct extends Construct {
    public readonly api: apigateway.RestApi;
    public readonly table: dynamodb.Table;
    public readonly apiKey: apigateway.ApiKey;
    public readonly getAirlineByIdFn: lambdanode.NodejsFunction;
    public readonly getAllAirlinesFn: lambdanode.NodejsFunction;
    public readonly addAirlineFn: lambdanode.NodejsFunction;
    public readonly deleteAirlineFn: lambdanode.NodejsFunction;
    public readonly deleteAircraftFn: lambdanode.NodejsFunction;
    public readonly getAircraftByIdFn: lambdanode.NodejsFunction;
    public readonly updateAircraftFn: lambdanode.NodejsFunction;
    public readonly airlineTranslationFn: lambdanode.NodejsFunction;
    public readonly seedAirlinesFn?: lambdanode.NodejsFunction;

    constructor(scope: Construct, id: string, props: AirlineAPIProps) {
        super(scope, id);

        // Create DynamoDB table
        this.table = new dynamodb.Table(this, "AirlinesTable", {
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            partitionKey: { name: "airlineId", type: dynamodb.AttributeType.NUMBER },
            sortKey: { name: "aircraftId", type: dynamodb.AttributeType.NUMBER },
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            tableName: props.tableName || "Airlines",
        });

        this.table.addGlobalSecondaryIndex({
            indexName: "CapacityIndex",
            partitionKey: { name: "airlineId", type: dynamodb.AttributeType.NUMBER },
            sortKey: { name: "capacity", type: dynamodb.AttributeType.NUMBER },
        });

        this.apiKey = new apigateway.ApiKey(this, "AirlinesApiKey", {
            apiKeyName: props.apiKeyName || "airlines-api-key2",
            description: "API Key for post and put operations",
            enabled: true,
        });

        // Common Lambda properties
        const commonLambdaProps = {
            architecture: lambda.Architecture.ARM_64,
            runtime: lambda.Runtime.NODEJS_18_X,
            timeout: cdk.Duration.seconds(15),
            memorySize: 128,
            environment: {
                TABLE_NAME: this.table.tableName,
                REGION: "eu-west-1",
            },
        };

        // Create Lambda functions
        this.getAirlineByIdFn = new lambdanode.NodejsFunction(this, "GetAirlineByIdFn", {
            ...commonLambdaProps,
            entry: `${__dirname}/../lambdas/getAirlineById.ts`,
        });

        this.getAllAirlinesFn = new lambdanode.NodejsFunction(this, "GetAllAirlinesFn", {
            ...commonLambdaProps,
            entry: `${__dirname}/../lambdas/getAllAirlines.ts`,
        });

        this.addAirlineFn = new lambdanode.NodejsFunction(this, "AddAirlineFn", {
            ...commonLambdaProps,
            entry: `${__dirname}/../lambdas/addAirline.ts`,
        });

        this.deleteAirlineFn = new lambdanode.NodejsFunction(this, "DeleteAirlineFn", {
            ...commonLambdaProps,
            entry: `${__dirname}/../lambdas/deleteAirline.ts`,
        });

        this.deleteAircraftFn = new lambdanode.NodejsFunction(this, "DeleteAircraftFn", {
            ...commonLambdaProps,
            entry: `${__dirname}/../lambdas/deleteAircraft.ts`,
        });

        this.getAircraftByIdFn = new lambdanode.NodejsFunction(this, "GetAircraftByIdFn", {
            ...commonLambdaProps,
            entry: `${__dirname}/../lambdas/getAircraftById.ts`,
        });

        this.updateAircraftFn = new lambdanode.NodejsFunction(this, "UpdateAircraftFn", {
            ...commonLambdaProps,
            entry: `${__dirname}/../lambdas/updateAircraft.ts`,
        });

        this.airlineTranslationFn = new lambdanode.NodejsFunction(this, "AirlineTranslationFn", {
            ...commonLambdaProps,
            entry: `${__dirname}/../lambdas/getTranslation.ts`,
        });

        this.seedAirlinesFn = new lambdanode.NodejsFunction(this, "SeedAirlinesFn", {
            ...commonLambdaProps,
            entry: `${__dirname}/../lambdas/seedAirline.ts`,
        });

        // Grant DynamoDB permissions to all functions
        this.table.grantReadWriteData(this.getAirlineByIdFn);
        this.table.grantReadWriteData(this.getAllAirlinesFn);
        this.table.grantReadWriteData(this.addAirlineFn);
        this.table.grantReadWriteData(this.deleteAirlineFn);
        this.table.grantReadWriteData(this.getAircraftByIdFn);
        this.table.grantReadWriteData(this.updateAircraftFn);
        this.table.grantReadWriteData(this.deleteAircraftFn);
        this.table.grantReadWriteData(this.airlineTranslationFn);

        // Add translation permissions
        const translatePolicy = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["translate:*"],
            resources: ["*"],
        });
        this.airlineTranslationFn.addToRolePolicy(translatePolicy);
       

        // Create API Gateway
        this.api = new apigateway.RestApi(this, "AirlinesApi", {
            description: "Airlines API",
            deployOptions: {
                stageName: props.stageName || "dev",
            },
            defaultCorsPreflightOptions: {
                allowHeaders: ["Content-Type", "X-Amz-Date", "airlines-api-key"],
                allowMethods: ["OPTIONS", "GET", "POST", "PUT", "DELETE"],
                allowCredentials: true,
                allowOrigins: ["*"],
            },
        });

        const usagePlan = new apigateway.UsagePlan(this, "AirlinesUsagePlan", {
            name: "AirlinesUsagePlan",
        });

        usagePlan.addApiStage({
            stage: this.api.deploymentStage,
        });

        usagePlan.addApiKey(this.apiKey);

        this.setupApiEndpoints();
    

    const enableSeed = props.enableSeed || false;
    if (enableSeed) {
        new SeedConstructs(this, "SeedConstructs", this.seedAirlinesFn);
    }

}

    private setupApiEndpoints() {
        // Create API endpoints
        const airlinesResource = this.api.root.addResource("airlines");
        
        // Airlines endpoints
        airlinesResource.addMethod("GET", new apigateway.LambdaIntegration(this.getAllAirlinesFn));
        airlinesResource.addMethod("POST", new apigateway.LambdaIntegration(this.addAirlineFn), {
            apiKeyRequired: true
        });

        // Single airline endpoint
        const singleAirlineResource = airlinesResource.addResource("{airlineId}");
        singleAirlineResource.addMethod("GET", new apigateway.LambdaIntegration(this.getAirlineByIdFn));
        singleAirlineResource.addMethod("DELETE", new apigateway.LambdaIntegration(this.deleteAirlineFn));

        // Aircraft endpoints
        const aircraftResource = singleAirlineResource.addResource("aircraft");
        
        // Single aircraft endpoint
        const singleAircraftResource = aircraftResource.addResource("{aircraftId}");
        singleAircraftResource.addMethod("GET", new apigateway.LambdaIntegration(this.getAircraftByIdFn));
        singleAircraftResource.addMethod("PUT", new apigateway.LambdaIntegration(this.updateAircraftFn));
        singleAircraftResource.addMethod("DELETE", new apigateway.LambdaIntegration(this.deleteAircraftFn));

        // Translation endpoint
        const translateResource = airlinesResource.addResource("translate");
        translateResource.addMethod("POST", new apigateway.LambdaIntegration(this.airlineTranslationFn));
    }
}