import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { Aqueduct } from "@aqueduct/types";
import * as commands from "../servers/commands";
import { ChildProcess } from "child_process";

@Entity()
export class Server implements Aqueduct.Server {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  world_name: string;

  @Column()
  motd: string;

  @Column()
  ip: string;

  @Column()
  port: number;

  @Column({ nullable: true })
  pid: number;

  @Column()
  path: string;

  @Column()
  jar_name: string;

  @Column("text")
  properties: string;

  @Column({ type: "boolean", default: false })
  running: boolean;

  process?: ChildProcess;

  // private async start(taskId: number) {
  //   // TODO: work with task
  //   commands.start(this);
  // }

  // private async stop(taskId: number) {
  //   // TODO: work with task
  //   commands.stop(this);
  // }

  // private restart(taskId: number) {
  //   const task = new Task(taskId);

  //   console.log("restarting server...");
  //   task.state = Aqueduct.TaskState.STARTED;
  //   task.save();
  //   setTimeout(() => {
  //     console.log("server restarted!");
  //     task.state = Aqueduct.TaskState.COMPLETED;
  //     task.result = JSON.stringify({ result: "restarted" });
  //     task.save();
  //   }, 3000);
  // }

  // command(command: Aqueduct.ServerCommand): number {
  //   const taskId = Task.create();
  //   switch (command) {
  //     case "restart":
  //       this.restart(taskId);
  //       break;
  //     case "start":
  //       this.start(taskId);
  //       break;
  //     case "stop":
  //       this.stop(taskId);
  //       break;
  //     default:
  //       console.log("skipping");
  //   }

  //   return taskId;
  // }
}
