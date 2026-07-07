import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./tests",
	timeout: 30_000,
	workers: 1,
	retries: 0,
	reporter: [["list"]],
	use: {
		baseURL: "http://127.0.0.1:4300",
		trace: "retain-on-failure",
	},
	webServer: {
		command: "node server.mjs",
		url: "http://127.0.0.1:4300/",
		reuseExistingServer: true,
	},
});
