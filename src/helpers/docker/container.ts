import Dockerode from "dockerode";

const dockerode = new Dockerode();

export class DockerContainer {
    containerId: string;
    container: Dockerode.Container;
    stream: NodeJS.ReadWriteStream;

    constructor(config: object) {}

    /**
     * Try and attach to the instance's container.
     *
     * @returns Promise<boolean> True if container is running, otherwise false.
     */
    async attemptReattach() {
        try {
            await this.container.inspect();
            await this.attachStreams();
            return Promise.resolve(true);
        } catch (err) {
            return Promise.resolve(false);
        }
    }

    /**
     * Build the docker container.
     */
    async build() {
        const containerConfig: Dockerode.ContainerCreateOptions = {
            Image: "openjdk:8",
            name: "docker-test",
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            OpenStdin: true,
            Tty: true,
            HostConfig: {
                Binds: ["/home/container:/home/container"],
            },
        };

        try {
            this.container = await dockerode.createContainer(containerConfig);
        } catch (err) {
            console.error("Unable to create Docker container.");
            console.error(err);
        }
    }

    /**
     * Tear down the docker container.
     */
    async destroy(): Promise<any> {
        const container = dockerode.getContainer(this.containerId);

        try {
            await container.inspect();
            return this.container.remove();
        } catch (err) {
            console.log(
                "Unable to remove Docker container - could not find it?"
            );
        }
    }

    /**
     * Start the docker container.
     */
    async start() {
        try {
            await this.container.inspect();
            await this.container.start();
        } catch (err) {
            console.error("Unable to start Docker container.");
            console.error(err);
        }

        this.attachStreams();
    }

    /**
     * Stop the container.
     *
     */
    async stop() {
        this.container.stop();
    }

    async kill() {
        this.container.kill();
    }

    /**
     * Send a message to the container's STDIN.
     *
     * @param message The message to send.
     */
    async write(message: string) {
        // this.stream.write(message);
        return Promise.reject("Unimplemented");
    }

    /**
     * Attach to the docker container streams.
     */
    private async attachStreams() {
        const stream = await this.container.attach({
            stream: true,
            stdin: true,
            stdout: true,
            strerr: true,
        });

        this.stream = stream;
        this.stream.setEncoding("utf8");

        this.stream.on("data", (data) => {
            // don't actually do anything for now
            // could do throttling or something here
        });
        this.stream.on("error", (err) => {
            console.error(err);
            // do something else too?
        });
        this.stream.on("end", () => {
            this.stream = null;
        });
    }
}
