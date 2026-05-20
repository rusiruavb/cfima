"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var import_node_path = __toESM(require("node:path"), 1);
const { app, BrowserWindow, session } = require("electron");
function isLocalUrl(url) {
  try {
    const u = new URL(url);
    return (u.protocol === "http:" || u.protocol === "https:") && (u.hostname === "127.0.0.1" || u.hostname === "localhost");
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
async function createWindow(url) {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    webPreferences: {
      preload: import_node_path.default.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  win.once("ready-to-show", () => win.show());
  await win.loadURL(url);
}
async function startEmbeddedServer() {
  const userData = app.getPath("userData");
  const dataDir = import_node_path.default.join(userData, "data");
  process.env.NODE_ENV = "production";
  process.env.HOST = "127.0.0.1";
  process.env.PORT = "0";
  process.env.DATA_DIR = dataDir;
  process.env.DATABASE_PATH = import_node_path.default.join(dataDir, "cfima.db");
  const { startServer } = await import("../dist-server/start-server.js");
  const started = await startServer();
  return {
    port: started.port,
    close: async () => await new Promise((resolve, reject) => {
      started.server.close((err) => err ? reject(err) : resolve());
    })
  };
}
app.whenReady().then(async () => {
  setupOfflineHardening();
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  let server = null;
  if (devUrl) {
    await createWindow(devUrl);
    return;
  }
  process.chdir(app.getAppPath());
  server = await startEmbeddedServer();
  await createWindow(`http://127.0.0.1:${server.port}`);
}).catch((err) => {
  console.error("CFIMA failed to start:", err);
  app.quit();
});
app.on("window-all-closed", async () => {
  if (process.platform !== "darwin") app.quit();
});
//# sourceMappingURL=main.cjs.map