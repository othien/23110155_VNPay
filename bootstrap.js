/**
 * Bootstrap script: Download npm và cài dependencies cho project
 * Chạy bằng: node bootstrap.js
 */
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const zlib = require('zlib');

const NODE = process.execPath;
const PROJECT_DIR = __dirname;
const NODE_MODULES = path.join(PROJECT_DIR, 'node_modules');
const NODE_DIR = path.dirname(NODE);

console.log('Node.js:', NODE);
console.log('Version:', process.version);
console.log('Project:', PROJECT_DIR);

// Hàm download file
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const protocol = url.startsWith('https') ? https : http;
    
    function doGet(url) {
      protocol.get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.destroy();
          const redirectUrl = res.headers.location;
          console.log('  Redirect to:', redirectUrl);
          // Handle redirect (may switch protocol)
          const rProto = redirectUrl.startsWith('https') ? https : http;
          const rFile = fs.createWriteStream(dest);
          rProto.get(redirectUrl, (r2) => {
            r2.pipe(rFile);
            rFile.on('finish', () => { rFile.close(); resolve(); });
          }).on('error', reject);
          return;
        }
        res.pipe(file);
        file.on('finish', () => { file.close(); resolve(); });
      }).on('error', (err) => {
        fs.unlink(dest, () => {});
        reject(err);
      });
    }
    doGet(url);
  });
}

// Hàm download JSON
function downloadJson(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    function doGet(u) {
      const proto = u.startsWith('https') ? https : http;
      proto.get(u, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return doGet(res.headers.location);
        }
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch(e) { reject(e); }
        });
      }).on('error', reject);
    }
    doGet(url);
  });
}

// Cài một package từ npm registry (chỉ main file, không dùng npm CLI)
async function installPackage(name, version) {
  console.log(`\nCai dat ${name}@${version}...`);
  
  const meta = await downloadJson(`https://registry.npmjs.org/${name}/${version}`);
  const tarballUrl = meta.dist.tarball;
  const tarDest = path.join(PROJECT_DIR, `${name.replace('/', '_')}.tgz`);
  
  console.log(`  Downloading: ${tarballUrl}`);
  await download(tarballUrl, tarDest);
  
  const pkgDir = path.join(NODE_MODULES, name);
  fs.mkdirSync(pkgDir, { recursive: true });
  
  // Extract tgz
  await new Promise((resolve, reject) => {
    const inp = fs.createReadStream(tarDest);
    const gz = zlib.createGunzip();
    const tar = inp.pipe(gz);
    
    // Manual tar extraction
    let buffer = Buffer.alloc(0);
    tar.on('data', chunk => { buffer = Buffer.concat([buffer, chunk]); });
    tar.on('end', () => {
      extractTar(buffer, pkgDir);
      fs.unlinkSync(tarDest);
      resolve();
    });
    tar.on('error', reject);
    inp.on('error', reject);
  });
  
  console.log(`  OK: ${name} installed`);
}

function extractTar(buffer, destDir) {
  let offset = 0;
  while (offset < buffer.length - 512) {
    // Read header
    const header = buffer.slice(offset, offset + 512);
    const name = header.toString('utf8', 0, 100).replace(/\0/g, '').trim();
    if (!name) break;
    
    const sizeStr = header.toString('utf8', 124, 136).replace(/\0/g, '').trim();
    const size = parseInt(sizeStr, 8) || 0;
    const typeFlag = header.toString('utf8', 156, 157);
    
    offset += 512;
    
    if (typeFlag === '0' || typeFlag === '' || typeFlag === '\0') {
      // Regular file — strip leading 'package/' prefix
      let relPath = name.replace(/^package\//, '');
      const filePath = path.join(destDir, relPath);
      const dir = path.dirname(filePath);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, buffer.slice(offset, offset + size));
    }
    
    // Move to next 512-byte block
    offset += Math.ceil(size / 512) * 512;
  }
}

async function main() {
  fs.mkdirSync(NODE_MODULES, { recursive: true });
  
  // Cai express va dependencies cua no
  const deps = {
    'dotenv': '16.3.1',
    'express': '4.18.2',
    'accepts': '1.3.8',
    'array-flatten': '1.1.1',
    'body-parser': '1.20.2',
    'bytes': '3.1.2',
    'call-bind': '1.0.5',
    'content-disposition': '0.5.4',
    'content-type': '1.0.5',
    'cookie': '0.5.0',
    'cookie-signature': '1.0.6',
    'debug': '2.6.9',
    'depd': '2.0.0',
    'destroy': '1.2.0',
    'ee-first': '1.1.1',
    'encodeurl': '1.0.2',
    'escape-html': '1.0.3',
    'etag': '1.8.1',
    'finalhandler': '1.2.0',
    'forwarded': '0.2.0',
    'fresh': '0.5.2',
    'function-bind': '1.1.2',
    'get-intrinsic': '1.2.2',
    'has-proto': '1.0.1',
    'has-symbols': '1.0.3',
    'hasown': '2.0.0',
    'http-errors': '2.0.0',
    'iconv-lite': '0.4.24',
    'inherits': '2.0.4',
    'ipaddr.js': '1.9.1',
    'media-typer': '0.3.0',
    'merge-descriptors': '1.0.1',
    'methods': '1.1.2',
    'mime': '1.6.0',
    'mime-db': '1.52.0',
    'mime-types': '2.1.35',
    'ms': '2.0.0',
    'negotiator': '0.6.3',
    'object-inspect': '1.13.1',
    'on-finished': '2.4.1',
    'parseurl': '1.3.3',
    'path-to-regexp': '0.1.7',
    'proxy-addr': '2.0.7',
    'qs': '6.11.0',
    'range-parser': '1.2.1',
    'raw-body': '2.5.2',
    'safe-buffer': '5.2.1',
    'safer-buffer': '2.1.2',
    'send': '0.18.0',
    'serve-static': '1.15.0',
    'set-function-length': '1.1.1',
    'setprototypeof': '1.2.0',
    'side-channel': '1.0.4',
    'statuses': '2.0.1',
    'toidentifier': '1.0.1',
    'type-is': '1.6.18',
    'unpipe': '1.0.0',
    'utils-merge': '1.0.1',
    'vary': '1.1.2',
  };
  
  let installed = 0;
  let failed = [];
  
  for (const [name, ver] of Object.entries(deps)) {
    try {
      // Skip if already installed
      if (fs.existsSync(path.join(NODE_MODULES, name, 'package.json'))) {
        console.log(`  Skip (exists): ${name}`);
        installed++;
        continue;
      }
      await installPackage(name, ver);
      installed++;
    } catch (e) {
      console.error(`  FAILED: ${name} - ${e.message}`);
      failed.push(name);
    }
  }
  
  console.log(`\n========================================`);
  console.log(`Hoan thanh: ${installed} packages`);
  if (failed.length > 0) {
    console.log(`That bai: ${failed.join(', ')}`);
  }
  console.log(`\nChay server bang:`);
  console.log(`  node server.js`);
  console.log(`  (hoac dung full path: "${NODE}" server.js)`);
}

main().catch(console.error);
