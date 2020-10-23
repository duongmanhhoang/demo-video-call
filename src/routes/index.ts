import * as express from 'express';
import * as path from 'path';

export class Routes {
    private app: express.Application;

    constructor(app) {
        this.app = app;
        this.setStaticDir();
    }

    private setStaticDir(): void {
        this.app.use(express.static(path.join(__dirname, '../views')));
    }

    private home(): void {
        this.app.get('/', (request, response) => {
            response.sendFind('index.html');
        });
    }

    public getRoutes(): void {
        this.home();
    }
}
