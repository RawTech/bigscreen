var mysql = require('mysql');
var parser = require('./parser');
var config = require('../config');
var connection;
var failures = [];
var recent = [];
var socket = null;

function init() {
    failures = [];
    recent = [];

    connection = mysql.createConnection({
        host: config.rundeck.hostname,
        user: config.rundeck.username,
        password: config.rundeck.password,
        database: config.rundeck.database,
        port: config.rundeck.port
    });

    setInterval(loop, 2000);

    loop();
}

function loop() {
    connection.query(
        'select \
            x.job_name, \
            x.last_failure, \
            x.count_fail, \
            x.count_success, \
            (x.count_fail / (x.count_fail + x.count_success)) AS success_rate \
        from ( \
            select \
                se.job_name AS job_name, \
                MAX(e.date_started) AS last_failure, \
                (select count(1) from ops_rundeck.execution sub_e where sub_e.status = ? and sub_e.date_started > NOW() - INTERVAL 3 DAY and sub_e.scheduled_execution_id = se.id) AS count_fail, \
                (select count(1) from ops_rundeck.execution sub_e where sub_e.status = ? and sub_e.date_started > NOW() - INTERVAL 3 DAY and sub_e.scheduled_execution_id = se.id) AS count_success \
            from ops_rundeck.execution e \
            inner join ops_rundeck.scheduled_execution se on e.scheduled_execution_id = se.id \
                where e.date_started > NOW() - INTERVAL 3 DAY \
                and se.group_path like ? \
            group by e.scheduled_execution_id \
            having count_fail > 0 \
            order by count_fail desc) x \
        order by success_rate desc, x.count_fail desc',
        ['failed', 'succeeded', '%Live'],
        function (err, rows) {
            if (err) throw err;
    
            failures = parser.parseFailed(rows);

            if (socket !== null) {
                socket.emit('screen-data', {type: 'rundeck-failures', data: failures});
            }
        }
    );

    connection.query(
        'select \
            e.id AS id, \
            se.job_name AS job_name, \
            e.date_started AS started, \
            e.date_completed AS finished, \
            e.status AS status, \
            e.status is null AS is_running, \
            (select sum(timestampdiff(second, sub_e.date_started, sub_e.date_completed)) / count(1) \
            from ops_rundeck.execution sub_e \
            where sub_e.scheduled_execution_id = se.id \
            and sub_e.date_started > NOW() - INTERVAL 7 DAY) AS average_duration \
        from ops_rundeck.execution e \
            inner join ops_rundeck.scheduled_execution se on e.scheduled_execution_id = se.id \
        where \
            se.group_path like ? \
        order by is_running desc, e.date_started desc \
        limit 30',
        ['%Live'],
        function (err, rows) {
            if (err) throw err;
    
            recent = parser.parseRecent(rows);

            if (socket !== null) {
                socket.emit('screen-data', {type: 'rundeck-recent', data: recent});
            }
        }
    );
}

module.exports = {
    init: init,
    getFailures: function() {
        return failures;
    },
    getRecent: function () {
        return recent;
    },
    setSocket: function (webSocket) {
        socket = webSocket;
    }
};
