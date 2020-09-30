import { isTest } from "../util/process";
import { getRootDir } from "../util";
import { createConnection } from "typeorm";
import { SqliteConnectionOptions } from "typeorm/driver/sqlite/SqliteConnectionOptions";
import { Server } from "../entity/Server";

const DB_NAME = isTest() ? `:memory:` : `${getRootDir()}/aqueduct.db`;

const options: SqliteConnectionOptions = {
  type: "sqlite",
  database: DB_NAME,
  synchronize: true,
  logging: true,
  entities: ["src/entity/**/*.ts"],
};

export async function init() {
  const connection = await createConnection(options);

  // We want to reset all the connection info on start, and restart the servers.
  const serversRepo = connection.getRepository(Server);
  const servers = await serversRepo.find();

  await Promise.all(servers.map(s => {
      return serversRepo.update(s, { pid: null, running: false });
  }));

  return connection;
}
