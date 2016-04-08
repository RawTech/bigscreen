var _ = require('lodash');
var  moment = require('moment');

module.exports = {
    parseFailed: function (results) {
        return results;
    },
    parseRecent: function (results) {
        _.forEach(results, function (result) {
            var started = moment(result.started);
            var finished;

            if (result.finished == null) {
                finished = moment();
            } else {
                finished = moment(result.finished);
            }

            var diff = moment.duration(finished.diff(started));

            result.duration_seconds = Math.floor(diff.asSeconds());
            result.started_time = started.format('HH:mm');

            if (result.duration_seconds < 0) {
                // Sometimes the rundeck time and server time are slightly out of sync.
                result.duration_seconds = 0;
            }
        });

        return results;
    }
};