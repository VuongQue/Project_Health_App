/**
 * Upload ảnh exercise còn thiếu lên Cloudinary (dùng đúng wger ID)
 * Chạy: node scripts/upload-exercise-gifs.mjs
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

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error('❌ Thiếu CLOUDINARY_* trong .env'); process.exit(1);
}
console.log(`☁️  Cloudinary: ${CLOUD_NAME}\n`);

// Direct image URLs từ wger.de (đã verify có ảnh)
const EXERCISES = [
  { name: 'pushup',          url: 'https://wger.de/media/exercise-images/1112/81f40bee-4adf-4317-8476-1a87706e3031.png' },
  { name: 'pullup',          url: 'https://wger.de/media/exercise-images/1738/0529acdf-ede8-42a2-a3e5-8d0c57b7a0e1.jpg' },
  { name: 'jumping-jacks',   url: 'https://wger.de/media/exercise-images/320/6c9124b6-3551-47a8-9c22-20141c8b9c53.png'  },
  { name: 'lunge',           url: 'https://wger.de/media/exercise-images/984/5c7ffe68-e7b2-47f3-a22a-f9cc28640432.png'  },
  { name: 'leg-raise',       url: 'https://wger.de/media/exercise-images/979/27097a3a-5749-428d-b94c-6082afe390f6.png'  },
  { name: 'russian-twist',   url: 'https://wger.de/media/exercise-images/1193/70ca5d80-3847-4a8c-8882-c6e9e485e29e.png' },
  { name: 'inverted-row',    url: 'https://wger.de/media/exercise-images/1198/864906ac-4ac7-4e52-a886-c6bb97950a9f.jpg' },
  { name: 'calf-raise',      url: 'https://wger.de/media/exercise-images/1243/53d4fabe-c994-4907-873f-8d82813a9832.png' },
  // Không có ảnh riêng → dùng ảnh bài tương tự
  { name: 'glute-bridge',    url: 'https://wger.de/media/exercise-images/984/5c7ffe68-e7b2-47f3-a22a-f9cc28640432.png'  }, // lunge
  { name: 'wall-sit',        url: 'https://wger.de/media/exercise-images/1963/2b7b2d1a-5e30-4b84-a1fd-c3f3daff8ddd.png' }, // slow squat (wgerId 1963)
  { name: 'bicycle-crunch',  url: 'https://wger.de/media/exercise-images/1193/70ca5d80-3847-4a8c-8882-c6e9e485e29e.png' }, // russian twist
  { name: 'side-plank',      url: 'https://wger.de/media/exercise-images/1022/f74644fa-f43e-46bd-8603-6e3a2ee8ee2d.jpg' }, // plank row
  { name: 'jump-squat',      url: 'https://wger.de/media/exercise-images/1963/2b7b2d1a-5e30-4b84-a1fd-c3f3daff8ddd.png' }, // slow squat
];

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(destPath);
    https.get(url, { headers: { 'User-Agent': 'HealthHub/1.0' } }, (res) => {
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
      file.on('error', reject);
    }).on('error', reject);
  });
}

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

async function main() {
  const tmpDir = join(__dirname, '../.tmp-imgs');
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

  const results = {};
  const failed  = [];

  for (const ex of EXERCISES) {
    const ext = ex.url.split('.').pop().split('?')[0] || 'png';
    const tmpFile = join(tmpDir, `${ex.name}.${ext}`);

    process.stdout.write(`⏳ [${ex.name}] dl... `);
    try {
      await downloadFile(ex.url, tmpFile);
      process.stdout.write(`up... `);
    } catch (err) {
      console.log(`❌ ${err.message}`);
      failed.push(ex.name);
      continue;
    }

    try {
      const url = await uploadCloudinary(tmpFile, ex.name);
      results[ex.name] = url;
      console.log(`✅`);
    } catch (err) {
      console.log(`❌ ${err.message}`);
      failed.push(ex.name);
    }

    await new Promise(r => setTimeout(r, 400));
  }

  console.log('\n\n========== CLOUDINARY URLs ==========');
  for (const [name, url] of Object.entries(results)) {
    console.log(`  ${name}: '${url}'`);
  }
  if (failed.length) console.log('\n❌ Thất bại:', failed.join(', '));

  try { rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  console.log('\n✅ Done!');
}

main().catch(console.error);
