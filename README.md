# sg-util

This is CLI tool that provides AWS SecurityGroup information

+ Show SecurityGroup infomation like ManagementConsole
+ Show SecurityGroup inbound or outbound rule like ManagementConsole
+ Show specify SecurityGroup associated EC2 or ELB or RDS

# setup

CLI uses AWS SDK

You need to set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY

+ Environment variables
+ set `.aws/credentials` file

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

## Set `.aws/credentials` file

If you have already installed [AWS Command Line Interface](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/cli-chap-welcome.html), you can use `aws configure` command to set `~/.aws/credentials` file.

```bash
$cat ~/.aws/credentials
[default]
aws_access_key_id = xxxxxxxxxx
aws_secret_access_key = xxxxxxxxx
```
