import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const root = new URL("../", import.meta.url);
const exceptionsUrl = new URL("../security/audit-exceptions.json", import.meta.url);
const exceptions = JSON.parse(await readFile(exceptionsUrl, "utf8"));
const audit = spawnSync("bun", ["audit", "--json", "--audit-level=high"], {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

if (audit.error) throw audit.error;

let report;
try {
  report = JSON.parse(audit.stdout || "{}");
} catch {
  throw new Error(`bun audit did not return JSON: ${audit.stderr.trim()}`);
}

const blocking = new Map(
  Object.entries(report)
    .map(([packageName, advisories]) => [
      packageName,
      advisories.filter(({ severity }) => severity === "critical" || severity === "high"),
    ])
    .filter(([, advisories]) => advisories.length > 0),
);

const critical = [...blocking.entries()]
  .flatMap(([packageName, advisories]) => advisories
    .filter(({ severity }) => severity === "critical")
    .map(({ id }) => `${packageName}#${id}`));
if (critical.length > 0) {
  throw new Error(`Critical dependency advisories: ${critical.join(", ")}`);
}

const expiry = new Date(`${exceptions.expires}T23:59:59Z`);
if (!Number.isFinite(expiry.getTime()) || expiry < new Date()) {
  throw new Error(`Security exception expired on ${exceptions.expires}.`);
}

const allowed = new Map(
  (exceptions.highSeverityExceptions ?? []).map((exception) => [
    exception.package,
    exception,
  ]),
);
const unexpected = [];
for (const [packageName, advisories] of blocking) {
  const exception = allowed.get(packageName);
  const actualIds = advisories.map(({ id }) => id).sort((left, right) => left - right);
  const expectedIds = [...(exception?.advisoryIds ?? [])].sort((left, right) => left - right);
  if (!exception || !exception.issue || JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
    unexpected.push(`${packageName} (advisories ${actualIds.join(", ")})`);
  }
}
if (unexpected.length > 0) {
  throw new Error(`Unexpected high dependency advisories: ${unexpected.join("; ")}`);
}

const resolved = [...allowed.keys()].filter((packageName) => !blocking.has(packageName));
if (resolved.length > 0) {
  throw new Error(`Remove resolved audit exceptions: ${resolved.join(", ")}`);
}

if (audit.status !== 0 && blocking.size === 0) {
  throw new Error(`bun audit exited with status ${audit.status ?? "unknown"}: ${audit.stderr.trim()}`);
}

console.log(
  `Dependency audit checked: ${blocking.size} time-limited high package exception, ` +
    `0 critical; exception expires ${exceptions.expires}.`,
);
