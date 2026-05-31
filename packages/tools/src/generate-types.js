const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const execAsync = promisify(exec);
const readdir = promisify(fs.readdir);

async function findServiceProtoFiles(dir) {
  const files = [];
  try {
    const items = await readdir(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files.push(...(await findServiceProtoFiles(fullPath)));
      } else if (item.isFile() && item.name.endsWith('.service.proto')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Could not read directory ${dir}: ${error.message}`);
  }
  return files;
}

async function generateTypes(cwd = process.cwd()) {
  const startTime = Date.now();
  console.log('Generating TypeScript types from proto files...');

  try {
    const protoDir = path.join(cwd, 'src/proto');
    const outputDir = path.join(cwd, 'src/types');

    const protoFiles = await findServiceProtoFiles(protoDir);

    if (protoFiles.length === 0) {
      console.warn('No .service.proto files found');
      return;
    }

    console.log(`Found ${protoFiles.length} proto file(s):`);
    protoFiles.forEach((f) => console.log(`  - ${path.relative(cwd, f)}`));

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const protoFile of protoFiles) {
      const relativePath = path.relative(protoDir, protoFile);
      console.log(`Processing: ${relativePath}`);

      const command = [
        'pnpm exec protoc',
        '--plugin=protoc-gen-ts_proto=./node_modules/.bin/protoc-gen-ts_proto',
        `--ts_proto_out=${outputDir}`,
        '--ts_proto_opt=nestJs=true',
        `--proto_path=${protoDir}`,
        `${protoDir}/${relativePath}`,
      ].join(' ');

      const { stdout, stderr } = await execAsync(command, { cwd });
      if (stderr) console.warn(`Warnings for ${relativePath}:`, stderr);
      if (stdout) console.log(`Output for ${relativePath}:`, stdout.trim());
    }

    console.log(`TypeScript types generated in ${Date.now() - startTime}ms`);
  } catch (error) {
    console.error('Failed to generate types:', error.message);
    if (error.stdout) console.error('stdout:', error.stdout);
    if (error.stderr) console.error('stderr:', error.stderr);
    process.exit(1);
  }
}

if (require.main === module) {
  generateTypes();
}

module.exports = generateTypes;
