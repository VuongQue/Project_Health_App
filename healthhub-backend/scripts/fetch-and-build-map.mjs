/**
 * Fetch video/image từ EDB API → upload Cloudinary → sinh exercise-gif.map.ts
 * Chạy: node scripts/fetch-and-build-map.mjs
 */
import https from 'https';
import http from 'http';
import fs, { createWriteStream, mkdirSync, existsSync, createReadStream, readFileSync, writeFileSync } from 'fs';
import crypto from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';

const __dir = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const lines = readFileSync(join(__dir, '../.env'), 'utf8').split(/\r?\n/);
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
const EDB_HOST   = 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com';
const RAPID_KEY  = '5db162c24bmshccf84ce30a0d36bp15298ejsn7cd707f8d23c';

if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
  console.error('Thieu CLOUDINARY_* trong .env'); process.exit(1);
}
console.log(`Cloudinary: ${CLOUD_NAME} / ${FOLDER}\n`);

// 50+ bai tap can fetch: key → search term
const TARGETS = [
  // Strength basics
  { key: 'squat',              search: 'bodyweight squat'      },
  { key: 'pushup',             search: 'push-up'               },
  { key: 'diamond-pushup',     search: 'diamond push-up'       },
  { key: 'pike-pushup',        search: 'pike push-up'          },
  { key: 'archer-pushup',      search: 'archer push-up'        },
  { key: 'one-arm-pushup',     search: 'one arm push-up'       },
  { key: 'plank',              search: 'front plank'           },
  { key: 'side-plank',         search: 'side plank'            },
  { key: 'glute-bridge',       search: 'hip thrust'            },
  // Upper
  { key: 'pullup',             search: 'pull-up'               },
  { key: 'chin-up',            search: 'chin-up'               },
  { key: 'wide-pullup',        search: 'wide grip pull-up'     },
  { key: 'dips',               search: 'triceps dips'          },
  { key: 'inverted-row',       search: 'inverted row'          },
  { key: 'muscle-up',          search: 'muscle up'             },
  // HIIT / Cardio
  { key: 'burpee',             search: 'burpee'                },
  { key: 'high-knees',         search: 'high knees'            },
  { key: 'jumping-jacks',      search: 'jumping jack'          },
  { key: 'mountain-climber',   search: 'mountain climber'      },
  { key: 'jump-squat',         search: 'jump squat'            },
  { key: 'box-jump',           search: 'box jump'              },
  { key: 'tuck-jump',          search: 'tuck jump'             },
  { key: 'broad-jump',         search: 'broad jump'            },
  { key: 'lateral-bound',      search: 'lateral bound'         },
  { key: 'speed-skater',       search: 'speed skater'          },
  { key: 'lateral-shuffle',    search: 'lateral shuffle'       },
  // Legs
  { key: 'lunge',              search: 'bodyweight lunge'      },
  { key: 'bulgarian-squat',    search: 'bulgarian split squat' },
  { key: 'romanian-deadlift',  search: 'romanian deadlift'     },
  { key: 'calf-raise',         search: 'calf raise'            },
  { key: 'wall-sit',           search: 'wall sit'              },
  { key: 'single-leg-hop',     search: 'single leg hop'        },
  // Core
  { key: 'crunch',             search: 'crunch floor'          },
  { key: 'bicycle-crunch',     search: 'bicycle crunch'        },
  { key: 'leg-raise',          search: 'leg raise'             },
  { key: 'russian-twist',      search: 'russian twist'         },
  { key: 'dragon-flag',        search: 'dragon flag'           },
  { key: 'l-sit',              search: 'l-sit'                 },
  { key: 'tuck-planche',       search: 'planche lean'          },
  // Calisthenics advanced
  { key: 'pseudo-planche',     search: 'pseudo planche push-up' },
  // Desk / Office
  { key: 'desk-pushup',        search: 'incline push-up'       },
  { key: 'chair-squat',        search: 'bodyweight squat'      },
  { key: 'standing-march',     search: 'marching in place'     },
  // Compound / Plyometric
  { key: 'plank-to-pushup',    search: 'plank to push-up'      },
  { key: 'jump-rope',          search: 'jumping jack'          },
  { key: 'depth-jump',         search: 'depth jump'            },
  // Office / Lunch break
  { key: 'torso-rotation',     search: 'torso rotation'        },
];

const UNIQUE = [...new Map(TARGETS.map(t => [t.key, t])).values()];

function edbRequest(path) {
  return new Promise((resolve, reject) => {
    https.get(`https://${EDB_HOST}${path}`, {
      headers: {
        'x-rapidapi-host': EDB_HOST,
        'x-rapidapi-key': RAPID_KEY,
        'Accept': 'application/json',
        'User-Agent': 'HealthHub/1.0',
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    }).on('error', reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = createWriteStream(dest);
    proto.get(url, { headers: { 'User-Agent': 'HealthHub/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.destroy();
        try { fs.unlinkSync(dest); } catch {}
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', e => { file.destroy(); reject(e); });
    }).on('error', e => { file.destroy(); reject(e); });
  });
}

function cloudinaryUpload(filePath, publicId, rtype) {
  return new Promise((resolve, reject) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const sigStr = `folder=${FOLDER}&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
    const sig = crypto.createHash('sha1').update(sigStr).digest('hex');

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
      path: `/v1_1/${CLOUD_NAME}/${rtype}/upload`,
      headers: form.getHeaders(),
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(d);
          if (j.secure_url) return resolve(j.secure_url);
          reject(new Error(d.slice(0, 200)));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    form.pipe(req);
  });
}

async function processTarget(target, tmpDir) {
  // 1. Search
  const enc = encodeURIComponent(target.search);
  const { status: s1, body: b1 } = await edbRequest(`/api/v1/exercises/search?search=${enc}`);
  if (s1 !== 200) throw new Error(`Search HTTP ${s1}`);
  const items = JSON.parse(b1).data || [];
  if (!items.length) throw new Error(`No results for "${target.search}"`);

  const best = items.find(e =>
    (e.equipments || []).includes('BODY WEIGHT') ||
    (e.name || '').toLowerCase().includes('bodyweight')
  ) ?? items[0];

  // 2. Get detail
  await new Promise(r => setTimeout(r, 350));
  const { status: s2, body: b2 } = await edbRequest(`/api/v1/exercises/${best.exerciseId}`);
  if (s2 !== 200) throw new Error(`Detail HTTP ${s2}`);
  const raw = JSON.parse(b2);
  const detail = raw.data ?? raw;

  const videoUrl = detail.videoUrl || null;
  const imageUrl = detail.imageUrl || best.imageUrl || null;
  const name     = detail.name || best.name;
  const overview = (detail.overview || '').replace(/'/g, "\\'").replace(/\n/g, ' ').slice(0, 120);

  // 3. Upload video nếu có, không thì ảnh
  if (videoUrl) {
    const tmp = join(tmpDir, `${target.key}.mp4`);
    await downloadFile(videoUrl, tmp);
    const cloudUrl = await cloudinaryUpload(tmp, target.key, 'video');
    try { fs.unlinkSync(tmp); } catch {}
    return { cloudUrl, isVideo: true, name, overview };
  } else if (imageUrl) {
    const tmp = join(tmpDir, `${target.key}.jpg`);
    await downloadFile(imageUrl, tmp);
    const cloudUrl = await cloudinaryUpload(tmp, target.key, 'image');
    try { fs.unlinkSync(tmp); } catch {}
    return { cloudUrl, isVideo: false, name, overview };
  } else {
    throw new Error('No media available');
  }
}

// Map tu ten bai seed → key trong TARGETS
const SEED_NAME_TO_KEY = {
  'Squat':                  'squat',
  'Push-up':                'pushup',
  'Plank':                  'plank',
  'Jumping Jacks':          'jumping-jacks',
  'Glute Bridge':           'glute-bridge',
  'Pull-up':                'pullup',
  'Dips':                   'dips',
  'Diamond Push-up':        'diamond-pushup',
  'Pike Push-up':           'pike-pushup',
  'Triceps Dip':            'dips',
  'Burpee':                 'burpee',
  'High Knees':             'high-knees',
  'Jump Squat':             'jump-squat',
  'Mountain Climber':       'mountain-climber',
  'Box Jump':               'box-jump',
  'Bulgarian Split Squat':  'bulgarian-squat',
  'Romanian Deadlift':      'romanian-deadlift',
  'Calf Raise':             'calf-raise',
  'Wall Sit':               'wall-sit',
  'Lunge':                  'lunge',
  'Crunch':                 'crunch',
  'Bicycle Crunch':         'bicycle-crunch',
  'Leg Raise':              'leg-raise',
  'Russian Twist':          'russian-twist',
  'Plank Hold':             'plank',
  'Side Plank':             'side-plank',
  'Wide-grip Pull-up':      'wide-pullup',
  'Close-grip Chin-up':     'chin-up',
  'Archer Push-up':         'archer-pushup',
  'One-arm Push-up Prep':   'one-arm-pushup',
  'Inverted Row':           'inverted-row',
  'Depth Jump':             'depth-jump',
  'Broad Jump':             'broad-jump',
  'Lateral Bound':          'lateral-bound',
  'Tuck Jump':              'tuck-jump',
  'Single-leg Hop':         'single-leg-hop',
  'Jump Rope (mo phong)':   'jump-rope',
  'Jump Rope (mô phỏng)':  'jump-rope',
  'Squat Jump':             'jump-squat',
  'Plank to Push-up':       'plank-to-pushup',
  'Lateral Shuffle':        'lateral-shuffle',
  'Speed Skater':           'speed-skater',
  'Pseudo Planche Push-up': 'pseudo-planche',
  'L-sit Hold':             'l-sit',
  'Tuck Planche Hold':      'tuck-planche',
  'Muscle-up Prep':         'muscle-up',
  'Dragon Flag Negative':   'dragon-flag',
  'Desk Push-up':           'desk-pushup',
  'Chair Squat':            'chair-squat',
  'Standing March':         'standing-march',
  'Torso Rotation':         'torso-rotation',
};

// Mood exercises dung anh Unsplash
const MOOD_IMAGES = {
  "Child's Pose":              'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80',
  'Cat-Cow Stretch':           'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80',
  'Downward Dog':              'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80',
  'Warrior I':                 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80',
  'Pigeon Pose':               'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80',
  'Happy Baby Pose':           'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&q=80',
  'Box Breathing 4-4-4-4':     'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80',
  'Belly Breathing':           'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80',
  '4-7-8 Breathing':           'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80',
  'Alternate Nostril':         'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&q=80',
  'Body Scan Meditation':      'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=400&q=80',
  'Gratitude Reflection':      'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=400&q=80',
  'Supine Spinal Twist':       'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=400&q=80',
  'Legs Up The Wall':          'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=400&q=80',
  'Progressive Muscle Relax':  'https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=400&q=80',
  'Mindful Walking':           'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&q=80',
  'Seated Forward Fold':       'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&q=80',
  'Hip Flexor Stretch':        'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&q=80',
  'Thoracic Spine Rotation':   'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&q=80',
  'Neck Roll':                 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&q=80',
  'Shoulder Cross Stretch':    'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&q=80',
  'Quad Stretch':              'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&q=80',
  'Chin Tuck':                 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&q=80',
  'Shoulder Shrug':            'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&q=80',
  'Doorway Chest Stretch':     'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&q=80',
  'Levator Scapulae Stretch':  'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&q=80',
  'Upper Trap Stretch':        'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&q=80',
  'Seated Butterfly Stretch':  'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&q=80',
  'Power Pose':                'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&q=80',
};

function generateMapFile(cloudResults) {
  const fitnessNames = Object.keys(SEED_NAME_TO_KEY);
  const moodNames    = Object.keys(MOOD_IMAGES);

  const lines = [
    '/**',
    ' * Map ten bai tap → { gifUrl, description }',
    ' * Video MP4 Cloudinary (EDB AscendAPI) cho FITNESS',
    ' * Anh Unsplash cho MOOD/Yoga/Breathing/Stretch',
    ' */',
    '',
    'export const EXERCISE_GIF_MAP: Record<string, { gifUrl: string; description: string }> = {',
  ];

  for (const name of fitnessNames) {
    const key  = SEED_NAME_TO_KEY[name];
    const data = cloudResults[key];
    const url  = data ? data.cloudUrl : '';
    const desc = data ? data.overview || name : name;
    lines.push(`  '${name}': { gifUrl: '${url}', description: '${desc}' },`);
  }

  for (const name of moodNames) {
    const url = MOOD_IMAGES[name];
    const escapedName = name.replace(/'/g, "\\'");
    lines.push(`  '${escapedName}': { gifUrl: '${url}', description: '${escapedName}' },`);
  }

  lines.push('};');
  lines.push('');

  const out = join(__dir, '../src/database/exercise-gif.map.ts');
  writeFileSync(out, lines.join('\n'), 'utf8');

  const videoCount = Object.values(cloudResults).filter(r => r.isVideo).length;
  const imageCount = Object.values(cloudResults).filter(r => !r.isVideo).length;
  console.log(`\nSinh: src/database/exercise-gif.map.ts`);
  console.log(`  FITNESS: ${fitnessNames.length} entries | MOOD: ${moodNames.length} entries`);
  console.log(`  Cloudinary: ${videoCount} video, ${imageCount} image`);
}

async function main() {
  const tmpDir = join(__dir, '../.tmp-ex');
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

  const cloudResults = {};
  const failed = [];
  let vCnt = 0;
  let iCnt = 0;

  console.log(`Fetch ${UNIQUE.length} exercises tu EDB API\n`);

  for (let i = 0; i < UNIQUE.length; i++) {
    const t = UNIQUE[i];
    const prefix = `[${String(i + 1).padStart(2,'0')}/${UNIQUE.length}] ${t.key.padEnd(22)}`;
    process.stdout.write(prefix + ' ');

    try {
      const result = await processTarget(t, tmpDir);
      cloudResults[t.key] = result;
      if (result.isVideo) { vCnt++; console.log('OK VIDEO'); }
      else                { iCnt++; console.log('OK image'); }
    } catch (err) {
      console.log(`FAIL: ${err.message.slice(0, 80)}`);
      failed.push(t.key);
    }

    await new Promise(r => setTimeout(r, 700));
  }

  // Luu raw results
  writeFileSync(join(tmpDir, 'results.json'), JSON.stringify(cloudResults, null, 2));

  console.log(`\n${vCnt} video, ${iCnt} image | ${failed.length} that bai`);
  if (failed.length) console.log('That bai:', failed.join(', '));

  generateMapFile(cloudResults);

  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  console.log('\nHoan tat!');
}

main().catch(console.error);
