import path from "node:path";
// Built as CJS for Electron compatibility.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { app, BrowserWindow, session } = require("electron") as typeof import("electron");

type StartedServer = { port: number; close: () => Promise<void> };

function isLocalUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      (u.protocol === "http:" || u.protocol === "https:") &&
      (u.hostname === "127.0.0.1" || u.hostname === "localhost")
    );
  } catch {
    return false;
  }
}

function setupOfflineHardening() {
  app.on("web-contents-created", (_event, contents) => {
    contents.on("will-navigate", (e, url) => {
      if (!isLocalUrl(url)) e.preventDefault();
    });

    contents.setWindowOpenHandler(({ url }) => {
      return isLocalUrl(url) ? { action: "allow" } : { action: "deny" };
    });
  });

  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const url = details.url ?? "";
    if (!isLocalUrl(url) && (url.startsWith("http://") || url.startsWith("https://"))) {
      callback({ cancel: true });
      return;
    }
    callback({ cancel: false });
  });
}

async function createWindow(url: string) {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once("ready-to-show", () => win.show());
  await win.loadURL(url);
}

async function startEmbeddedServer(): Promise<StartedServer> {
  const userData = app.getPath("userData");
  const dataDir = path.join(userData, "data");

  process.env.NODE_ENV = "production";
  process.env.HOST = "127.0.0.1";
  process.env.PORT = "0";
  process.env.DATA_DIR = dataDir;
  process.env.DATABASE_PATH = path.join(dataDir, "cfima.db");
  // Packaged app: getAppPath() is ".../app.asar" (a file). Node can read dist/ inside it via this path.
  process.env.APP_ROOT = app.getAppPath();

  const { startServer } = await import("../dist-server/start-server.js");
  const started = await startServer();

  return {
    port: started.port,
    close: async () =>
      await new Promise<void>((resolve, reject) => {
        started.server.close((err?: Error) => (err ? reject(err) : resolve()));
      }),
  };
}

app.whenReady().then(async () => {
  setupOfflineHardening();

  const devUrl = process.env.ELECTRON_RENDERER_URL;
  let server: StartedServer | null = null;

  if (devUrl) {
    await createWindow(devUrl);
    return;
  }

  server = await startEmbeddedServer();
  await createWindow(`http://127.0.0.1:${server.port}`);
}).catch((err) => {
  console.error("CFIMA failed to start:", err);
  app.quit();
});

app.on("window-all-closed", async () => {
  if (process.platform !== "darwin") app.quit();
});

