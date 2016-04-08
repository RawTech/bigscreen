var config = require('../config');

module.exports = function(socket) {
    socket.on('name-announce', function(name) {
        if (config.screens.hasOwnProperty(name)) {
            socket.emit('show-screen', config.screens[name]);
        } else {
            socket.emit('show-screen', null);
        }
    });
};
