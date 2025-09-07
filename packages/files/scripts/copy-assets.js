const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const copyFile = promisify(fs.copyFile);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

/**
 * Recursively copy files from source to destination
 */
async function copyRecursive(src, dest, filter = null) {
  try {
    const srcStat = await stat(src);

    if (srcStat.isDirectory()) {
      // Create destination directory
      await mkdir(dest, { recursive: true });

      // Read directory contents
      const items = await readdir(src);

      // Copy each item
      for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        await copyRecursive(srcPath, destPath, filter);
      }
    } else if (srcStat.isFile()) {
      // Apply filter if provided
      if (filter && !filter(src)) {
        return;
      }

      // Ensure destination directory exists
      await mkdir(path.dirname(dest), { recursive: true });

      // Copy file
      await copyFile(src, dest);
      console.log(
        `✅ Copied: ${path.relative(process.cwd(), src)} → ${path.relative(process.cwd(), dest)}`,
      );
    }
  } catch (error) {
    console.error(`❌ Error copying ${src}: ${error.message}`);
    throw error;
  }
}

/**
 * Filter function to include only .proto files
 */
function isProtoFile(filePath) {
  return path.extname(filePath) === '.proto';
}

/**
 * Main copy assets function
 */
async function copyAssets() {
  const startTime = Date.now();
  console.log('🔄 Copying proto assets...');

  try {
    // Define paths
    const srcProtoDir = path.join(__dirname, '../src/proto');
    const distProtoDir = path.join(__dirname, '../dist/proto');

    // Check if source proto directory exists
    if (!fs.existsSync(srcProtoDir)) {
      console.warn(`⚠️  Source proto directory not found: ${srcProtoDir}`);
      return;
    }

    // Copy all .proto files recursively
    await copyRecursive(srcProtoDir, distProtoDir, isProtoFile);

    const duration = Date.now() - startTime;
    console.log(`✅ Proto assets copied successfully in ${duration}ms`);
  } catch (error) {
    console.error('❌ Failed to copy assets:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  copyAssets();
}

module.exports = { copyAssets, copyRecursive };
