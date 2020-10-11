import { Tail } from 'tail';
import { Aqueduct } from '@aqueduct-system/types';

export function tailLogs(server: Aqueduct.Server, ws: any) {
    let tail: Tail;
    try {
        tail = new Tail(`${server.path}/logs/latest.log`);
    } catch (err) {
        console.log('Error:');
        console.log(err);
    }

    tail.on('line', (data) => ws.send(data));
    tail.on('error', (err) => ws.send(err));
}