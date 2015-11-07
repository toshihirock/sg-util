#!/usr/bin/env node

var program = require('commander');
var AWS = require('aws-sdk');

program
  .version('0.0.1');

program
  .command('show')
  .description('show  security group')
  .option('-i, --id <id>', 'security group id')
  .option('-n, --name <name>', 'security group name')
  .option('--inbound', 'show inbound rule')
  .option('--outbound', 'show inbound rule')
  .action(function() {
    show(program.commands[0]);
  });

program.parse(process.argv);

function getIpRanges(ipRanges) {
  var tmp = '';
  ipRanges.forEach(function(ip) {
    tmp = tmp + ip.CidrIp + ',';
  });
  tmp = tmp.substr(0, (tmp.length -1));
  return tmp;
}

function getProtocol(protocol) {
  if(protocol == -1) return 'ALL';
  return protocol;
}

function getSourceOrDestination(userIdGroupPairs, ipRanges) {
  if(userIdGroupPairs.length !== 0) return getUserIdGroupPairs(userIdGroupPairs);
  if(ipRanges.length !== 0) return getIpRanges(ipRanges);
}

function getPortRange(from, to) {
  //console.log("from = " + from + "to = " + to);
  if(isEmpty(from) && isEmpty(to)) return 'ALL';
  else if(to === -1 && from === -1) return 'N/A';
  else if(to === from) return to;
  else return (from + '-' + to);
}

function getUserIdGroupPairs(userIdGroupPairs) {
  var tmp = '';
  userIdGroupPairs.forEach(function(sg) {
    //console.log(sg);
    //console.log(sg.GroupId);
    tmp = tmp + sg.GroupId + ',';
  });
  tmp = tmp.substr(0, (tmp.length -1));
  return tmp;
}

function showInfo(data) {
  data.SecurityGroups.forEach(function(sg) {
    console.log('GroupName,GroupId,Description,VpcId');
    console.log('"' + sg.GroupName + '","' + sg.GroupId + '","' + sg.Description + '","' + sg.VpcId + '"');
  });
}

function showRule(data, inbound) {
  data.SecurityGroups.forEach(function(sg) {
    var permission;
    if(inbound) { 
      permission = sg.IpPermissions;
      console.log('Index,IpProtocol,PortRange,Source');
    } else {
      permission = sg.IpPermissionsEgress;
      console.log('Index,IpProtocol,PortRange,Destination');
    }
    permission.forEach(function(rule, i) {
      //console.log(rule);
      console.log('"' + i + '","' + getProtocol(rule.IpProtocol) + '","' + getPortRange(rule.FromPort, rule.ToPort) + '","' + getSourceOrDestination(rule.UserIdGroupPairs, rule.IpRanges) + '"');
      //console.log(getProtocol(rule.IpProtocol));
      //console.log(getPortRange(rule.FromPort, rule.ToPort));
    });
  });
}

function showInbound(data) {
  showRule(data, true);
}

function showOutBound(data) {
  showRule(data, false);
}

function isEmpty(val) {
  if(typeof val === 'undefined' || typeof val === 'function') return true;
  return false;
}

function isHashEmpty(hash) {
  for(var k in hash) return false;
  return true;
}

function show(command) {
  // get params options
  var params = {};
  if(!(isEmpty(command.id))) params['GroupIds'] = [command.id];
  if(!(isEmpty(command.name))) params['GroupNames'] = [command.name]
  //console.log(params);
  if(isHashEmpty(params) && (!(isEmpty(command.inbound)) || (!(isEmpty(command.outbound))))) {
    console.log('need to specify --id or --name');
    process.exit();
  }

  var ec2 = new AWS.EC2({region: 'ap-northeast-1'});
  //console.log(params);
  ec2.describeSecurityGroups(params, function(err, data) {
    if (err) console.log(err, err.stack);
    else {
      if(!(isEmpty(command.inbound))) showInbound(data);
      else if(!(isEmpty(command.outbound))) showOutBound(data);
      else showInfo(data);
    }
  });
}
