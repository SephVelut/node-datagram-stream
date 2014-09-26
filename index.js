var udp = require('dgram')
    , pipe = require('stream').prototype.pipe;

module.exports = UdpStream;

function UdpStream (options) {
    var options = options || {};

    var address         = options.address       || '0.0.0.0';
    var port            = options.port          || 12345;
    var broadcast       = options.broadcast     || null;
    var multicast       = options.multicast     || null;
    var multicastTTL    = options.multicastTTL  || 1;
    var destination     = options.destination   || multicast || broadcast;

    var socket = udp.createSocket('udp4');

    socket.write = function (message) {
        if (typeof message === "string") {
            message = new Buffer(message, "utf8");
        }

        socket.send(message, 0, message.length, port, destination);

        return true;
    };

    socket.end = function () {
        socket.close();
    }

    socket.pause = function () {
        socket.paused = true;
        return this;
    }

    socket.resume = function () {
        socket.paused = false;
        return this;
    }

    socket.on('message', function (msg, rinfo) {
        msg.rinfo = rinfo;

        socket.emit('data', msg);
    });

    socket.bind(port, address);

    socket.on('listening', function () {
        if (multicast) {
            //set up for multicast
            try {
                socket.addMembership(multicast);
                socket.setMulticastTTL(multicastTTL);
            }
            catch (e) {
                socket.emit('error', e);
            }
        }
        else if (broadcast) {
            socket.setBroadcast(true);
        }
    });

    socket.pipe = pipe;

    return socket;
}