#!/usr/bin/env node
// Validates --env/--scope/--name for aux4/cloud-queue and builds the underlying
// SQS queue name <env>--<scope>--<name> (or <env>--<scope>-- when name is omitted,
// e.g. for 'queue list' which only needs the prefix).
//
// Usage: node name.mjs <env> <scope> <name> <checkLength>
//   env, scope   required, non-empty, must not contain '--'
//   name         optional; when present, must not contain '--'
//   checkLength  'true' to also reject a resulting <name>-dlq.fifo longer than 80
//                characters (only 'create' needs this check)
//
// Prints the built name to stdout on success. On any validation failure, prints
// the error to stderr and exits 1 -- no SQS/aws call ever runs on invalid input.

const [env, scope, name, checkLength] = process.argv.slice(2);

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

if (!env) {
  fail(
    "Error: --env is required (or set AUX4_CLOUD_ENV) -- aux4/cloud-queue names queues <env>--<scope>--<name>"
  );
}

if (!scope) {
  fail(
    "Error: --scope is required (or set AUX4_CLOUD_SCOPE) -- aux4/cloud-queue names queues <env>--<scope>--<name>"
  );
}

const parts = name ? [env, scope, name] : [env, scope];
if (parts.some((part) => part.includes("--"))) {
  fail(
    "Error: --env/--scope/--name must not contain '--' (reserved as the queue-name field separator)"
  );
}

const cloudName = name ? `${env}--${scope}--${name}` : `${env}--${scope}--`;

if (checkLength === "true") {
  const dlqName = `${cloudName}-dlq.fifo`;
  if (dlqName.length > 80) {
    fail(
      `Error: resulting queue name ${cloudName} exceeds the 80-character AWS SQS queue-name limit (counting the -dlq.fifo suffix) -- shorten --env/--scope/--name`
    );
  }
}

process.stdout.write(`${cloudName}\n`);
