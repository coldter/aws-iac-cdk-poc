import { CfnOutput, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as efs from "aws-cdk-lib/aws-efs";
import type { Construct } from "constructs";

export class StatefulStack extends Stack {
  readonly vpc: ec2.Vpc;
  readonly fileSystem: efs.FileSystem;
  readonly accessPoint: efs.AccessPoint;
  readonly lambdaSecurityGroup: ec2.SecurityGroup;
  readonly efsSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, "LambdaVpc", {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: "IsolatedSubnet",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    this.lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      "LambdaSecurityGroup",
      {
        vpc: this.vpc,
        description:
          "Security group for Lambda function with no internet access",
        allowAllOutbound: false,
      }
    );

    this.efsSecurityGroup = new ec2.SecurityGroup(this, "EfsSecurityGroup", {
      vpc: this.vpc,
      description: "Security group for EFS",
      allowAllOutbound: false,
    });

    this.efsSecurityGroup.addIngressRule(
      this.lambdaSecurityGroup,
      ec2.Port.tcp(2049),
      "Allow NFS traffic from Lambda"
    );

    this.fileSystem = new efs.FileSystem(this, "DatabaseEFS", {
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroup: this.efsSecurityGroup,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_7_DAYS,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      throughputMode: efs.ThroughputMode.BURSTING,
      removalPolicy: RemovalPolicy.RETAIN,
      encrypted: true,
    });

    this.accessPoint = this.fileSystem.addAccessPoint("EfsAccessPoint", {
      createAcl: {
        ownerGid: "1001",
        ownerUid: "1001",
        permissions: "750",
      },
      path: "/lambda",
      posixUser: {
        gid: "1001",
        uid: "1001",
      },
    });

    new CfnOutput(this, "VpcId", {
      value: this.vpc.vpcId,
      description: "VPC ID",
      exportName: `${this.stackName}-VpcId`,
    });

    new CfnOutput(this, "EfsFileSystemId", {
      value: this.fileSystem.fileSystemId,
      description: "EFS File System ID",
      exportName: `${this.stackName}-EfsFileSystemId`,
    });

    new CfnOutput(this, "EfsAccessPointId", {
      value: this.accessPoint.accessPointId,
      description: "EFS Access Point ID",
      exportName: `${this.stackName}-EfsAccessPointId`,
    });

    new CfnOutput(this, "LambdaSecurityGroupId", {
      value: this.lambdaSecurityGroup.securityGroupId,
      description: "Lambda Security Group ID",
      exportName: `${this.stackName}-LambdaSecurityGroupId`,
    });

    new CfnOutput(this, "EfsSecurityGroupId", {
      value: this.efsSecurityGroup.securityGroupId,
      description: "EFS Security Group ID",
      exportName: `${this.stackName}-EfsSecurityGroupId`,
    });
  }
}
