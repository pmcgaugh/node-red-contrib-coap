module.exports = function(RED) {
    "use strict";
    var coap = require('coap');

    // A node red node that sets up a local coap server
    function CoapServerNode(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);
        var node = this;

        // Store local copies of the node configuration (as defined in the .html)
        node.options = {};
        node.options.name = n.name;
        node.options.port = n.port;

        node._inputNodes = [];    // collection of "coap in" nodes that represent coap resources

        // Setup node-coap server and start
        node.server = new coap.createServer();
        node.server.on('request', function(req, res) {
            node.handleRequest(req, res);
        });
        node.server.listen(node.options.port, function() {
            console.log('server started');
        });

        node.on("close", function() {
            node._inputNodes = [];
            node.server.close();
        });
    }
    RED.nodes.registerType("coap-server",CoapServerNode);

    CoapServerNode.prototype.registerInputNode = function(/*Node*/resource){
        this._inputNodes.push(resource);
    };

    CoapServerNode.prototype.handleRequest = function(req, res){

        //TODO: Check if there are any matching resource. If the resource is .well-known return the resource directory to the client
        for (var i = 0; i < this._inputNodes.length; i++) {
            if (this._inputNodes[i].options.url == req.url &&
                this._inputNodes[i].options.method == req.method) {

                var inNode = this._inputNodes[i];
                inNode.send({'req': req, 'res': res});
            }
        }
    };

    function CoapInNode(n) {
        RED.nodes.createNode(this,n);
        //var node = this;

        //copy "coap in" node configuration locally
        this.options = {};
        this.options.method = n.method;
        this.options.name = n.name;
        this.options.server = n.server;
        this.options.url = n.url.charAt(0) == "/" ? n.url : "/" + n.url;

        this.serverConfig = RED.nodes.getNode(this.options.server);

        if (this.serverConfig) {
            this.serverConfig.registerInputNode(this);
        } else {
            this.error("Missing server configuration");
            //this.error(JSON.stringify(n));
            //this.error(JSON.stringify(RED.nodes));
        }

    }
    RED.nodes.registerType("coap in",CoapInNode);
};
