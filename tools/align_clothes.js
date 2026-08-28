// ===================================================================
//  옷 정렬 파이프라인 (align_clothes.js)
//
//  하는 일: images/raw/ 안의 "투명 배경에 옷만 떠 있는" 그림을,
//           피코 몸 템플릿(1114x1411)의 '입었을 때 위치'에 맞게 자동 배치해서
//           images/<name>.png (전신 프레임)와 images/icon_<id>.png (썸네일)로 내보냄.
//
//  왜: 이렇게 해두면 게임에선 모든 옷을 피코 몸과 '똑같은 좌표'로 1:1 겹치기만 하면 됨.
//      (옷마다 좌표를 따로 재는 작업이 사라짐 = 사이즈가 항상 맞음)
//
//  새 옷 추가: raw/에 PNG 넣고 아래 ITEMS에 {raw, id, category} 한 줄 추가 후 실행.
//     실행: NODE_PATH=<repo>/node_modules node tools/align_clothes.js
// ===================================================================
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IMG = path.join(ROOT, 'images');

// 피코 몸 캔버스 크기 (Pico_muscle.png과 동일해야 함)
const CW = 1114, CH = 1411;

// 카테고리별 '피코 몸에서 옷이 덮을 목표 영역' (피코 캔버스 px 기준)
//  - 측정값 기반: 팔 바깥 x[142..962], 어깨 y~400, 팔 끝 y~900, 다리 y[889..1315]
const TARGETS = {
  top:    { x0: 128, y0: 382, x1: 979, y1: 940  },  // 어깨~허리, 팔 포함(살짝 넉넉히)
  dress:  { x0: 128, y0: 382, x1: 979, y1: 1146 },  // 어깨~허벅지
  bottom: { x0: 316, y0: 889, x1: 798, y1: 1315 },  // 허리~발목
};

const ITEMS = [
  { raw: 'Pico_sailor.png', id: 'sailor', category: 'top' },
  { raw: 'Pico_white.png',  id: 'white',  category: 'top' },
  { raw: 'Pico_pink.png',   id: 'pink',   category: 'top' },
  { raw: 'Pico_dress.png',  id: 'dress',  category: 'dress' },
  { raw: 'Pico_jeans.png',  id: 'jeans',  category: 'bottom' },
];

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage();

  for (const it of ITEMS) {
    const buf = fs.readFileSync(path.join(IMG, 'raw', it.raw));
    const srcUri = 'data:image/png;base64,' + buf.toString('base64');
    const tgt = TARGETS[it.category];

    const { worn, icon } = await page.evaluate(async ({ srcUri, tgt, CW, CH }) => {
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = srcUri; });

      // 1) 원본의 불투명 영역(bbox) 측정
      const t = document.createElement('canvas'); t.width = img.width; t.height = img.height;
      const tc = t.getContext('2d'); tc.drawImage(img, 0, 0);
      const d = tc.getImageData(0, 0, img.width, img.height).data;
      let minx = img.width, miny = img.height, maxx = -1, maxy = -1;
      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          if (d[(y * img.width + x) * 4 + 3] > 128) {
            if (x < minx) minx = x; if (x > maxx) maxx = x;
            if (y < miny) miny = y; if (y > maxy) maxy = y;
          }
        }
      }
      const bw = maxx - minx, bh = maxy - miny;

      // 2) bbox -> 목표 사각형으로 독립 스케일 배치 (전신 프레임)
      const tw = tgt.x1 - tgt.x0, th = tgt.y1 - tgt.y0;
      const dW = tw * img.width / bw, dH = th * img.height / bh;
      const dx = tgt.x0 - minx * (dW / img.width);
      const dy = tgt.y0 - miny * (dH / img.height);

      const c = document.createElement('canvas'); c.width = CW; c.height = CH;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, dx, dy, dW, dH);
      const worn = c.toDataURL('image/png');

      // 3) 아이콘: 목표 영역만 잘라 썸네일
      const ic = document.createElement('canvas');
      const scale = 150 / tw; ic.width = Math.round(tw * scale); ic.height = Math.round(th * scale);
      const ictx = ic.getContext('2d'); ictx.imageSmoothingQuality = 'high';
      ictx.drawImage(c, tgt.x0, tgt.y0, tw, th, 0, 0, ic.width, ic.height);
      const icon = ic.toDataURL('image/png');
      return { worn, icon };
    }, { srcUri, tgt, CW, CH });

    fs.writeFileSync(path.join(IMG, it.raw), Buffer.from(worn.split(',')[1], 'base64'));
    fs.writeFileSync(path.join(IMG, 'icon_' + it.id + '.png'), Buffer.from(icon.split(',')[1], 'base64'));
    console.log('aligned', it.raw, '(' + it.category + ') + icon_' + it.id + '.png');
  }
  await browser.close();
})();
