const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const execAsync = promisify(exec);
const readdir = promisify(fs.readdir);

/**
 * Find all .proto files in a directory
 */
async function findProtoFiles(dir) {
  const files = [];

  try {
    const items = await readdir(dir, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dir, item.name);

      if (item.isDirectory()) {
        // Recursively search subdirectories
        const subFiles = await findProtoFiles(fullPath);
        files.push(...subFiles);
      } else if (item.isFile() && path.extname(item.name) === '.proto') {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`⚠️  Could not read directory ${dir}: ${error.message}`);
  }

  return files;
}

/**
 * Generate TypeScript types from proto files
 */
async function generateTypes() {
  const startTime = Date.now();
  console.log('🔄 Generating TypeScript types from proto files...');

  try {
    // Define paths
    const protoDir = path.join(__dirname, '../src/proto');
    const outputDir = path.join(__dirname, '../src/types');

    // Find all proto files
    const protoFiles = await findProtoFiles(protoDir);

    if (protoFiles.length === 0) {
      console.warn('⚠️  No .proto files found');
      return;
    }

    console.log(`📄 Found ${protoFiles.length} proto file(s):`);
    protoFiles.forEach((file) => {
      console.log(`   - ${path.relative(process.cwd(), file)}`);
    });

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate types for each proto file
    for (const protoFile of protoFiles) {
      const relativePath = path.relative(protoDir, protoFile);
      console.log(`🔄 Processing: ${relativePath}`);

      const command = [
        'pnpm exec protoc',
        '--plugin=protoc-gen-ts_proto=./node_modules/.bin/protoc-gen-ts_proto',
        `--ts_proto_out=${outputDir}`,
        '--ts_proto_opt=nestJs=true',
        `--proto_path=${protoDir}`, // directory, not file
        `${protoDir}/${relativePath}`, // actual file path
      ].join(' ');

      const { stdout, stderr } = await execAsync(command);

      if (stderr) {
        console.warn(`⚠️  Warnings for ${relativePath}:`, stderr);
      }

      if (stdout) {
        console.log(`📝 Output for ${relativePath}:`, stdout.trim());
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ TypeScript types generated successfully in ${duration}ms`);
  } catch (error) {
    console.error('❌ Failed to generate types:', error.message);
    if (error.stdout) console.error('stdout:', error.stdout);
    if (error.stderr) console.error('stderr:', error.stderr);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateTypes();
}

module.exports = { generateTypes };
