/**
 * Fetch video MP4 từ EDB API (AscendAPI) → upload Cloudinary
 * Chạy: node scripts/fetch-exercise-videos.mjs
 * Free tier: 2000 req/month, có watermark
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import crypto from 'crypto';
import { createWriteStream, mkdirSync, existsSync, createReadStream, rmSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const lines = readFileSync(join(__dirname, '../.env'), 'utf8').split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const idx = t.indexOf('=');
    if (idx < 0) continue;
    env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim();
  }
  return env;
}

const ENV          = loadEnv();
const CLOUD_NAME   = ENV.CLOUDINARY_CLOUD_NAME;
const API_KEY      = ENV.CLOUDINARY_API_KEY;
const API_SECRET   = ENV.CLOUDINARY_API_SECRET;
const FOLDER       = 'healthhub/exercise-videos';
const RAPIDAPI_KEY = '5db162c24bmshccf84ce30a0d36bp15298ejsn7cd707f8d23c';
const EDB_HOST     = 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com';
const EDB_BASE     = `https://${EDB_HOST}/api/v1`;

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error('❌ Thiếu CLOUDINARY_* trong .env'); process.exit(1);
}
console.log(`☁️  Cloudinary: ${CLOUD_NAME} | Folder: ${FOLDER}\n`);

// Map: key → search term (ưu tiên bodyweight)
const TARGETS = [
  { key: 'squat',            search: 'bodyweight squat'       },
  { key: 'pushup',           search: 'push-up'                },
  { key: 'plank',            search: 'plank'                  },
  { key: 'jumping-jacks',    search: 'jumping jacks'          },
  { key: 'glute-bridge',     search: 'glute bridge'           },
  { key: 'pullup',           search: 'pull-up'                },
  { key: 'dips',             search: 'dips'                   },
  { key: 'burpee',           search: 'burpee'                 },
  { key: 'high-knees',       search: 'high knees'             },
  { key: 'mountain-climber', search: 'mountain climber'       },
  { key: 'crunch',           search: 'crunch'                 },
  { key: 'leg-raise',        search: 'leg raise'              },
  { key: 'russian-twist',    search: 'russian twist'          },
  { key: 'calf-raise',       search: 'calf raise'             },
  { key: 'wall-sit',         search: 'wall sit'               },
  { key: 'bicycle-crunch',   search: 'bicycle crunch'         },
  { key: 'inverted-row',     search: 'inverted row'           },
  { key: 'jump-squat',       search: 'jump squat'             },
  { key: 'lunge',            search: 'lunge'                  },
  { key: 'side-plank',       search: 'side plank'             },
];

function httpsGet(url, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, {
      headers: {
        'User-Agent': 'HealthHub/1.0',
        'Content-Type': 'application/json',
        'x-rapidapi-host': EDB_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY,
        ...extraHeaders,
      }
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpsGet(res.headers.location, {}).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(destPath);
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, { headers: { 'User-Agent': 'HealthHub/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.destroy();
        try { fs.unlinkSync(destPath); } catch {}
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.destroy();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', (e) => { file.destroy(); reject(e); });
    }).on('error', (e) => { file.destroy(); reject(e); });
  });
}

function uploadCloudinaryVideo(filePath, publicId) {
  return new Promise((resolve, reject) => {
    const timestamp = Math.floor(Date.now() / 1000);
    // Cloudinary signature: params sorted alphabetically, NO resource_type in string
    const sig = crypto
      .createHash('sha1')
      .update(`folder=${FOLDER}&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`)
      .digest('hex');

    const form = new FormData();
    form.append('file', createReadStream(filePath));
    form.append('api_key', API_KEY);
    form.append('timestamp', String(timestamp));
    form.append('public_id', publicId);
    form.append('folder', FOLDER);
    form.append('signature', sig);

    const req = https.request({
      method: 'POST',
      host: 'api.cloudinary.com',
      path: `/v1_1/${CLOUD_NAME}/video/upload`,
      headers: form.getHeaders(),
    }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.secure_url) resolve(json.secure_url);
          else reject(new Error(data.slice(0, 300)));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    form.pipe(req);
  });
}

async function searchAndGetVideo(searchTerm) {
  // 1. Search
  const enc = encodeURIComponent(searchTerm);
  const { status: s1, body: b1 } = await httpsGet(`${EDB_BASE}/exercises/search?search=${enc}`);
  if (s1 !== 200) throw new Error(`Search HTTP ${s1}`);
  const searchResult = JSON.parse(b1);
  const exercises = searchResult.data || searchResult;
  if (!exercises?.length) throw new Error('No results');

  // Ưu tiên bài bodyweight / không dụng cụ
  const best = exercises.find(e =>
    e.name?.toLowerCase().includes('bodyweight') ||
    e.name?.toLowerCase().includes('body weight')
  ) ?? exercises[0];

  // 2. Get by ID để lấy videoUrl
  await new Promise(r => setTimeout(r, 300));
  const { status: s2, body: b2 } = await httpsGet(`${EDB_BASE}/exercises/${best.exerciseId}`);
  if (s2 !== 200) throw new Error(`Get by ID HTTP ${s2}`);
  const detail = JSON.parse(b2);
  const data = detail.data || detail;

  if (!data.videoUrl) throw new Error('No videoUrl');
  return { exerciseId: best.exerciseId, name: data.name, videoUrl: data.videoUrl, imageUrl: data.imageUrl };
}

async function main() {
  const tmpDir = join(__dirname, '../.tmp-videos');
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

  const results = {};
  const failed  = [];

  for (const target of TARGETS) {
    process.stdout.write(`⏳ [${target.key}] search... `);

    let info;
    try {
      info = await searchAndGetVideo(target.search);
      process.stdout.write(`"${info.name}" | dl... `);
    } catch (err) {
      console.log(`❌ ${err.message}`);
      failed.push(target.key);
      await new Promise(r => setTimeout(r, 500));
      continue;
    }

    const tmpFile = join(tmpDir, `${target.key}.mp4`);
    try {
      await downloadFile(info.videoUrl, tmpFile);
      process.stdout.write(`up... `);
    } catch (err) {
      console.log(`❌ Download: ${err.message}`);
      failed.push(target.key);
      continue;
    }

    try {
      const url = await uploadCloudinaryVideo(tmpFile, target.key);
      results[target.key] = { videoUrl: url, imageUrl: info.imageUrl };
      console.log(`✅`);
    } catch (err) {
      console.log(`❌ Upload: ${err.message.slice(0, 100)}`);
      failed.push(target.key);
    }

    // Tránh rate limit
    await new Promise(r => setTimeout(r, 800));
  }

  console.log('\n\n========== KẾT QUẢ ==========');
  for (const [key, val] of Object.entries(results)) {
    console.log(`  ${key}:`);
    console.log(`    videoUrl: '${val.videoUrl}'`);
    console.log(`    imageUrl: '${val.imageUrl}'`);
  }
  if (failed.length) console.log('\n❌ Thất bại:', failed.join(', '));

  try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  console.log('\n✅ Done!');
}

main().catch(console.error);
