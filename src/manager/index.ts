import { Server } from '../entity/Server';
import { getManager, Not, IsNull } from 'typeorm';

type ServerMap = {
    [id: number]: Server;
}

/**
 * Hold the pool of currently active servers and manage them.
 */
class Manager {
    private servers: ServerMap;

    constructor() {
        this.servers = {};
    }

    async init() {
        const repository = getManager().getRepository(Server);
        const servers = await repository.find({ where: { pid: Not(IsNull) }});

        servers.forEach((server) => this.servers[server.id] = server);
    }

    addServer(server: Server) {
        this.servers[server.id] = server;
        console.log('Added new server:', server.id);
    }

    getServer(id: number): Server | undefined {
        console.log('Retrieving server:', id);
        const server = this.servers[id];

        return server;
    }

    getAll(): Server[] {
        const servers = Object.values(this.servers);
        return servers;
    }
}

export default new Manager();
