import path from "node:path";
import * as cdk from "aws-cdk-lib";
import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  type StackProps,
} from "aws-cdk-lib";
import { CorsHttpMethod, HttpApi } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import {
  type ISecurityGroup,
  type IVpc,
  SubnetType,
} from "aws-cdk-lib/aws-ec2";
import type { IAccessPoint } from "aws-cdk-lib/aws-efs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import type { Construct } from "constructs";

export interface ApiLambdaStackProps extends StackProps {
  vpc: IVpc;
  accessPoint: IAccessPoint;
  lambdaSecurityGroup: ISecurityGroup;
}

export class ApiLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiLambdaStackProps) {
    super(scope, id, props);

    const { vpc, accessPoint, lambdaSecurityGroup } = props;
    const efsPath = "/mnt/efs";
    const serverRoot = path.resolve(__dirname, "../../../apps/server/dist");

    const lambdaLogGroup = new logs.LogGroup(this, "LambdaLogGroup", {
      logGroupName: "/aws/lambda/api-function",
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Fuck ARM architecture support cross-platform is fucked
    // const libsqlLayer = new lambda.LayerVersion(this, "LibsqlLayer", {
    //   compatibleArchitectures: [lambda.Architecture.ARM_64],
    //   compatibleRuntimes: [lambda.Runtime.NODEJS_22_X],
    //   code: lambda.Code.fromAsset("./layers/libsql/nodejs", {
    //     bundling: {
    //       platform: "linux/arm64",
    //       image: lambda.Runtime.NODEJS_22_X.bundlingImage,
    //       environment: {
    //         npm_config_cache: "/tmp/npm_cache",
    //         npm_config_update_notifier: "false",
    //       },
    //       command: [
    //         "bash",
    //         "-xc",
    //         [
    //           "cd $(mktemp -d)",
    //           "cp /asset-input/package* .",
    //           "npm --prefix . i @libsql/client",
    //           "cp -r node_modules /asset-output/",
    //         ].join(" && "),
    //       ],
    //     },
    //   }),
    // });

    const apiFunction = new lambda.Function(this, "ApiFunction", {
      code: lambda.Code.fromAsset(serverRoot, {
        followSymlinks: cdk.SymlinkFollowMode.ALWAYS,
      }),
      handler: "handler.handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.X86_64,
      memorySize: 512,
      timeout: Duration.seconds(30),
      environment: {
        NODE_ENV: "production",
        EFS_PATH: efsPath,
        DB_FILE_NAME: `file:${efsPath}/database.db`,
        LOG_LEVEL: "info",
        ENABLE_DOCS: "true",
        NODE_OPTIONS: "--enable-source-maps",
      },
      logGroup: lambdaLogGroup,
      tracing: lambda.Tracing.ACTIVE,
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [lambdaSecurityGroup],
      allowPublicSubnet: false,
      filesystem: lambda.FileSystem.fromEfsAccessPoint(accessPoint, efsPath),
    });

    const apiIntegration = new HttpLambdaIntegration(
      "ApiIntegration",
      apiFunction
    );

    const apiGatewayLogGroup = new logs.LogGroup(this, "ApiGatewayLogGroup", {
      logGroupName: "/aws/apigateway/api-lambda-http-api",
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const httpApi = new HttpApi(this, "HttpApi", {
      apiName: "api-lambda-http-api",
      description: "HTTP API Gateway for Lambda backend",
      defaultIntegration: apiIntegration,
      corsPreflight: {
        allowHeaders: ["authorization", "content-type", "x-api-key"],
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.PATCH,
          CorsHttpMethod.DELETE,
          CorsHttpMethod.OPTIONS,
        ],
        allowOrigins: ["*"],
        maxAge: Duration.days(1),
      },
    });

    const stage = httpApi.defaultStage?.node
      .defaultChild as cdk.aws_apigatewayv2.CfnStage;
    if (stage) {
      stage.accessLogSettings = {
        destinationArn: apiGatewayLogGroup.logGroupArn,
        format: JSON.stringify({
          requestId: "$context.requestId",
          ip: "$context.identity.sourceIp",
          requestTime: "$context.requestTime",
          httpMethod: "$context.httpMethod",
          routeKey: "$context.routeKey",
          status: "$context.status",
          protocol: "$context.protocol",
          responseLength: "$context.responseLength",
          integrationErrorMessage: "$context.integrationErrorMessage",
        }),
      };
    }

    cdk.Tags.of(this).add("Stack", "ApiLambda");
    for (const [key, value] of Object.entries(props?.tags || {})) {
      cdk.Tags.of(this).add(key, value);
    }

    new CfnOutput(this, "ApiUrl", {
      value: httpApi.apiEndpoint,
      description: "HTTP API Gateway endpoint URL",
      exportName: `${this.stackName}-ApiUrl`,
    });

    new CfnOutput(this, "LambdaFunctionName", {
      value: apiFunction.functionName,
      description: "Lambda function name",
      exportName: `${this.stackName}-LambdaFunctionName`,
    });

    new CfnOutput(this, "LambdaFunctionArn", {
      value: apiFunction.functionArn,
      description: "Lambda function ARN",
      exportName: `${this.stackName}-LambdaFunctionArn`,
    });

    new CfnOutput(this, "LambdaLogGroupName", {
      value: lambdaLogGroup.logGroupName,
      description: "Lambda CloudWatch Log Group name",
      exportName: `${this.stackName}-LambdaLogGroupName`,
    });

    new CfnOutput(this, "ApiGatewayLogGroupName", {
      value: apiGatewayLogGroup.logGroupName,
      description: "API Gateway CloudWatch Log Group name",
      exportName: `${this.stackName}-ApiGatewayLogGroupName`,
    });
  }
}
