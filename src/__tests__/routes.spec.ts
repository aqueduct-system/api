import request from "supertest";
import { Connection } from "typeorm";

import app from '../server';
import { init } from "../db";
import manager from "../manager";
import { Server } from "../entity/Server";

import serversIndex from "./cassettes/servers.json";
import serverCreate from "./cassettes/create.json";
import serverUpdate from "./cassettes/update.json";
import tasksCassette from './cassettes/tasks.json';
import { Aqueduct } from "@aqueduct/types";

let server;

async function seed(connection: Connection) {
    const repo = connection.getRepository(Server);
    const promises = serversIndex.data.map((s: Aqueduct.ServerAttributes) => {
        let server = repo.create(s);
        return repo.save(server);
    });
    await Promise.all(promises);
}

beforeAll(async () => {
    const connection = await init();
    await seed(connection);

    await manager.init();
    server = app.listen(5001);
});

afterAll(() => {
    server.close();
});

describe('/servers endpoint', () => {
    it('Should get all servers', async () => {
        const response = await request(server).get('/api/servers');
        expect(response.status).toEqual(200);
        expect(response.body).toEqual(serversIndex);
    });

    it('Can get a single server', async () => {
        const response = await request(server).get("/api/servers/1");
        expect(response.status).toEqual(200);
        expect(response.body).toEqual({ data: serversIndex.data[0] });
    });

    it('Can create a server', async () => {
        const response = await request(server).post('/api/servers').send(serverCreate);
        expect(response.status).toEqual(200);

        const expected = {
            data: Object.assign({}, serverCreate, { id: 3, pid: null, running: false })
        };
        const getResponse = await request(server).get("/api/servers/3");
        expect(getResponse.body).toEqual(expected);
    });

    it('Can update a server', async () => {
        const response = await request(server).put('/api/servers/1').send(serverUpdate);
        expect(response.status).toEqual(200);

        const expected = {
            data: Object.assign({}, serverUpdate, { id: 1, pid: null, running: true }),
        }
        expect(response.body).toEqual(expected);
    })

    it.skip('Can run the restart command', async () => {
        const response = await request(server)
          .post("/api/servers/1/commands")
          .send({ command: "restart" });
        expect(response.status).toEqual(200);

        const task = response.body.data;
        expect(task.id).toEqual(tasksCassette.started.id);
        expect(task.state).toEqual(tasksCassette.started.state);
        expect(task.result).toEqual(tasksCassette.started.result);
        expect(task.start_time).not.toBeNull();
        expect(task.end_time).toEqual(tasksCassette.started.end_time);

        // TODO: put restartServer() into its own function
        // then mock it here to do a short setTimeout and then check the results
    });
});

// describe('/tasks endpoint', () => {

// });