import si from 'systeminformation';

export async function getMetrics() {
    const ramResults = await si.mem();
    const ram = {
        percentage: Number((ramResults.used / ramResults.total).toPrecision(3)),
        total: ramResults.total,
        used: ramResults.used,
    };

    const loadResults = await si.currentLoad();
    const cpu = { percentage: loadResults.currentload, total: -1, used: -1 }

    const fsResults = (await si.fsSize()).map(data => {
        return {
            size: data.size,
            used: data.used,
            use: data.use,
            fs: data.fs,
            mount: data.mount,
        };
    });
    const disk = { percentage: fsResults[0].use, total: fsResults[0].size, used: fsResults[0].used };

    const networkResults = (await si.networkStats()).map(data => {
        return {
            received_bytes: data.rx_bytes,
            transferred_bytes: data.tx_bytes,
            received_bytes_s: data.rx_sec,
            transferred_bytes_s: data.tx_sec,
        }
    })
    const network = {
        percentage: networkResults[0].transferred_bytes_s,
        total: networkResults[0].transferred_bytes,
        used: networkResults[0].transferred_bytes,
    }

    return Object.assign({ cpu }, { ram }, { disk }, { network });
}