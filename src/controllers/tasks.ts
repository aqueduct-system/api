import { Response, Route, URL, route, router } from "typera-koa";
import { getManager } from "typeorm";
import { Aqueduct } from "@aqueduct/types";

import { Task } from "../entity/Task";
import { CollectionResponse, ResourceResponse } from "./responses";

const listTasks: Route<CollectionResponse<Aqueduct.Task>> = route("get", "/")()(
    async (request) => {
        const repository = getManager().getRepository(Task);
        const tasks: Task[] = await repository.find();

        return Response.ok({ data: tasks });
    }
);

const listTask: Route<ResourceResponse<Aqueduct.Task>> = route("get", "/", URL.int("id"))()(
    async (request) => {
        const id = request.routeParams.id;
        const repository = getManager().getRepository(Task);

        const task = await repository.findOne(id);

        if (task != null) {
            return Response.ok({ data: task });
        }
        return Response.notFound();
    }
);

const httpRoutes = router(
    listTasks,
    listTask,
).handler();

export { httpRoutes };
