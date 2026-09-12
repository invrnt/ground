import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const action = process.argv[2];
const actions = ['setup', 'start', 'restart', 'stop'];
const envPath = resolve(root, '.env');
const compose = ['compose', '--project-directory', root, '--file', resolve(root, 'compose.yaml')];
let environment = { ...process.env };

function run(args: string[], message: string, quiet = false): void {
  const result = spawnSync('docker', args, { cwd: root, env: environment, stdio: quiet ? 'pipe' : 'inherit' });
  if (result.error || result.status !== 0) throw new Error(message);
}

try {
  if (!action || !actions.includes(action) || process.argv.length > 3) throw new Error('Use pnpm run setup, pnpm start, pnpm restart or pnpm stop.');
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 24 || major >= 27) throw new Error('Use Node 24.21.0 and pnpm 11.24.0. Docker Engine/Desktop with Compose is also required.');
  run(['compose', 'version'], 'Docker with the Compose plugin is required. Install/start Docker, then retry.', true);
  run(['info', '--format', '{{.ServerVersion}}'], 'Docker is not running or this user cannot access it. Start Docker and check daemon access, then retry.', true);
  if (!existsSync(envPath)) {
    if (action !== 'setup') throw new Error('No .env found. Run pnpm run setup first.');
    const version = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
    const generated: Record<string, string> = {
      POSTGRES_PASSWORD: randomBytes(24).toString('hex'),
      SESSION_SECRET: randomBytes(32).toString('hex'),
      PUBLIC_BASE_URL: 'http://localhost:3000',
      ...Object.fromEntries(['ADMIN', 'LUIS', 'ANA', 'JUAN', 'PURCHASING'].map(name => [`DEMO_PASSWORD_${name}`, randomBytes(18).toString('hex')])),
      CODE_VERSION: version.status === 0 ? version.stdout.trim() : '',
    };
    const template = readFileSync(resolve(root, '.env.example'), 'utf8').replace(/^([A-Z_]+)=.*$/gm, (line: string, key: string) => generated[key] === undefined ? line : `${key}=${generated[key]}`);
    writeFileSync(envPath, template, { flag: 'wx', mode: 0o600 });
    console.info('Created private .env with local passwords. View that file locally for login credentials; add provider keys when available.');
  }
  // Values remain in memory and the child environment, never command arguments or logs.
  environment = { ...process.env, ...parseEnv(readFileSync(envPath, 'utf8')) };
  const password = environment['POSTGRES_PASSWORD'];
  if (!password) throw new Error('Set POSTGRES_PASSWORD in .env. Existing .env was not changed.');
  environment['GROUND_COMPOSE_DATABASE_URL'] = `postgres://ground:${encodeURIComponent(password)}@db:5432/ground`;
  if (action !== 'stop') {
    const missing = ['PUBLIC_BASE_URL', 'SESSION_SECRET', ...(action === 'setup' ? ['DEMO_PASSWORD_ADMIN', 'DEMO_PASSWORD_LUIS', 'DEMO_PASSWORD_ANA', 'DEMO_PASSWORD_JUAN', 'DEMO_PASSWORD_PURCHASING'] : [])].filter(name => !environment[name]?.trim());
    if (missing.length) throw new Error(`Set these names in .env, then retry: ${missing.join(', ')}. Existing values were not changed.`);
    if ((environment['SESSION_SECRET']?.length ?? 0) < 32) throw new Error('SESSION_SECRET must have at least 32 characters.');
    if (action === 'setup' && ['ADMIN', 'LUIS', 'ANA', 'JUAN', 'PURCHASING'].some(name => (environment[`DEMO_PASSWORD_${name}`]?.length ?? 0) < 12)) throw new Error('Each DEMO_PASSWORD_* must have at least 12 characters.');
    const url = new URL(environment['PUBLIC_BASE_URL'] ?? '');
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('PUBLIC_BASE_URL must be an http(s) origin without credentials or a path.');
    const port = Number(environment['PORT'] || '3000');
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a number between 1 and 65535.');
  }
  // Quiet validation avoids printing Docker's resolved environment, including credentials.
  run([...compose, 'config', '--quiet'], 'Compose configuration is invalid. Check .env and compose.yaml without printing resolved secrets.', true);
  if (action === 'setup') {
    run([...compose, 'build', 'api', 'worker'], 'Image build failed. Fix the build and run pnpm run setup again.');
    run([...compose, 'stop', '--timeout', '300', 'api', 'worker'], 'Could not stop API and worker safely.');
    run([...compose, 'up', '-d', '--wait', '--wait-timeout', '120', 'db'], 'Database startup failed. Existing volumes were preserved.');
    for (const command of ['db:migrate', 'demo:configure', 'demo:seed']) run([...compose, 'run', '--rm', '--no-deps', 'api', 'pnpm', command], `Setup failed at ${command}. Existing volumes were preserved; fix configuration and rerun setup.`);
    console.info('Setup complete. Run pnpm start. Provider access and the live demo still require configured accounts.');
  } else if (action === 'stop') {
    run([...compose, 'stop', '--timeout', '300', 'api', 'worker'], 'Could not stop API and worker safely. Database was left running.');
    run([...compose, 'stop', 'db'], 'Could not stop the database.');
    console.info('Stopped. Database and private files are preserved. Run pnpm start to resume.');
  } else {
    if (action === 'restart') {
      run([...compose, 'stop', '--timeout', '300', 'api', 'worker'], 'Could not stop API and worker safely.');
      run([...compose, 'up', '-d', '--wait', '--wait-timeout', '120', 'db'], 'Database startup failed.');
      run([...compose, 'up', '-d', '--no-deps', '--force-recreate', '--wait', '--wait-timeout', '120', 'api', 'worker'], 'Restart failed. Check Docker service status; data was preserved.');
    } else {
      run([...compose, 'up', '-d', '--build', '--wait', '--wait-timeout', '120'], 'Startup failed. If this is the first start, run pnpm run setup. Data was preserved.');
    }
    console.info(`Ground is ready at ${new URL('/login', environment['PUBLIC_BASE_URL']).href}`);
    console.info('This checks local service health, not live provider access.');
  }
} catch (error) {
  // Only our fixed messages are shown; built-in parsing errors may include user configuration.
  const message = error instanceof Error && !(error instanceof TypeError) ? error.message : 'Invalid configuration. Check .env locally; no values were changed.';
  console.error(message);
  process.exitCode = 1;
}
