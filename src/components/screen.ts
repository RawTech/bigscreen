import { Component, NgZone } from 'angular2/core';
import { RouteParams } from 'angular2/router';
declare var io: any;

@Component({
    templateUrl: '/js/components/screen.html'
})
export class ScreenComponent {
    name;
    viewData;
    viewType;
    socket;
    data = {};
    zone: NgZone;

    constructor(private _routeParams: RouteParams) {
        this.zone = new NgZone({enableLongStackTrace: false});
        this.socket = io();
        this.name = this._routeParams.get('name');

        this.initSocket();
    }

    initSocket() {
        this.socket.emit('name-announce', this.name);

        this.socket.on('show-screen', (data) => {
            this.zone.run(() => {
                this.viewData = data;
                this.viewType = data.type;
            });
        });

        this.socket.on('screen-data', (data) => {
            this.zone.run(() => {
                this.data[data.type] = data.data;
            });
        });
    }
}
