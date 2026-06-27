/**
 * Fetch ảnh exercise từ free-exercise-db (GitHub) → upload Cloudinary
 * Nguồn: https://github.com/yuhonas/free-exercise-db (CC0 Public Domain)
 * Chạy: node scripts/fetch-exercise-gifs.mjs
 */

import https from 'https';
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

const ENV        = loadEnv();
const CLOUD_NAME = ENV.CLOUDINARY_CLOUD_NAME;
const API_KEY    = ENV.CLOUDINARY_API_KEY;
const API_SECRET = ENV.CLOUDINARY_API_SECRET;
const FOLDER     = 'healthhub/exercises';
const GH_BASE    = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error('❌ Thiếu CLOUDINARY_* trong .env'); process.exit(1);
}
console.log(`☁️  Cloudinary: ${CLOUD_NAME}\n`);

// Map: key → từ khóa tìm kiếm trong free-exercise-db
// Ưu tiên: bodyweight, beginner, chính xác nhất
const TARGETS = [
  { key: 'squat',             search: 'bodyweight squat',        fallback: 'squat'            },
  { key: 'pushup',            search: 'push-up',                 fallback: 'pushup'           },
  { key: 'plank',             search: 'plank',                   fallback: null               },
  { key: 'jumping-jacks',     search: 'jumping jacks',           fallback: 'jumping jack'     },
  { key: 'glute-bridge',      search: 'glute bridge',            fallback: 'hip raise'        },
  { key: 'pullup',            search: 'pull-up',                 fallback: 'pull up'          },
  { key: 'dips',              search: 'dips',                    fallback: 'dip'              },
  { key: 'burpee',            search: 'burpee',                  fallback: null               },
  { key: 'high-knees',        search: 'high knees',              fallback: 'run'              },
  { key: 'mountain-climber',  search: 'mountain climber',        fallback: null               },
  { key: 'crunch',            search: 'crunch',                  fallback: null               },
  { key: 'leg-raise',         search: 'leg raise',               fallback: 'leg raises'       },
  { key: 'russian-twist',     search: 'russian twist',           fallback: null               },
  { key: 'calf-raise',        search: 'calf raise',              fallback: null               },
  { key: 'wall-sit',          search: 'wall squat',              fallback: 'squat'            },
  { key: 'bicycle-crunch',    search: 'bicycle crunch',          fallback: 'bicycle'          },
  { key: 'inverted-row',      search: 'inverted row',            fallback: 'row'              },
  { key: 'jump-squat',        search: 'jump squat',              fallback: 'squat jump'       },
  { key: 'lunge',             search: 'lunge',                   fallback: null               },
  { key: 'side-plank',        search: 'side plank',              fallback: 'plank'            },
  { key: 'diamond-pushup',    search: 'diamond push',            fallback: 'push-up'          },
  { key: 'tricep-dip',        search: 'tricep dip',              fallback: 'dip'              },
  { key: 'pike-pushup',       search: 'pike push',               fallback: 'push-up'          },
  { key: 'wide-pullup',       search: 'wide-grip pull',          fallback: 'pull-up'          },
  { key: 'chin-up',           search: 'chin-up',                 fallback: 'chinup'           },
  { key: 'romanian-deadlift', search: 'romanian deadlift',       fallback: 'deadlift'         },
  { key: 'bulgarian-squat',   search: 'bulgarian split',         fallback: 'split squat'      },
  { key: 'box-jump',          search: 'box jump',                fallback: 'jump'             },
  { key: 'lateral-bound',     search: 'lateral bound',           fallback: 'lateral'          },
  { key: 'speed-skater',      search: 'skater',                  fallback: 'lateral'          },
];

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'HealthHub/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpsGet(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    // tạo thư mục nếu chưa có
    const dir = destPath.substring(0, destPath.lastIndexOf('/') + 1) || destPath.substring(0, destPath.lastIndexOf('\\') + 1);
    if (dir && !existsSync(dir)) mkdirSync(dir, { recursive: true });

    const file = createWriteStream(destPath);
    const proto = url.startsWith('https') ? https : (await_http());
    https.get(url, { headers: { 'User-Agent': 'HealthHub/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.destroy();
        try { fs.unlinkSync(destPath); } catch {}
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.destroy();
        return reject(new Error(`HTTP ${res.statusCode} - ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', reject);
    }).on('error', (e) => { file.destroy(); reject(e); });
  });
}

function await_http() { return https; } // always https for github

function uploadCloudinary(filePath, publicId) {
  return new Promise((resolve, reject) => {
    const timestamp = Math.floor(Date.now() / 1000);
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
      path: `/v1_1/${CLOUD_NAME}/image/upload`,
      headers: form.getHeaders(),
    }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.secure_url) resolve(json.secure_url);
          else reject(new Error(data.slice(0, 200)));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    form.pipe(req);
  });
}

function findExercise(db, term) {
  if (!term) return null;
  const t = term.toLowerCase();
  // exact match first
  let found = db.find(e => e.name.toLowerCase() === t);
  if (found?.images?.length) return found;
  // includes match
  const matches = db.filter(e => e.name.toLowerCase().includes(t) && e.images?.length > 0);
  if (!matches.length) return null;
  // prefer bodyweight / body only
  return matches.find(e => e.equipment === 'body only') ?? matches[0];
}

async function main() {
  const tmpDir = join(__dirname, '../.tmp-imgs');
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

  // Fetch database
  process.stdout.write('📥 Đang tải danh sách bài tập từ GitHub... ');
  const { body } = await httpsGet('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json');
  const db = JSON.parse(body);
  console.log(`✅ ${db.length} bài tập\n`);

  const results = {};
  const failed  = [];

  for (const target of TARGETS) {
    // Tìm bài phù hợp
    let exercise = findExercise(db, target.search) ?? findExercise(db, target.fallback);

    if (!exercise) {
      console.log(`❌ [${target.key}] Không tìm thấy "${target.search}" / "${target.fallback}"`);
      failed.push(target.key);
      continue;
    }

    const imgPath = exercise.images[0]; // lấy ảnh đầu tiên
    const imgUrl  = GH_BASE + imgPath;
    const ext     = imgPath.split('.').pop() || 'jpg';
    const tmpFile = join(tmpDir, `${target.key}.${ext}`);

    process.stdout.write(`⏳ [${target.key}] → "${exercise.name}" | dl... `);

    try {
      await downloadFile(imgUrl, tmpFile);
      process.stdout.write(`up... `);
    } catch (err) {
      console.log(`❌ Download: ${err.message}`);
      failed.push(target.key);
      continue;
    }

    try {
      const url = await uploadCloudinary(tmpFile, target.key);
      results[target.key] = url;
      console.log(`✅`);
    } catch (err) {
      console.log(`❌ Upload: ${err.message}`);
      failed.push(target.key);
    }

    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n\n========== CLOUDINARY URLs ==========');
  for (const [key, url] of Object.entries(results)) {
    console.log(`  ${key}: '${url}'`);
  }
  if (failed.length) console.log('\n❌ Thất bại:', failed.join(', '));

  try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  console.log('\n✅ Done!');
}

main().catch(console.error);
