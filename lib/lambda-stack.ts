import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export interface LambdaStackProps extends cdk.StackProps {
    airlinesTable: dynamodb.Table;
}

export class LambdaStack extends cdk.Stack {
    public readonly functions: {
        getAirlineByIdFn: lambdanode.NodejsFunction;
        getAllAirlinesFn: lambdanode.NodejsFunction;
        addAirlineFn: lambdanode.NodejsFunction;
        updateAirlineFn: lambdanode.NodejsFunction;
        deleteAirlineFn: lambdanode.NodejsFunction;
        deleteAircraftFn: lambdanode.NodejsFunction;
        getAircraftByIdFn: lambdanode.NodejsFunction;
        updateAircraftFn: lambdanode.NodejsFunction;
        airlineTranslationFn: lambdanode.NodejsFunction;
    };

    constructor(scope: Construct, id: string, props: LambdaStackProps) {
        super(scope, id, props);

        // Create Lambda execution role with DynamoDB permissions
        const lambdaRole = new iam.Role(this, "AirlinesLambdaRole", {
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
            ]
        });

        // Grant DynamoDB permissions to the role
        props.airlinesTable.grantReadWriteData(lambdaRole);

        // Common Lambda properties
        const commonLambdaProps = {
            runtime: lambda.Runtime.NODEJS_18_X,
            role: lambdaRole,
            timeout: cdk.Duration.seconds(10),
            memorySize: 256,
            environment: {
                AIRLINES_TABLE: props.airlinesTable.tableName,
            },
        };

        // Create Lambda functions
        this.functions = {
            getAirlineByIdFn: new lambdanode.NodejsFunction(this, "GetAirlineByIdFunction", {
                ...commonLambdaProps,
                entry: "lambda/getAirlineById.ts",
                handler: "handler",
            }),

            getAllAirlinesFn: new lambdanode.NodejsFunction(this, "GetAllAirlinesFunction", {
                ...commonLambdaProps,
                entry: "lambda/getAllAirlines.ts",
                handler: "handler",
            }),

            addAirlineFn: new lambdanode.NodejsFunction(this, "AddAirlineFunction", {
                ...commonLambdaProps,
                entry: "lambda/addAirline.ts",
                handler: "handler",
            }),

            updateAirlineFn: new lambdanode.NodejsFunction(this, "UpdateAirlineFunction", {
                ...commonLambdaProps,
                entry: "lambda/updateAirline.ts",
                handler: "handler",
            }),

            deleteAirlineFn: new lambdanode.NodejsFunction(this, "DeleteAirlineFunction", {
                ...commonLambdaProps,
                entry: "lambda/deleteAirline.ts",
                handler: "handler",
            }),

            getAircraftByIdFn: new lambdanode.NodejsFunction(this, "GetAircraftByIdFunction", {
                ...commonLambdaProps,
                entry: "lambda/getAircraftById.ts",
                handler: "handler",
            }),

            updateAircraftFn: new lambdanode.NodejsFunction(this, "UpdateAircraftFunction", {
                ...commonLambdaProps,
                entry: "lambda/updateAircraft.ts",
                handler: "handler",
            }),

            deleteAircraftFn: new lambdanode.NodejsFunction(this, "DeleteAircraftFunction", {
                ...commonLambdaProps,
                entry: "lambda/deleteAircraft.ts",
                handler: "handler",
            }),

            airlineTranslationFn: new lambdanode.NodejsFunction(this, "AirlineTranslationFunction", {
                ...commonLambdaProps,
                entry: "lambda/airlineTranslation.ts",
                handler: "handler",
            }),
        };
    }
}