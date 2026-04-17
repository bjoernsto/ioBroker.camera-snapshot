"use strict";

const utils = require("@iobroker/adapter-core");
const { RingApi } = require("ring-client-api");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

class CameraSnapshot extends utils.Adapter {
    constructor(options) {
        super({
            ...options,
            name: "camera-snapshot",
        });
        this.on("ready", this.onReady.bind(this));
        this.on("stateChange", this.onStateChange.bind(this));
        this.on("unload", this.onUnload.bind(this));
        this.intervals = {};
        this.ringApi = null;
    }

    async onReady() {
        this.log.info("Adapter starting...");
        await this.setStateAsync("info.connection", false, true);

        const cameras = this.config.cameras || [];
        if (cameras.length === 0) {
            this.log.warn("No cameras configured.");
            return;
        }

        // Initialize Ring API if needed
        const ringCameras = cameras.filter(c => c.type === "ring");
        if (ringCameras.length > 0) {
            const refreshToken = this.config.ringRefreshToken;
            if (refreshToken) {
                this.ringApi = new RingApi({ refreshToken });
                this.log.info("Ring API initialized.");
            } else {
                this.log.error("Ring cameras configured but no refresh token provided.");
            }
        }

        for (const camera of cameras) {
            await this.setupCamera(camera);
        }

        await this.setStateAsync("info.connection", true, true);
    }

    async setupCamera(camera) {
        const camId = camera.name.replace(/[^a-zA-Z0-9]/g, "_");
        
        // Create objects for each camera
        await this.setObjectNotExistsAsync(camId, {
            type: "channel",
            common: { name: camera.name },
            native: {},
        });

        await this.setObjectNotExistsAsync(`${camId}.snapshot`, {
            type: "state",
            common: {
                name: "Last Snapshot Path",
                type: "string",
                role: "text",
                read: true,
                write: false,
            },
            native: {},
        });

        await this.setObjectNotExistsAsync(`${camId}.trigger`, {
            type: "state",
            common: {
                name: "Trigger Manual Snapshot",
                type: "boolean",
                role: "button",
                read: false,
                write: true,
            },
            native: {},
        });

        // Set interval
        const intervalMs = (parseInt(camera.interval) || 60) * 1000;
        this.intervals[camId] = setInterval(() => {
            this.takeSnapshot(camera, camId);
        }, intervalMs);

        // Take initial snapshot
        this.takeSnapshot(camera, camId);
        
        this.log.info(`Camera ${camera.name} (${camera.type}) setup with interval ${camera.interval}s`);
    }

    async takeSnapshot(camera, camId) {
        this.log.debug(`Taking snapshot for ${camera.name}...`);
        const fileName = `${camId}.jpg`;
        const filePath = path.join(utils.getAbsoluteDefaultDataDir(), "camera-snapshot", fileName);

        // Ensure directory exists
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        try {
            if (camera.type === "ring") {
                await this.takeRingSnapshot(camera, filePath);
            } else if (camera.type === "tapo" || camera.type === "rtsp") {
                await this.takeRtspSnapshot(camera, filePath);
            }

            this.setState(`${camId}.snapshot`, filePath, true);
            this.log.debug(`Snapshot saved to ${filePath}`);
        } catch (err) {
            this.log.error(`Failed to take snapshot for ${camera.name}: ${err.message}`);
        }
    }

    async takeRingSnapshot(camera, filePath) {
        if (!this.ringApi) throw new Error("Ring API not initialized");
        const locations = await this.ringApi.getLocations();
        let ringCam = null;
        
        for (const location of locations) {
            const cameras = await location.getCameras();
            ringCam = cameras.find(c => c.name === camera.ringName || c.id.toString() === camera.ringId);
            if (ringCam) break;
        }

        if (!ringCam) throw new Error(`Ring camera ${camera.ringName || camera.ringId} not found`);
        
        const snapshotBuffer = await ringCam.getSnapshot();
        fs.writeFileSync(filePath, snapshotBuffer);
    }

    async takeRtspSnapshot(camera, filePath) {
        return new Promise((resolve, reject) => {
            const url = camera.url; // e.g. rtsp://user:pass@ip:554/stream1
            ffmpeg(url)
                .inputOptions(["-rtsp_transport", "tcp"]) // Use TCP for better stability
                .outputOptions(["-frames:v 1", "-q:v 2"])
                .on("end", () => resolve())
                .on("error", (err) => reject(err))
                .save(filePath);
        });
    }

    onStateChange(id, state) {
        if (state && !state.ack) {
            const parts = id.split(".");
            const camId = parts[parts.length - 2];
            const action = parts[parts.length - 1];

            if (action === "trigger") {
                const camera = this.config.cameras.find(c => c.name.replace(/[^a-zA-Z0-9]/g, "_") === camId);
                if (camera) {
                    this.takeSnapshot(camera, camId);
                }
            }
        }
    }

    onUnload(callback) {
        try {
            Object.values(this.intervals).forEach(clearInterval);
            callback();
        } catch (e) {
            callback();
        }
    }
}

if (require.main !== module) {
    module.exports = (options) => new CameraSnapshot(options);
} else {
    new CameraSnapshot();
}
