import { Component, NgZone } from 'angular2/core';
import { RouteParams } from 'angular2/router';
declare var io: any;

@Component({
    templateUrl: '/js/components/screen.html'
})
export class ScreenComponent {
    screenName;
    viewDuration = 0;
    previousView;
    config = {};
    viewName;
    socket;
    data = {
        'jenkins-jobs': []
    };
    zone: NgZone;

    constructor(private _routeParams: RouteParams) {
        this.zone = new NgZone({enableLongStackTrace: false});
        this.socket = io();
        this.screenName = this._routeParams.get('name');

        this.initSocket();

        setInterval(() => {
            if (this.viewDuration > 0) {
                this.zone.run(() => {
                    this.viewDuration--;
                });
            }
        }, 1000);
    }

    initSocket() {
        this.socket.emit('name-announce', this.screenName);

        this.socket.on('config', (data) => {
            this.zone.run(() => {
                this.config = data;
            });
        });

        this.socket.on('show-screen', (data) => {
            this.zone.run(() => {
                if ((this.screenName === data.screenName || data.screenName === 'all') && this.viewName !== data.viewName) {
                    if (data.duration !== undefined && this.previousView === undefined) {
                        this.previousView = this.viewName;
                        setTimeout(() => {
                            this.viewName = this.previousView;
                            this.previousView = undefined;
                        }, data.duration * 1000);

                        this.viewDuration = data.duration;
                    }

                    this.viewName = data.viewName;
                }
            });
        });

        this.socket.on('screen-data', (data) => {
            this.zone.run(() => {
                this.data[data.type] = data.data;
            });
        });

        this.socket.on('reload', (data) => {
            if (this.screenName === data || data === 'all') {
                location.reload();
            }
        });
    }
}
