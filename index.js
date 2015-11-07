#!/usr/bin/env node

var program = require('commander');
var AWS = require('aws-sdk');
var async = require('async');

program
  .version('0.0.1');

program
  .command('show')
  .description('show  security group information')
  .option('-r, --region <region>', 'AWS region')
  .option('-i, --id <id>', 'security group id')
  .option('-n, --name <name>', 'security group name')
  .option('--inbound', 'show inbound rule')
  .option('--outbound', 'show inbound rule')
  .action(function() {
    show(program.commands[0]);
  });

program
  .command('associate')
  .description('show  associate security group')
  .option('-r, --region <region>', 'AWS region')
  .option('-i, --id <id>', 'security group id')
  .option('-n, --name <name>', 'security group name')
  .action(function() {
    associate(program.commands[1]);
  });

program.parse(process.argv);


function getIpRanges(ipRanges) {
  var tmp = '';
  ipRanges.forEach(function(ip) {
    tmp = tmp + ip.CidrIp + ' ';
  });
  tmp = tmp.slice(0, -1);
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
    tmp = tmp + sg.GroupId + ' ';
  });
  tmp = tmp.slice(0, -1);
  return tmp;
}

function showInfo(data) {
  data.SecurityGroups.forEach(function(sg) {
    console.log('"GroupName","GroupId","Description","VpcId"');
    console.log('"' + sg.GroupName + '","' + sg.GroupId + '","' + sg.Description + '","' + sg.VpcId + '"');
  });
}

function showRule(data, inbound) {
  data.SecurityGroups.forEach(function(sg) {
    var permission;
    if(inbound) { 
      permission = sg.IpPermissions;
      console.log('"Index","IpProtocol","PortRange","Source"');
    } else {
      permission = sg.IpPermissionsEgress;
      console.log('"Index","IpProtocol","PortRange","Destination"');
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
  if(typeof val === 'undefined' || typeof val === 'function' || val === null) return true;
  return false;
}

function isHashEmpty(hash) {
  for(var k in hash) return false;
  return true;
}

function checkRegion(region) {
  if(isEmpty(region)) {
    console.log('need to specify --region');
    process.exit();
  }
  return;
}

function getFilterParams(id, name, type) {
  var params = {};
  var filterId = 'group-id';
  var filterName = 'group-name';

  if(type == 'ec2' || type == 'EC2') {
    filterId = 'instance.group-id';
    filterName = 'instance.group-name';
  }

  if(!(isEmpty(id))) {
    params['Filters'] = [
      {
        Name: filterId,
        Values: [id]
      }
    ]
  }

  if(!(isEmpty(name))) {
    params['Filters'] = [
      {
        Name: filterName,
        Values: [name]
      }
    ]
  }

  return params;
}

function getTagName(tags) {
  var name = '';
  tags.forEach(function(tag) {
    if(tag.Key === 'Name') name = tag.Value
  });
  return name;
}

function describeInstances(ec2, securityGroupId, cb) {
  params = getFilterParams(securityGroupId, null, 'ec2');
  console.log(params);
  ec2.describeInstances(params, function(err, data) {
    if (err) cb(err, null);
    else {
      var array = [];
      data.Reservations.forEach(function(reservation) {
        reservation.Instances.forEach(function(instance) {
          array.push({
            Name: getTagName(instance.Tags),
            InstanceId: instance.InstanceId
          });
        });
      });
      cb(null, array);
    }
  });
}

function describeLoadBalancers(securityGroupId, cb) {
  var elb = new AWS.ELB();
  elb.describeLoadBalancers({}, function(err, data) {
    if (err) cb(err, null);
    else {
      var array = [];
      data.LoadBalancerDescriptions.forEach(function(elb) {
        if(elb.SecurityGroups.indexOf(securityGroupId) !== -1) {
          array.push({
            LoadBalancerName: elb.LoadBalancerName,
            DNSName: elb.DNSName
          });
        }
      });
      cb(null, array);
    }
  });
}

function associate(command) {
  checkRegion(command.region);
  AWS.config.region = command.region;
  params = getFilterParams(command.id, command.name, 'sg');

  if(isHashEmpty(params)) {
    console.log('need to specify --id or --name');
    process.exit();
  }

  var ec2 = new AWS.EC2();
  ec2.describeSecurityGroups(params, function(err, data) {
    if (err) console.log(err, err.stack);
    else {
      var securityGroupId = data.SecurityGroups[0].GroupId;
      console.log(securityGroupId);
      async.parallel({
        ec2: function(cb) {
          describeInstances(ec2, securityGroupId, cb);
        },
        elb: function(cb) {
          describeLoadBalancers(securityGroupId, cb);
        }
      },
      function(err, result) {
        if (err) console.log(err, err,stack);
        else {
          //header
          console.log('"type","name","id"');
          result['ec2'].forEach(function(instance) {
            console.log('"ec2","' + instance.Name + '","' + instance.InstanceId + '"');
          });
          result['elb'].forEach(function(elb) {
            console.log('"elb","' + elb.LoadBalancerName  + '","' + elb.DNSName + '"');
          });
        }
      });
    }
  });
}

function show(command) {
  checkRegion(command.region);
  AWS.config.region = command.region;
  params = getFilterParams(command.id, command.name, 'sg');

  if(isHashEmpty(params) && (!(isEmpty(command.inbound)) || (!(isEmpty(command.outbound))))) {
    console.log('need to specify --id or --name');
    process.exit();
  }

  var ec2 = new AWS.EC2();
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
