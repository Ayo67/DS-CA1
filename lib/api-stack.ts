import * as cdk from "aws-cdk-lib";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as apig from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

export interface ApiStackProps extends cdk.StackProps {
    lambdaFunctions: {
        getAirlineByIdFn: lambdanode.NodejsFunction;
        getAllAirlinesFn: lambdanode.NodejsFunction;
        addAirlineFn: lambdanode.NodejsFunction;
        deleteAirlineFn: lambdanode.NodejsFunction;
        deleteAircraftFn: lambdanode.NodejsFunction;
        getAircraftByIdFn: lambdanode.NodejsFunction;
        updateAircraftFn: lambdanode.NodejsFunction;
        airlineTranslationFn: lambdanode.NodejsFunction;
    };
    apiKeyName?: string;
    stageName?: string;
}

export class ApiStack extends cdk.Stack {
    public readonly api: apig.RestApi;
    public readonly apiKey: apig.ApiKey;

    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props);

        this.api = new apig.RestApi(this, "AirlinesApi", {
            description: "Airlines API",
            deployOptions: {
                stageName: props.stageName ||  "dev",
            },
            defaultCorsPreflightOptions: {
                allowHeaders: ["Content-Type", "X-Amz-Date", "-api-key"],
                allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
                allowCredentials: true,
                allowOrigins: ["*"],
            },
        });

        this.apiKey = new apig.ApiKey(this, "AirlinesApiKey", {
            apiKeyName: props.apiKeyName || "airlines-api-key2",
            description: "API Key for Airlines API(Multi-Stacks)",
            enabled: true,
        });


        const usagePlan = new apig.UsagePlan(this, "AirlinesUsagePlan", {
            name: "AirlinesUsagePlan",
        });

        usagePlan.addApiStage({
            stage: this.api.deploymentStage,
        });

        usagePlan.addApiKey(this.apiKey);



    const airlinesResource = this.api.root.addResource("airlines");

    // /airlines endpoint - define GET only once
       // airlinesResource.addMethod("GET", new apig.LambdaIntegration(props.lambdaFunctions.getAllAirlinesFn, { proxy: true }));
        airlinesResource.addMethod("POST", new apig.LambdaIntegration(props.lambdaFunctions.addAirlineFn, {
            requestParameters: { "integration.request.header.Content-Type": "'application/json'" },
            passthroughBehavior: apig.PassthroughBehavior.WHEN_NO_TEMPLATES,
        }), {
            apiKeyRequired: true
        });
// /airlines/{airlineId} endpoint
const airline = airlinesResource.addResource("{airlineId}");
airline.addMethod("GET", new apig.LambdaIntegration(props.lambdaFunctions.getAirlineByIdFn));
airline.addMethod("DELETE", new apig.LambdaIntegration(props.lambdaFunctions.deleteAirlineFn), {
    apiKeyRequired: true
});

// /airlines/{airlineId}/{aircraftId} endpoint
const singleAircraft = airline.addResource("{aircraftId}");
singleAircraft.addMethod("GET", new apig.LambdaIntegration(props.lambdaFunctions.getAircraftByIdFn));
singleAircraft.addMethod("PUT", new apig.LambdaIntegration(props.lambdaFunctions.updateAircraftFn, {
    passthroughBehavior: apig.PassthroughBehavior.WHEN_NO_TEMPLATES
}), {
    apiKeyRequired: true
});
singleAircraft.addMethod("DELETE", new apig.LambdaIntegration(props.lambdaFunctions.deleteAircraftFn), {
    apiKeyRequired: true
});

// /airlines/{airlineId}/{aircraftId}/translation endpoint
const aircraftTranslation = singleAircraft.addResource("translation");
aircraftTranslation.addMethod("GET", new apig.LambdaIntegration(props.lambdaFunctions.airlineTranslationFn));
}
}
