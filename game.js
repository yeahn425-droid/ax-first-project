// ===================================================================
//  게임의 두뇌 (game.js)
//  하는 일: 옷 목록을 화면에 그리고, 옷을 클릭하면 캐릭터에게 입혀요.
// ===================================================================

// -------------------------------------------------------------------
// 1) 옷장 데이터
//    옷 하나하나를 여기에 적어둬요. 나중에 옷을 추가하고 싶으면
//    이 목록에 한 칸만 더 복사해서 붙이면 돼요.
//
//    - id       : 옷의 고유 이름표 (겹치면 안 돼요)
//    - category : 종류 (hat=모자, top=상의, shoes=신발)
//    - name     : 화면에 보일 이름
//    - onBody   : 캐릭터 몸에 그려질 그림 (무대 크기에 맞춘 그림)
//    - icon     : 옷장 버튼에 보일 작은 그림
// -------------------------------------------------------------------
const wardrobe = [
  // ---- 모자 ----
  {
    id: "hat_straw",
    category: "hat",
    name: "밀짚모자",
    onBody: `
      <ellipse cx="150" cy="60" rx="70" ry="16" fill="#e8c06a"/>
      <path d="M118 60 Q150 18 182 60 Z" fill="#f0cd7d"/>
      <ellipse cx="150" cy="60" rx="34" ry="7" fill="#d9a94e"/>`,
    icon: `<ellipse cx="20" cy="26" rx="16" ry="5" fill="#e8c06a"/>
           <path d="M9 26 Q20 8 31 26 Z" fill="#f0cd7d"/>`,
  },
  {
    id: "hat_crown",
    category: "hat",
    name: "왕관",
    onBody: `
      <path d="M112 62 L124 36 L138 56 L150 30 L162 56 L176 36 L188 62 Z" fill="#ffd54a" stroke="#e6b800" stroke-width="2"/>
      <circle cx="150" cy="40" r="4" fill="#ff5b8a"/>`,
    icon: `<path d="M6 30 L11 12 L18 26 L20 8 L22 26 L29 12 L34 30 Z" fill="#ffd54a" stroke="#e6b800" stroke-width="1.5"/>`,
  },

  // ---- 상의 ----
  {
    id: "top_dress",
    category: "top",
    name: "핑크 원피스",
    onBody: `
      <path d="M112 150 Q150 138 188 150 L206 300 L94 300 Z" fill="#ff86b3"/>
      <path d="M112 150 Q150 168 188 150 L184 180 Q150 196 116 180 Z" fill="#ff6fa5"/>`,
    icon: `<path d="M11 10 Q20 6 29 10 L34 34 L6 34 Z" fill="#ff86b3"/>`,
  },
  {
    id: "top_tee",
    category: "top",
    name: "노란 티셔츠",
    onBody: `
      <path d="M100 150 L112 150 Q150 138 188 150 L200 150 L200 176 L186 182 L186 240 L114 240 L114 182 L100 176 Z" fill="#ffd94a"/>`,
    icon: `<path d="M7 12 L11 10 Q20 6 29 10 L33 12 L33 19 L29 21 L29 34 L11 34 L11 21 L7 19 Z" fill="#ffd94a"/>`,
  },

  // ---- 신발 ----
  {
    id: "shoes_sneakers",
    category: "shoes",
    name: "운동화",
    onBody: `
      <rect x="118" y="338" width="30" height="16" rx="8" fill="#ffffff" stroke="#4a90d9" stroke-width="3"/>
      <rect x="152" y="338" width="30" height="16" rx="8" fill="#ffffff" stroke="#4a90d9" stroke-width="3"/>`,
    icon: `<rect x="5" y="18" width="14" height="9" rx="4" fill="#fff" stroke="#4a90d9" stroke-width="2"/>
           <rect x="21" y="18" width="14" height="9" rx="4" fill="#fff" stroke="#4a90d9" stroke-width="2"/>`,
  },
  {
    id: "shoes_heels",
    category: "shoes",
    name: "빨간 구두",
    onBody: `
      <path d="M118 338 L150 338 L146 352 L120 352 Z" fill="#e23b52"/>
      <path d="M152 338 L184 338 L182 352 L156 352 Z" fill="#e23b52"/>`,
    icon: `<path d="M6 16 L20 16 L18 30 L8 30 Z" fill="#e23b52"/>
           <path d="M22 16 L34 16 L32 30 L24 30 Z" fill="#e23b52"/>`,
  },
];

// 종류(카테고리)를 화면에 보여줄 한글 이름
const categoryNames = {
  hat: "모자",
  top: "상의",
  shoes: "신발",
};

// -------------------------------------------------------------------
// 2) 지금 입고 있는 옷을 기억하는 공간
//    예) { hat: "hat_straw", top: null, shoes: null }
// -------------------------------------------------------------------
const wearing = { hat: null, top: null, shoes: null };

// -------------------------------------------------------------------
// 3) 옷장(버튼 목록)을 화면에 그리는 함수
// -------------------------------------------------------------------
function drawWardrobe() {
  const list = document.getElementById("wardrobe-list");
  list.innerHTML = ""; // 일단 비우고 다시 그려요

  // 종류별(모자 → 상의 → 신발)로 묶어서 보여줘요
  for (const category of ["hat", "top", "shoes"]) {
    // 종류 제목
    const title = document.createElement("div");
    title.className = "category-title";
    title.textContent = categoryNames[category];
    list.appendChild(title);

    // 그 종류에 속한 옷 버튼들을 담을 격자
    const grid = document.createElement("div");
    grid.className = "item-grid";

    // 이 종류의 옷만 골라서 버튼으로 만들어요
    const itemsOfThisType = wardrobe.filter((item) => item.category === category);
    for (const item of itemsOfThisType) {
      const button = document.createElement("div");
      button.className = "item";
      // 지금 입고 있는 옷이면 강조 표시(selected)를 붙여요
      if (wearing[item.category] === item.id) {
        button.classList.add("selected");
      }
      button.innerHTML = `
        <svg viewBox="0 0 40 40">${item.icon}</svg>
        <div class="item-name">${item.name}</div>`;

      // 이 버튼을 누르면 clickItem 함수가 실행돼요
      button.addEventListener("click", () => clickItem(item));

      grid.appendChild(button);
    }
    list.appendChild(grid);
  }
}

// -------------------------------------------------------------------
// 4) 옷을 클릭했을 때 하는 일
//    - 같은 옷을 또 누르면 → 벗기
//    - 다른 옷을 누르면 → 갈아입기
// -------------------------------------------------------------------
function clickItem(item) {
  if (wearing[item.category] === item.id) {
    wearing[item.category] = null; // 벗기
  } else {
    wearing[item.category] = item.id; // 입기(갈아입기)
  }
  dressCharacter(); // 캐릭터 그림 다시 그리기
  drawWardrobe();   // 버튼 강조 다시 그리기
}

// -------------------------------------------------------------------
// 5) 캐릭터에게 지금 입고 있는 옷을 실제로 그려주는 함수
//    각 '층(layer)'에 해당하는 옷 그림을 넣어요.
// -------------------------------------------------------------------
function dressCharacter() {
  for (const category of ["hat", "top", "shoes"]) {
    const layer = document.getElementById("layer-" + category);
    const wornId = wearing[category];
    if (wornId) {
      // 입고 있는 옷을 찾아서 그 그림을 층에 넣어요
      const item = wardrobe.find((it) => it.id === wornId);
      layer.innerHTML = item.onBody;
    } else {
      layer.innerHTML = ""; // 아무것도 안 입었으면 비워요
    }
  }
}

// -------------------------------------------------------------------
// 6) 게임 시작! 화면을 처음 한 번 그려요.
// -------------------------------------------------------------------
drawWardrobe();
dressCharacter();
