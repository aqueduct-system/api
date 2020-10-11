import { DefaultState, Context } from "koa";
import Router from "@koa/router";
import { Parser, Response, Route, URL, route, router } from "typera-koa";
import * as t from "io-ts";
import { getManager } from "typeorm";
import { Aqueduct } from "@aqueduct-system/types";
import { read } from "read-last-lines";

import manager from "../manager";
import { Server } from "../entity/Server";
import { Task } from "../entity/Task";
import { tailLogs } from "../logs/logs";
import { CollectionResponse, ResourceResponse, CreateResponse, UpdateResponse, DeleteResponse } from "./responses";
import * as commands from '../helpers/servers/commands';
import { ping } from "../helpers/servers/ping";

const createServerBody = t.type({
    motd: t.string,
    world_name: t.string,
    ip: t.string,
    port: t.number,
    path: t.string,
    jar_name: t.string,
    properties: t.string,
});

const updateServerBody = t.partial(createServerBody.props);

const commandServerBody = t.type({
    command: t.union([t.literal('stop'), t.literal('start'), t.literal('restart')]),
});


const listServers: Route<CollectionResponse<Aqueduct.Server>> = route.get("/")()(
    async (request) => {
        const repository = getManager().getRepository(Server);
        const servers: Server[] = await repository.find();

        return Response.ok({ data: servers });
    }
);

const listServer: Route<ResourceResponse<Aqueduct.Server>> = route.get("/", URL.int("id"))()(async (request) => {
    const id = request.routeParams.id;

    const repository = getManager().getRepository(Server);
    const server = await repository.findOne(id);

    if (server != null) {
        return Response.ok({ data: server });
    }
    return Response.notFound();
});

const createServer: Route<CreateResponse<Aqueduct.ServerAttributes, Aqueduct.Server>> = route.post("/")(
    Parser.bodyP(createServerBody, (errors) => {
        const errorBody: Partial<Aqueduct.ServerAttributes> = {};
        errors.forEach((err) => {
            const ctx = err.context[1];
            errorBody[
                ctx.key
            ] = `Expected type '${ctx.type.name}' but got value: ${ctx.actual}`;
        });

        return Response.badRequest({ errors: errorBody });
    })
)(async (request) => {
    const attrs = request.body;

    const repository = getManager().getRepository(Server);
    let server = repository.create(attrs);
    server = await repository.save(server);

    if (server != null) {
        return Response.ok({ data: server });
    }
    return Response.notFound();
});

const updateServer: Route<UpdateResponse<Aqueduct.ServerAttributes, Aqueduct.Server>> = route.put("/", URL.int("id"))(
    Parser.bodyP(updateServerBody, (errors) => {
        const errorBody: Partial<Aqueduct.ServerAttributes> = {};
        errors.forEach((err) => {
            const ctx = err.context[1];
            errorBody[
                ctx.key
            ] = `Expected type '${ctx.type.name}' but got value: ${ctx.actual}`;
        });

        return Response.badRequest({ errors: errorBody });
    })
)(async (request) => {
    const id = request.routeParams.id;
    const attrs = request.body;

    const repository = getManager().getRepository(Server);
    let server = await repository.preload({ id, ...attrs });

    if (server != null) {
        server = await repository.save(server);
        return Response.ok({ data: server });
    }
    return Response.notFound();
});

const deleteServer: Route<DeleteResponse> = route.delete("/", URL.int("id"))()(async (request) => {
    const id = request.routeParams.id;

    const repository = getManager().getRepository(Server);
    const existing = await repository.findOne(id);

    if (!existing) {
        return Response.notFound();
    }

    await repository.delete(id);
    return Response.ok();
});

const commandServer: Route<ResourceResponse<Aqueduct.Task> | Response.BadRequest<string>> = route.post("/", URL.int("id"), "/commands")(
    Parser.body(commandServerBody)
)(
    async (request) => {
        const id = request.routeParams.id;
        const { command } = request.body;

        const serversRepo = getManager().getRepository(Server);
        const server = await serversRepo.findOne(id);

        if (!server) {
            return Response.notFound();
        }

        const tasksRepo = getManager().getRepository(Task);
        const task = tasksRepo.create();
        await tasksRepo.save(task);

        switch (command) {
            case 'start':
                commands.start(server, task.id);
                break;
            case 'stop':
                commands.stop(server, task.id);
                break;
            case 'restart':
                commands.restart(server, task.id);
                break;
        }

        return Response.ok({ data: task });
    }
);

const pingServer: Route<any> = route.get('/', URL.int('id'), '/ping')()(
    async (request) => {
        const id = request.routeParams.id;
        const server = manager.getServer(id);
        const res = await ping('localhost', server.port);

        return Response.ok({ data: res });
    }
)

const httpRoutes = router(
    listServers,
    listServer,
    createServer,
    updateServer,
    deleteServer,
    commandServer,
    pingServer,
).handler();

async function wsLogs(ctx: Context): Promise<void> {
    const server = manager.getServer(ctx.params.id);
    if (!server) return;

    try {
        const rawLines = await read(`${server.path}/logs/latest.log`, 10);
        const lines = rawLines.split("\n");
        lines.forEach((line) => {
            ctx.websocket.send(`${line}\n`);
        });
    } catch (err) {
        console.log(err);
    }
    tailLogs(server, ctx.websocket);
}

async function wsServerPing(ctx: Context): Promise<void> {
    const server = manager.getServer(ctx.params.id);

    ctx.websocket.send(`server data (${server.id}):\n`);
    try {
        const res = await ping('localhost', server.port);
        console.log('res!:', res);
        ctx.websocket.send(JSON.stringify(res));
    } catch (err) {
        console.log(err);
        ctx.websocket.send(err);
    }

}

const ws = new Router<DefaultState, Context>();
ws.get("/:id/logs", wsLogs);
ws.get("/:id/ping", wsServerPing);

export { httpRoutes, ws };
