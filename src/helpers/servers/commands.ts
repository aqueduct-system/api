import child_process from 'child_process';
import { getManager } from 'typeorm';

import { Server } from '../../entity/Server';
import { Task } from '../../entity/Task';
import { Aqueduct } from '@aqueduct-system/types';
import manager from '../../manager';

const SERVER_LOG_IS_DONE_REGEX = new RegExp(/Done \(.+\)! For help, type "help"/);

async function updateTaskState(taskId: number, state: Aqueduct.TaskState) {
    const tasksRepo = getManager().getRepository(Task);
    const task = await tasksRepo.findOne(taskId);

    task.state = state;
    tasksRepo.save(task);
}

export async function start(server: Server, taskId: number) {
    const serversRepo = getManager().getRepository(Server);
    await updateTaskState(taskId, Aqueduct.TaskState.STARTED);

    // check running - check if pid?
    // check for java
    // check for jar
    // check writeable
    console.log("Launching Minecraft server");
    // spawn server, get PID
    try {
        const child = child_process.spawn(
            "java",
            ["-jar", server.jar_name, "-nogui"],
            { cwd: server.path }
        );

        server.pid = child.pid;
        server.process = child;
        manager.addServer(server);
        serversRepo.save(server);

        console.log("PID:", child.pid);
        child.stdout.setEncoding("utf8");
        child.stdout.on("data", async (data) => {
            console.log("STDOUT:", data);

            if (typeof data === 'string') {
                if (SERVER_LOG_IS_DONE_REGEX.test(data)) {
                    server.running = true;
                    await serversRepo.save(server);

                    // don't need to wait for it
                    updateTaskState(taskId, Aqueduct.TaskState.COMPLETED);
                }
            }
        });
        child.stderr.setEncoding("utf8");
        child.stderr.on("data", (data) => {
            console.log("STDERR:", data);
        });
        // child.on("message", (data) => {
        //     console.log("MESSAGE:", data);
        // });
        // child.on("close", (data) => {
        //     console.log("CLOSE:", data);
        // });
        child.on("error", (data) => {
            console.log("ERROR:", data);
        });
    } catch (err) {
        await updateTaskState(taskId, Aqueduct.TaskState.FAILED);
        console.log(err);
    }
}

export async function stop(server: Server, taskId: number) {
    const serversRepo = getManager().getRepository(Server);
    await updateTaskState(taskId, Aqueduct.TaskState.STARTED);
    console.log("Stopping server...");

    const managedServer = manager.getServer(server.id);
    if (!managedServer.pid || !managedServer.process) {
        console.log("No process to kill.");
        return;
    }

    managedServer.process.on("exit", async (data) => {
        console.log("EXIT:", data);
        server.pid = null;
        server.process = null;
        server.running = false;
        await serversRepo.save(server);
        updateTaskState(taskId, Aqueduct.TaskState.COMPLETED);
    });
    managedServer.process.stdin.write("/stop\n");
}

export async function restart(server: Server, taskId: number) {
    await updateTaskState(taskId, Aqueduct.TaskState.STARTED);
}
