"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FckNatInstanceProvider = void 0;
const JSII_RTTI_SYMBOL_1 = Symbol.for("jsii.rtti");
const aws_cdk_lib_1 = require("aws-cdk-lib");
/**
 * Preferential set
 *
 * Picks the value with the given key if available, otherwise distributes
 * evenly among the available options.
 */
class PrefSet {
    constructor() {
        this.map = {};
        this.vals = new Array();
        this.next = 0;
    }
    add(pref, value) {
        this.map[pref] = value;
        this.vals.push([pref, value]);
    }
    pick(pref) {
        if (this.vals.length === 0) {
            throw new Error('Cannot pick, set is empty');
        }
        if (pref in this.map) {
            return this.map[pref];
        }
        return this.vals[this.next++ % this.vals.length][1];
    }
    values() {
        return this.vals;
    }
}
class FckNatInstanceProvider extends aws_cdk_lib_1.aws_ec2.NatProvider {
    constructor(props) {
        super();
        this.props = props;
        this.gateways = new PrefSet();
    }
    configureNat(options) {
        // Create the NAT instances. They can share a security group and a Role.
        const machineImage = this.props.machineImage || new aws_cdk_lib_1.aws_ec2.LookupMachineImage({
            name: 'fck-nat-amzn2-*-arm64-ebs',
            owners: ['568608671756'],
        });
        this._securityGroup = this.props.securityGroup ?? new aws_cdk_lib_1.aws_ec2.SecurityGroup(options.vpc, 'NatSecurityGroup', {
            vpc: options.vpc,
            description: 'Security Group for NAT instances',
        });
        this._connections = new aws_cdk_lib_1.aws_ec2.Connections({ securityGroups: [this._securityGroup] });
        // TODO: This should get buttoned up to only allow attaching ENIs created by this construct.
        const role = new aws_cdk_lib_1.aws_iam.Role(options.vpc, 'NatRole', {
            assumedBy: new aws_cdk_lib_1.aws_iam.ServicePrincipal('ec2.amazonaws.com'),
            inlinePolicies: {
                attachNatEniPolicy: new aws_cdk_lib_1.aws_iam.PolicyDocument({
                    statements: [new aws_cdk_lib_1.aws_iam.PolicyStatement({
                            actions: ['ec2:AttachNetworkInterface', 'ec2:ModifyNetworkInterfaceAttribute'],
                            resources: ['*'],
                        })],
                }),
            },
        });
        for (const sub of options.natSubnets) {
            const networkInterface = new aws_cdk_lib_1.aws_ec2.CfnNetworkInterface(sub, 'FckNatInterface', {
                subnetId: sub.subnetId,
                sourceDestCheck: false,
                groupSet: [this._securityGroup.securityGroupId],
            });
            const userData = aws_cdk_lib_1.aws_ec2.UserData.forLinux();
            userData.addCommands(`echo "eni_id=${networkInterface.ref}" >> /etc/fck-nat.conf`);
            userData.addCommands('service fck-nat restart');
            new aws_cdk_lib_1.aws_autoscaling.AutoScalingGroup(sub, 'FckNatAsg', {
                instanceType: this.props.instanceType,
                machineImage,
                vpc: options.vpc,
                vpcSubnets: { subnets: [sub] },
                securityGroup: this._securityGroup,
                role,
                desiredCapacity: 1,
                userData: userData,
                keyName: this.props.keyName,
            });
            // NAT instance routes all traffic, both ways
            this.gateways.add(sub.availabilityZone, networkInterface);
        }
        // Add routes to them in the private subnets
        for (const sub of options.privateSubnets) {
            this.configureSubnet(sub);
        }
    }
    configureSubnet(subnet) {
        const az = subnet.availabilityZone;
        const gatewayId = this.gateways.pick(az).ref;
        subnet.addRoute('DefaultRoute', {
            routerType: aws_cdk_lib_1.aws_ec2.RouterType.NETWORK_INTERFACE,
            routerId: gatewayId,
            enablesInternetConnectivity: true,
        });
    }
    /**
     * The Security Group associated with the NAT instances
     */
    get securityGroup() {
        if (!this._securityGroup) {
            throw new Error('Pass the NatInstanceProvider to a Vpc before accessing \'securityGroup\'');
        }
        return this._securityGroup;
    }
    /**
     * Manage the Security Groups associated with the NAT instances
     */
    get connections() {
        if (!this._connections) {
            throw new Error('Pass the NatInstanceProvider to a Vpc before accessing \'connections\'');
        }
        return this._connections;
    }
    get configuredGateways() {
        return this.gateways.values().map(x => ({ az: x[0], gatewayId: x[1].ref }));
    }
}
exports.FckNatInstanceProvider = FckNatInstanceProvider;
_a = JSII_RTTI_SYMBOL_1;
FckNatInstanceProvider[_a] = { fqn: "cdk-fck-nat.FckNatInstanceProvider", version: "0.0.0" };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSw2Q0FJcUI7QUFFckI7Ozs7O0dBS0c7QUFDSCxNQUFNLE9BQU87SUFBYjtRQUNtQixRQUFHLEdBQXNCLEVBQUUsQ0FBQztRQUM1QixTQUFJLEdBQUcsSUFBSSxLQUFLLEVBQWUsQ0FBQztRQUN6QyxTQUFJLEdBQVcsQ0FBQyxDQUFDO0lBbUIzQixDQUFDO0lBakJRLEdBQUcsQ0FBQyxJQUFZLEVBQUUsS0FBUTtRQUMvQixJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQztRQUN2QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ2hDLENBQUM7SUFFTSxJQUFJLENBQUMsSUFBWTtRQUN0QixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUMxQixNQUFNLElBQUksS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUM7U0FDOUM7UUFFRCxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFO1lBQUUsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQUU7UUFDaEQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFTSxNQUFNO1FBQ1gsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ25CLENBQUM7Q0FDRjtBQStDRCxNQUFhLHNCQUF1QixTQUFRLHFCQUFHLENBQUMsV0FBVztJQUt6RCxZQUE2QixLQUEwQjtRQUNyRCxLQUFLLEVBQUUsQ0FBQztRQURtQixVQUFLLEdBQUwsS0FBSyxD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dCB7XG4gIGF3c19pYW0gYXMgaWFtLFxuICBhd3NfYXV0b3NjYWxpbmcgYXMgYXV0b3NjYWxpbmcsXG4gIGF3c19lYzIgYXMgZWMyLFxufSBmcm9tICdhd3MtY2RrLWxpYic7XG5cbi8qKlxuICogUHJlZmVyZW50aWFsIHNldFxuICpcbiAqIFBpY2tzIHRoZSB2YWx1ZSB3aXRoIHRoZSBnaXZlbiBrZXkgaWYgYXZhaWxhYmxlLCBvdGhlcndpc2UgZGlzdHJpYnV0ZXNcbiAqIGV2ZW5seSBhbW9uZyB0aGUgYXZhaWxhYmxlIG9wdGlvbnMuXG4gKi9cbmNsYXNzIFByZWZTZXQ8QT4ge1xuICBwcml2YXRlIHJlYWRvbmx5IG1hcDogUmVjb3JkPHN0cmluZywgQT4gPSB7fTtcbiAgcHJpdmF0ZSByZWFkb25seSB2YWxzID0gbmV3IEFycmF5PFtzdHJpbmcsIEFdPigpO1xuICBwcml2YXRlIG5leHQ6IG51bWJlciA9IDA7XG5cbiAgcHVibGljIGFkZChwcmVmOiBzdHJpbmcsIHZhbHVlOiBBKSB7XG4gICAgdGhpcy5tYXBbcHJlZl0gPSB2YWx1ZTtcbiAgICB0aGlzLnZhbHMucHVzaChbcHJlZiwgdmFsdWVdKTtcbiAgfVxuXG4gIHB1YmxpYyBwaWNrKHByZWY6IHN0cmluZyk6IEEge1xuICAgIGlmICh0aGlzLnZhbHMubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBwaWNrLCBzZXQgaXMgZW1wdHknKTtcbiAgICB9XG5cbiAgICBpZiAocHJlZiBpbiB0aGlzLm1hcCkgeyByZXR1cm4gdGhpcy5tYXBbcHJlZl07IH1cbiAgICByZXR1cm4gdGhpcy52YWxzW3RoaXMubmV4dCsrICUgdGhpcy52YWxzLmxlbmd0aF1bMV07XG4gIH1cblxuICBwdWJsaWMgdmFsdWVzKCk6IEFycmF5PFtzdHJpbmcsIEFdPiB7XG4gICAgcmV0dXJuIHRoaXMudmFscztcbiAgfVxufVxuXG4vKipcbiAqIFByb3BlcnRpZXMgZm9yIGEgZmNrLW5hdCBpbnN0YW5jZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEZja05hdEluc3RhbmNlUHJvcHMge1xuICAvKipcbiAgICogVGhlIG1hY2hpbmUgaW1hZ2UgKEFNSSkgdG8gdXNlXG4gICAqXG4gICAqIEJ5IGRlZmF1bHQsIHdpbGwgZG8gYW4gQU1JIGxvb2t1cCBmb3IgdGhlIGxhdGVzdCBmY2stbmF0IGluc3RhbmNlIGltYWdlLlxuICAgKlxuICAgKiBJZiB5b3UgaGF2ZSBhIHNwZWNpZmljIEFNSSBJRCB5b3Ugd2FudCB0byB1c2UsIHBhc3MgYSBgR2VuZXJpY0xpbnV4SW1hZ2VgLiBGb3IgZXhhbXBsZTpcbiAgICpcbiAgICogYGBgdHNcbiAgICogRmNrTmF0SW5zdGFuY2VQcm92aWRlcih7XG4gICAqICAgaW5zdGFuY2VUeXBlOiBuZXcgZWMyLkluc3RhbmNlVHlwZSgndDMubWljcm8nKSxcbiAgICogICBtYWNoaW5lSW1hZ2U6IG5ldyBMb29rdXBNYWNoaW5lSW1hZ2Uoe1xuICAgKiAgICAgbmFtZTogJ2Zjay1uYXQtYW16bjItKi1hcm02NC1lYnMnLFxuICAgKiAgICAgb3duZXJzOiBbJzU2ODYwODY3MTc1NiddLFxuICAgKiAgIH0pXG4gICAqIH0pXG4gICAqIGBgYFxuICAgKlxuICAgKiBAZGVmYXVsdCAtIExhdGVzdCBmY2stbmF0IGluc3RhbmNlIGltYWdlXG4gICAqL1xuICByZWFkb25seSBtYWNoaW5lSW1hZ2U/OiBlYzIuSU1hY2hpbmVJbWFnZTtcblxuICAvKipcbiAgICogSW5zdGFuY2UgdHlwZSBvZiB0aGUgZmNrLW5hdCBpbnN0YW5jZVxuICAgKi9cbiAgcmVhZG9ubHkgaW5zdGFuY2VUeXBlOiBlYzIuSW5zdGFuY2VUeXBlO1xuXG4gIC8qKlxuICAgKiBOYW1lIG9mIFNTSCBrZXlwYWlyIHRvIGdyYW50IGFjY2VzcyB0byBpbnN0YW5jZVxuICAgKlxuICAgKiBAZGVmYXVsdCAtIE5vIFNTSCBhY2Nlc3Mgd2lsbCBiZSBwb3NzaWJsZS5cbiAgICovXG4gIHJlYWRvbmx5IGtleU5hbWU/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFNlY3VyaXR5IEdyb3VwIGZvciBmY2stbmF0IGluc3RhbmNlc1xuICAgKlxuICAgKiBAZGVmYXVsdCAtIEEgbmV3IHNlY3VyaXR5IGdyb3VwIHdpbGwgYmUgY3JlYXRlZFxuICAgKi9cbiAgcmVhZG9ubHkgc2VjdXJpdHlHcm91cD86IGVjMi5JU2VjdXJpdHlHcm91cDtcbn1cblxuZXhwb3J0IGNsYXNzIEZja05hdEluc3RhbmNlUHJvdmlkZXIgZXh0ZW5kcyBlYzIuTmF0UHJvdmlkZXIgaW1wbGVtZW50cyBlYzIuSUNvbm5lY3RhYmxlIHtcbiAgcHJpdmF0ZSBnYXRld2F5czogUHJlZlNldDxlYzIuQ2ZuTmV0d29ya0ludGVyZmFjZT4gPSBuZXcgUHJlZlNldDxlYzIuQ2ZuTmV0d29ya0ludGVyZmFjZT4oKTtcbiAgcHJpdmF0ZSBfc2VjdXJpdHlHcm91cD86IGVjMi5JU2VjdXJpdHlHcm91cDtcbiAgcHJpdmF0ZSBfY29ubmVjdGlvbnM/OiBlYzIuQ29ubmVjdGlvbnM7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBwcm9wczogRmNrTmF0SW5zdGFuY2VQcm9wcykge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBjb25maWd1cmVOYXQob3B0aW9uczogZWMyLkNvbmZpZ3VyZU5hdE9wdGlvbnMpOiB2b2lkIHtcbiAgICAvLyBDcmVhdGUgdGhlIE5BVCBpbnN0YW5jZXMuIFRoZXkgY2FuIHNoYXJlIGEgc2VjdXJpdHkgZ3JvdXAgYW5kIGEgUm9sZS5cbiAgICBjb25zdCBtYWNoaW5lSW1hZ2UgPSB0aGlzLnByb3BzLm1hY2hpbmVJbWFnZSB8fCBuZXcgZWMyLkxvb2t1cE1hY2hpbmVJbWFnZSh7XG4gICAgICBuYW1lOiAnZmNrLW5hdC1hbXpuMi0qLWFybTY0LWVicycsXG4gICAgICBvd25lcnM6IFsnNTY4NjA4NjcxNzU2J10sXG4gICAgfSk7XG4gICAgdGhpcy5fc2VjdXJpdHlHcm91cCA9IHRoaXMucHJvcHMuc2VjdXJpdHlHcm91cCA/PyBuZXcgZWMyLlNlY3VyaXR5R3JvdXAob3B0aW9ucy52cGMsICdOYXRTZWN1cml0eUdyb3VwJywge1xuICAgICAgdnBjOiBvcHRpb25zLnZwYyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgR3JvdXAgZm9yIE5BVCBpbnN0YW5jZXMnLFxuICAgIH0pO1xuICAgIHRoaXMuX2Nvbm5lY3Rpb25zID0gbmV3IGVjMi5Db25uZWN0aW9ucyh7IHNlY3VyaXR5R3JvdXBzOiBbdGhpcy5fc2VjdXJpdHlHcm91cF0gfSk7XG5cbiAgICAvLyBUT0RPOiBUaGlzIHNob3VsZCBnZXQgYnV0dG9uZWQgdXAgdG8gb25seSBhbGxvdyBhdHRhY2hpbmcgRU5JcyBjcmVhdGVkIGJ5IHRoaXMgY29uc3RydWN0LlxuICAgIGNvbnN0IHJvbGUgPSBuZXcgaWFtLlJvbGUob3B0aW9ucy52cGMsICdOYXRSb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2VjMi5hbWF6b25hd3MuY29tJyksXG4gICAgICBpbmxpbmVQb2xpY2llczoge1xuICAgICAgICBhdHRhY2hOYXRFbmlQb2xpY3k6IG5ldyBpYW0uUG9saWN5RG9jdW1lbnQoe1xuICAgICAgICAgIHN0YXRlbWVudHM6IFtuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgICBhY3Rpb25zOiBbJ2VjMjpBdHRhY2hOZXR3b3JrSW50ZXJmYWNlJywgJ2VjMjpNb2RpZnlOZXR3b3JrSW50ZXJmYWNlQXR0cmlidXRlJ10sXG4gICAgICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxuICAgICAgICAgIH0pXSxcbiAgICAgICAgfSksXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgZm9yIChjb25zdCBzdWIgb2Ygb3B0aW9ucy5uYXRTdWJuZXRzKSB7XG4gICAgICBjb25zdCBuZXR3b3JrSW50ZXJmYWNlID0gbmV3IGVjMi5DZm5OZXR3b3JrSW50ZXJmYWNlKFxuICAgICAgICBzdWIsICdGY2tOYXRJbnRlcmZhY2UnLCB7XG4gICAgICAgICAgc3VibmV0SWQ6IHN1Yi5zdWJuZXRJZCxcbiAgICAgICAgICBzb3VyY2VEZXN0Q2hlY2s6IGZhbHNlLFxuICAgICAgICAgIGdyb3VwU2V0OiBbdGhpcy5fc2VjdXJpdHlHcm91cC5zZWN1cml0eUdyb3VwSWRdLFxuICAgICAgICB9LFxuICAgICAgKTtcblxuICAgICAgY29uc3QgdXNlckRhdGEgPSBlYzIuVXNlckRhdGEuZm9yTGludXgoKTtcbiAgICAgIHVzZXJEYXRhLmFkZENvbW1hbmRzKGBlY2hvIFwiZW5pX2lkPSR7bmV0d29ya0ludGVyZmFjZS5yZWZ9XCIgPj4gL2V0Yy9mY2stbmF0LmNvbmZgKTtcbiAgICAgIHVzZXJEYXRhLmFkZENvbW1hbmRzKCdzZXJ2aWNlIGZjay1uYXQgcmVzdGFydCcpO1xuXG4gICAgICBuZXcgYXV0b3NjYWxpbmcuQXV0b1NjYWxpbmdHcm91cChcbiAgICAgICAgc3ViLCAnRmNrTmF0QXNnJywge1xuICAgICAgICAgIGluc3RhbmNlVHlwZTogdGhpcy5wcm9wcy5pbnN0YW5jZVR5cGUsXG4gICAgICAgICAgbWFjaGluZUltYWdlLFxuICAgICAgICAgIHZwYzogb3B0aW9ucy52cGMsXG4gICAgICAgICAgdnBjU3VibmV0czogeyBzdWJuZXRzOiBbc3ViXSB9LFxuICAgICAgICAgIHNlY3VyaXR5R3JvdXA6IHRoaXMuX3NlY3VyaXR5R3JvdXAsXG4gICAgICAgICAgcm9sZSxcbiAgICAgICAgICBkZXNpcmVkQ2FwYWNpdHk6IDEsXG4gICAgICAgICAgdXNlckRhdGE6IHVzZXJEYXRhLFxuICAgICAgICAgIGtleU5hbWU6IHRoaXMucHJvcHMua2V5TmFtZSxcbiAgICAgICAgfSxcbiAgICAgICk7XG4gICAgICAvLyBOQVQgaW5zdGFuY2Ugcm91dGVzIGFsbCB0cmFmZmljLCBib3RoIHdheXNcbiAgICAgIHRoaXMuZ2F0ZXdheXMuYWRkKHN1Yi5hdmFpbGFiaWxpdHlab25lLCBuZXR3b3JrSW50ZXJmYWNlKTtcbiAgICB9XG5cbiAgICAvLyBBZGQgcm91dGVzIHRvIHRoZW0gaW4gdGhlIHByaXZhdGUgc3VibmV0c1xuICAgIGZvciAoY29uc3Qgc3ViIG9mIG9wdGlvbnMucHJpdmF0ZVN1Ym5ldHMpIHtcbiAgICAgIHRoaXMuY29uZmlndXJlU3VibmV0KHN1Yik7XG4gICAgfVxuICB9XG5cbiAgY29uZmlndXJlU3VibmV0KHN1Ym5ldDogZWMyLlByaXZhdGVTdWJuZXQpOiB2b2lkIHtcbiAgICBjb25zdCBheiA9IHN1Ym5ldC5hdmFpbGFiaWxpdHlab25lO1xuICAgIGNvbnN0IGdhdGV3YXlJZCA9IHRoaXMuZ2F0ZXdheXMucGljayhheikucmVmO1xuICAgIHN1Ym5ldC5hZGRSb3V0ZSgnRGVmYXVsdFJvdXRlJywge1xuICAgICAgcm91dGVyVHlwZTogZWMyLlJvdXRlclR5cGUuTkVUV09SS19JTlRFUkZBQ0UsXG4gICAgICByb3V0ZXJJZDogZ2F0ZXdheUlkLFxuICAgICAgZW5hYmxlc0ludGVybmV0Q29ubmVjdGl2aXR5OiB0cnVlLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBTZWN1cml0eSBHcm91cCBhc3NvY2lhdGVkIHdpdGggdGhlIE5BVCBpbnN0YW5jZXNcbiAgICovXG4gIHB1YmxpYyBnZXQgc2VjdXJpdHlHcm91cCgpOiBlYzIuSVNlY3VyaXR5R3JvdXAge1xuICAgIGlmICghdGhpcy5fc2VjdXJpdHlHcm91cCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdQYXNzIHRoZSBOYXRJbnN0YW5jZVByb3ZpZGVyIHRvIGEgVnBjIGJlZm9yZSBhY2Nlc3NpbmcgXFwnc2VjdXJpdHlHcm91cFxcJycpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fc2VjdXJpdHlHcm91cDtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYW5hZ2UgdGhlIFNlY3VyaXR5IEdyb3VwcyBhc3NvY2lhdGVkIHdpdGggdGhlIE5BVCBpbnN0YW5jZXNcbiAgICovXG4gIHB1YmxpYyBnZXQgY29ubmVjdGlvbnMoKTogZWMyLkNvbm5lY3Rpb25zIHtcbiAgICBpZiAoIXRoaXMuX2Nvbm5lY3Rpb25zKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Bhc3MgdGhlIE5hdEluc3RhbmNlUHJvdmlkZXIgdG8gYSBWcGMgYmVmb3JlIGFjY2Vzc2luZyBcXCdjb25uZWN0aW9uc1xcJycpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fY29ubmVjdGlvbnM7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGNvbmZpZ3VyZWRHYXRld2F5cygpOiBlYzIuR2F0ZXdheUNvbmZpZ1tdIHtcbiAgICByZXR1cm4gdGhpcy5nYXRld2F5cy52YWx1ZXMoKS5tYXAoeCA9PiAoeyBhejogeFswXSwgZ2F0ZXdheUlkOiB4WzFdLnJlZiB9KSk7XG4gIH1cbn1cbiJdfQ==