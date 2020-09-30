import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { Aqueduct } from '@aqueduct/types';

@Entity()
export class Task implements Aqueduct.Task {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: Aqueduct.TaskState.UNSTARTED })
    state: Aqueduct.TaskState;

    @Column({ nullable: true })
    meta: string;

    @Column({ nullable: true })
    result: string;

    @Column({ type: "datetime", default: new Date().toISOString() })
    start_time: string;

    @Column({ type: "datetime", nullable: true })
    end_time: string;
}
