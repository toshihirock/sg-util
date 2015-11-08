# sg-util

This is CLI tool that provides AWS SecurityGroup information

+ Show SecurityGroup infomation like ManagementConsole
+ Show SecurityGroup inbound or outbound rule like ManagementConsole
+ Show specify SecurityGroup associated EC2 or ELB or RDS

# Example

```bash
# show security group basic information
$sg-util show --name Web --region ap-northeast-1
"GroupName","GroupId","Description","VpcId"
"Web","sg-1f5ec07a","web","vpc-c406dea1"

# show security group inbound rule
$sg-util show --name Web --region ap-northeast-1 --inbound
"Index","IpProtocol","PortRange","Source"
"0","tcp","80","0.0.0.0/0"
"1","tcp","22","0.0.0.0/0"

# show security group outbound rule
$sg-util show --name Web --region ap-northeast-1 --outbound
"Index","IpProtocol","PortRange","Destination"
"0","ALL","ALL","0.0.0.0/0"

# show specify SecurityGroup associated EC2
$sg-util associate --name Web --region ap-northeast-1
"type","name","id"
"ec2","MyName","i-9c159239"

# show specify SecurityGroup associated EC2
$sg-util associate --name MySQL --region ap-northeast-1
"type","name","id"
"rds","db","mysql.cfunxik4b0cn.ap-northeast-1.rds.amazonaws.com"
```

```
# Setup

CLI uses AWS SDK

You need to set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY

This CLI looks for credentials in the following order

1. Environment variables
1. The AWS credentials file 

## Environment variables

```bash
# local
$export AWS_ACCESS_KEY_ID=xxxxxxxx
$export AWS_SECRET_ACCESS_KEY=xxxxxx

# .zshrc
$cat .zshrc |grep AWS
export AWS_ACCESS_KEY_ID=xxxxxxxx
export AWS_SECRET_ACCESS_KEY=xxxxxxx
```

## The AWS credentials file 

The AWS credentials file located at `~/.aws/credentials`

If you have already installed [AWS Command Line Interface](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/cli-chap-welcome.html), you can use `aws configure` command to set `~/.aws/credentials` file.

```bash
$cat ~/.aws/credentials
[default]
aws_access_key_id = xxxxxxxxxx
aws_secret_access_key = xxxxxxxxx
```
