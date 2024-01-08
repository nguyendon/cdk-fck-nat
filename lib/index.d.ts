import { aws_ec2 as ec2 } from 'aws-cdk-lib';
/**
 * Properties for a fck-nat instance
 */
export interface FckNatInstanceProps {
    /**
     * The machine image (AMI) to use
     *
     * By default, will do an AMI lookup for the latest fck-nat instance image.
     *
     * If you have a specific AMI ID you want to use, pass a `GenericLinuxImage`. For example:
     *
     * ```ts
     * FckNatInstanceProvider({
     *   instanceType: new ec2.InstanceType('t3.micro'),
     *   machineImage: new LookupMachineImage({
     *     name: 'fck-nat-amzn2-*-arm64-ebs',
     *     owners: ['568608671756'],
     *   })
     * })
     * ```
     *
     * @default - Latest fck-nat instance image
     */
    readonly machineImage?: ec2.IMachineImage;
    /**
     * Instance type of the fck-nat instance
     */
    readonly instanceType: ec2.InstanceType;
    /**
     * Name of SSH keypair to grant access to instance
     *
     * @default - No SSH access will be possible.
     */
    readonly keyName?: string;
    /**
     * Security Group for fck-nat instances
     *
     * @default - A new security group will be created
     */
    readonly securityGroup?: ec2.ISecurityGroup;
}
export declare class FckNatInstanceProvider extends ec2.NatProvider implements ec2.IConnectable {
    private readonly props;
    private gateways;
    private _securityGroup?;
    private _connections?;
    constructor(props: FckNatInstanceProps);
    configureNat(options: ec2.ConfigureNatOptions): void;
    configureSubnet(subnet: ec2.PrivateSubnet): void;
    /**
     * The Security Group associated with the NAT instances
     */
    get securityGroup(): ec2.ISecurityGroup;
    /**
     * Manage the Security Groups associated with the NAT instances
     */
    get connections(): ec2.Connections;
    get configuredGateways(): ec2.GatewayConfig[];
}
