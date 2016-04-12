var config = require('../config');

module.exports = function(socket) {
    socket.emit('config', config.view);

    socket.on('name-announce', function(name) {
        if (config.screens.hasOwnProperty(name)) {
            socket.emit('show-screen', {screenName:name,viewName:config.screens[name]});
        }
    });
};
