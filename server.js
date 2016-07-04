var https = require("http");

//config
var versionData = {
  "prod" : {
      "css-cms" : {
        "host" : "storefront-cms.wemall.com",
        "path" : "/version.txt",
        "port" : 80,
        "method" : "GET",
        "username" : "hulk",
        "password" : "kluh",
        "versionTxt" : true,
      },
      "cps-cms" : {
        "host" : "portal-cms.wemall.com",
        "path" : "/version.txt",
        "port" : 80,
        "method" : "GET",
        "username" : "hulk",
        "password" : "kluh",
        "versionTxt" : true,
      }
  }
};

//server
https.createServer((request, response) => {
  console.log(request.method, request.url);
  if(request.method === 'POST' && request.url === '/'){
    readPayload(request, response, postProxy);
  }else if(request.method === 'GET' && request.url === '/'){
    writeOut(request, response, 200, {"test" : "done"})
  }else if(request.method === 'GET' && request.url === '/version'){
    readPayload(request, response, versionTxt);
  }

}).listen(8888);
console.log('server started');

function versionTxt(request, response){
  versionData.each((env) => {
    env.each((module) => {

    } )
  });
}

//-------- Utilities function --------
function readPayload(request, response, next){
  var body = "";
  request.on('data', (chunk) => {
    body += chunk;
  });
  request.on('end', () => {
    var jsonObj = JSON.parse(body);
    request.body = jsonObj;
    console.log('request.body', jsonObj);
    next(request, response);
  })
}

//do something
function postProxy(request, response){
  proxy(request, response, request.body);
}
function proxy(request, response, proxyOptions){
  var options = {
    host: proxyOptions.host,
    port: !proxyOptions.port?80:proxyOptions.port,
    path: proxyOptions.path,
    method: proxyOptions.method
  };

  //if there is basic auth
  if(proxyOptions.username && proxyOptions.password){
    options['auth'] = proxyOptions.username+':'+proxyOptions.password;
  }

  var req = https.request(options, (res) => {
    // console.log('statusCode: ', res.statusCode);
    // console.log('headers: ', res.headers);
    var out = "";
    res.on('data', (chunk) => {
      out += chunk;
    });
    res.on('end', () => {
      if(res.headers['content-type'] === 'application/json')
        out = JSON.parse(out);
      else if(res.headers['content-type'] === 'text/plain')
        out = out;

      if(proxyOptions.versionTxt){
        out = out.replace(/<br\/>/g, '\n');
        out = convertVersionTxtToJson(out);
      }
      if(out == null)  writeOut(request, response, 500);
      writeOut(request, response, 200, out);
    });
  });
  req.end();

  req.on('error', (e) => {
    console.error(e);
    writeOut(request, response, 500);
  });
}

function convertVersionTxtToJson(data){
  var json = {};
  var line = data.split('\n');
  if(line == 0) return null;
  for(var i=0;i<line.length;i++){
    var variable = line[i].split('=');
    json[variable[0]] = variable[1];
  }
  return json;
}

function writeOut(request, response, code, obj){
  var header = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin" : "*",
    "Access-Control-Allow-Methods" : "*",
    "Access-Control-Allow-Headers" : "*"
  };
  response.writeHead(code, header);
  if(obj) response.write(JSON.stringify(obj));
  response.end();
}
