import Koa, { DefaultState, Context } from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import websockify from 'koa-websocket';
import bodyparser from 'koa-bodyparser';
import { getMetrics } from './metrics/metrics';

import { httpRoutes as serversHttpRoutes, ws as serversWs } from './controllers/servers';
import { httpRoutes as tasksHttpRoutes } from "./controllers/tasks";

const app = websockify(new Koa());
const http = new Router({ prefix: '/api' });
const ws = new Router<DefaultState, Context>({ prefix: '/api' });

http.get('/stats', async (ctx) => {
    const metrics = await getMetrics();
    ctx.body = JSON.stringify(metrics);
});
http.use("/servers", serversHttpRoutes);
http.use("/tasks", tasksHttpRoutes);

ws.use("/servers", serversWs.routes(), serversWs.allowedMethods());

app.use(async (ctx, next) => {
    ctx.set('Content-Type', 'application/json');
    await next();
});
app.use(cors());
app.use(bodyparser());

app
    .use(http.routes())
    .use(http.allowedMethods())
app.ws
    .use(ws.routes() as any)
    .use(ws.allowedMethods() as any);

export default app;
