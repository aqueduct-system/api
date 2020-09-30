import "reflect-metadata";
import { init } from "./db";
import app from "./server";
import manager from "./manager";

init()
  .then(async (connection) => {
      await manager.init();
      app.listen(5000);
  })
  .catch((error) => console.log(error));
