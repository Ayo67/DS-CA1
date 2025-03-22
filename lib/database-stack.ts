import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';


export interface DatabaseStackProps extends cdk.StackProps {
    airlinesTable?: string;
}

export class DatabaseStack extends cdk.Stack {
    public readonly airlinesTable: dynamodb.Table;

    constructor(scope: Construct, id: string, props: DatabaseStackProps) {
        super(scope, id, props);

        this.airlinesTable = new dynamodb.Table(this, "AirlinesTable", {
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            partitionKey: { name: "airlineId", type: dynamodb.AttributeType.NUMBER },
            sortKey: { name: "aircraftId", type: dynamodb.AttributeType.NUMBER },
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            tableName: props.airlinesTable || "Airlines",
        });

        this.airlinesTable.addGlobalSecondaryIndex({
            indexName: "CapacityIndex",
            partitionKey: { name: "airlineId", type: dynamodb.AttributeType.NUMBER },
            sortKey: { name: "capacity", type: dynamodb.AttributeType.NUMBER },
        });

        new cdk.CfnOutput(this, "AirlinesTableOutput", {
            value: this.airlinesTable.tableName,
            description: "Airlines Table Name",
            exportName: "AirlinesTableName",
        });

        new cdk.CfnOutput(this, "AirlinesTableArnOutput", {
            value: this.airlinesTable.tableArn,
            description: "Airlines Table ARN",
            exportName: "AirlinesTableArn",
        });
    }
}