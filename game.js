// ===================================================================
//  게임의 두뇌 (game.js) - 2단계
//  하는 일:
//   1) 여러 캐릭터를 골라주는 화면
//   2) 고른 캐릭터에게 옷을 입히는 화면
// ===================================================================

// -------------------------------------------------------------------
// 1) 캐릭터 목록
//    캐릭터 하나하나를 여기에 적어둬요.
//    - id        : 고유 이름표
//    - name      : 화면에 보일 이름
//    - personality : 성격 한 줄 (나중에 요구조건/AI평가에서 써요)
//    - skin      : 피부색
//    - hairColor : 머리 색
//    - hairStyle : 머리 모양 ("bob"=단발, "long"=긴머리, "short"=짧은머리)
// -------------------------------------------------------------------
const characters = [
  {
    id: "minji",
    name: "민지",
    personality: "발랄하고 러블리한 걸 좋아해요",
    skin: "#f7d7b5",
    hairColor: "#5b3b2e",
    hairStyle: "bob",
  },
  {
    id: "haneul",
    name: "하늘",
    personality: "차분하고 우아한 스타일을 좋아해요",
    skin: "#f2c9a0",
    hairColor: "#2b2b2b",
    hairStyle: "long",
  },
  {
    id: "luna",
    name: "루나",
    personality: "개성 있고 톡톡 튀는 걸 좋아해요",
    skin: "#f9dcc4",
    hairColor: "#d46aa0",
    hairStyle: "short",
  },
];

// -------------------------------------------------------------------
// 2) 옷장 데이터 (1단계와 동일)
// -------------------------------------------------------------------
const wardrobe = [
  // ---- 모자 ----
  {
    id: "hat_straw", category: "hat", name: "밀짚모자",
    onBody: `
      <ellipse cx="150" cy="60" rx="70" ry="16" fill="#e8c06a"/>
      <path d="M118 60 Q150 18 182 60 Z" fill="#f0cd7d"/>
      <ellipse cx="150" cy="60" rx="34" ry="7" fill="#d9a94e"/>`,
    icon: `<ellipse cx="20" cy="26" rx="16" ry="5" fill="#e8c06a"/>
           <path d="M9 26 Q20 8 31 26 Z" fill="#f0cd7d"/>`,
  },
  {
    id: "hat_crown", category: "hat", name: "왕관",
    onBody: `
      <path d="M112 62 L124 36 L138 56 L150 30 L162 56 L176 36 L188 62 Z" fill="#ffd54a" stroke="#e6b800" stroke-width="2"/>
      <circle cx="150" cy="40" r="4" fill="#ff5b8a"/>`,
    icon: `<path d="M6 30 L11 12 L18 26 L20 8 L22 26 L29 12 L34 30 Z" fill="#ffd54a" stroke="#e6b800" stroke-width="1.5"/>`,
  },

  // ---- 상의 ----
  {
    id: "top_dress", category: "top", name: "핑크 원피스",
    onBody: `
      <path d="M112 150 Q150 138 188 150 L206 300 L94 300 Z" fill="#ff86b3"/>
      <path d="M112 150 Q150 168 188 150 L184 180 Q150 196 116 180 Z" fill="#ff6fa5"/>`,
    icon: `<path d="M11 10 Q20 6 29 10 L34 34 L6 34 Z" fill="#ff86b3"/>`,
  },
  {
    id: "top_tee", category: "top", name: "노란 티셔츠",
    onBody: `
      <path d="M100 150 L112 150 Q150 138 188 150 L200 150 L200 176 L186 182 L186 240 L114 240 L114 182 L100 176 Z" fill="#ffd94a"/>`,
    icon: `<path d="M7 12 L11 10 Q20 6 29 10 L33 12 L33 19 L29 21 L29 34 L11 34 L11 21 L7 19 Z" fill="#ffd94a"/>`,
  },

  // ---- 신발 ----
  {
    id: "shoes_sneakers", category: "shoes", name: "운동화",
    onBody: `
      <rect x="118" y="338" width="30" height="16" rx="8" fill="#ffffff" stroke="#4a90d9" stroke-width="3"/>
      <rect x="152" y="338" width="30" height="16" rx="8" fill="#ffffff" stroke="#4a90d9" stroke-width="3"/>`,
    icon: `<rect x="5" y="18" width="14" height="9" rx="4" fill="#fff" stroke="#4a90d9" stroke-width="2"/>
           <rect x="21" y="18" width="14" height="9" rx="4" fill="#fff" stroke="#4a90d9" stroke-width="2"/>`,
  },
  {
    id: "shoes_heels", category: "shoes", name: "빨간 구두",
    onBody: `
      <path d="M118 338 L150 338 L146 352 L120 352 Z" fill="#e23b52"/>
      <path d="M152 338 L184 338 L182 352 L156 352 Z" fill="#e23b52"/>`,
    icon: `<path d="M6 16 L20 16 L18 30 L8 30 Z" fill="#e23b52"/>
           <path d="M22 16 L34 16 L32 30 L24 30 Z" fill="#e23b52"/>`,
  },
];

const categoryNames = { hat: "모자", top: "상의", shoes: "신발" };

// -------------------------------------------------------------------
// 3) 지금 상태를 기억하는 공간
// -------------------------------------------------------------------
let currentCharacter = null;                 // 지금 고른 캐릭터
const wearing = { hat: null, top: null, shoes: null }; // 지금 입은 옷

// -------------------------------------------------------------------
// 4) 캐릭터 그림(임시)을 만들어주는 함수
//    캐릭터마다 피부/머리 색·모양을 다르게 그려요.
//    includeLayers=true 이면 옷을 걸 '빈 층'도 같이 넣어요.
// -------------------------------------------------------------------
function renderCharacterBase(char, includeLayers) {
  // 머리 모양별 그림
  let hairBack = "";   // 머리(뒤쪽, 긴머리 가닥)
  let hairFront = "";  // 머리(앞/윗부분)
  if (char.hairStyle === "bob") {
    hairFront = `<path d="M104 96 Q100 46 150 46 Q200 46 196 96 Q196 118 188 124 L188 66 Q150 60 112 66 L112 124 Q104 118 104 96 Z" fill="${char.hairColor}"/>`;
  } else if (char.hairStyle === "long") {
    hairBack = `<path d="M104 90 Q100 150 108 168 L124 168 L120 96 Z" fill="${char.hairColor}"/>
                <path d="M196 90 Q200 150 192 168 L176 168 L180 96 Z" fill="${char.hairColor}"/>`;
    hairFront = `<path d="M104 96 Q100 44 150 44 Q200 44 196 96 Q196 74 150 68 Q104 74 104 96 Z" fill="${char.hairColor}"/>`;
  } else { // short
    hairFront = `<path d="M106 92 Q104 48 150 48 Q196 48 194 92 Q194 72 150 70 Q106 72 106 92 Z" fill="${char.hairColor}"/>`;
  }

  const shoesLayer = includeLayers ? `<g id="layer-shoes"></g>` : "";
  const topLayer   = includeLayers ? `<g id="layer-top"></g>`   : "";
  const hatLayer   = includeLayers ? `<g id="layer-hat"></g>`   : "";

  return `
    <!-- 다리 -->
    <rect x="128" y="255" width="18" height="90" rx="9" fill="${char.skin}"/>
    <rect x="154" y="255" width="18" height="90" rx="9" fill="${char.skin}"/>
    ${shoesLayer}
    <!-- 팔 -->
    <rect x="95" y="150" width="16" height="80" rx="8" fill="${char.skin}"/>
    <rect x="189" y="150" width="16" height="80" rx="8" fill="${char.skin}"/>
    <!-- 몸통 -->
    <path d="M110 150 Q150 138 190 150 L182 258 L118 258 Z" fill="${char.skin}"/>
    ${topLayer}
    <!-- 머리(뒤 가닥) -->
    ${hairBack}
    <!-- 머리(얼굴) -->
    <circle cx="150" cy="95" r="46" fill="${char.skin}"/>
    <!-- 눈, 미소 -->
    <circle cx="135" cy="95" r="4" fill="#3a2b25"/>
    <circle cx="165" cy="95" r="4" fill="#3a2b25"/>
    <path d="M138 112 Q150 122 162 112" stroke="#b56a5a" stroke-width="3" fill="none" stroke-linecap="round"/>
    <!-- 머리(앞) -->
    ${hairFront}
    ${hatLayer}`;
}

// -------------------------------------------------------------------
// 5) 화면 전환 (고르는 화면 <-> 입히는 화면)
// -------------------------------------------------------------------
function showScreen(name) {
  document.getElementById("screen-select").classList.toggle("hidden", name !== "select");
  document.getElementById("screen-dressup").classList.toggle("hidden", name !== "dressup");
}

// -------------------------------------------------------------------
// 6) 캐릭터 고르는 화면 그리기
// -------------------------------------------------------------------
function drawCharacterSelect() {
  const list = document.getElementById("character-list");
  list.innerHTML = "";

  for (const char of characters) {
    const card = document.createElement("div");
    card.className = "char-card";
    card.innerHTML = `
      <svg viewBox="0 0 300 400" class="char-preview">${renderCharacterBase(char, false)}</svg>
      <div class="char-name">${char.name}</div>
      <div class="char-personality">${char.personality}</div>`;
    // 카드를 누르면 그 캐릭터를 고르고 입히는 화면으로 가요
    card.addEventListener("click", () => selectCharacter(char));
    list.appendChild(card);
  }
}

// -------------------------------------------------------------------
// 7) 캐릭터를 골랐을 때
// -------------------------------------------------------------------
function selectCharacter(char) {
  currentCharacter = char;
  // 새 캐릭터를 고르면 입은 옷은 초기화해요
  wearing.hat = null;
  wearing.top = null;
  wearing.shoes = null;

  // 입히는 화면의 이름표와 캐릭터 그림을 준비
  document.getElementById("current-name").textContent = char.name;
  document.getElementById("current-personality").textContent = char.personality;
  document.getElementById("character-svg").innerHTML = renderCharacterBase(char, true);

  drawWardrobe();
  dressCharacter();
  showScreen("dressup");
}

// -------------------------------------------------------------------
// 8) 옷장(버튼 목록) 그리기
// -------------------------------------------------------------------
function drawWardrobe() {
  const list = document.getElementById("wardrobe-list");
  list.innerHTML = "";

  for (const category of ["hat", "top", "shoes"]) {
    const title = document.createElement("div");
    title.className = "category-title";
    title.textContent = categoryNames[category];
    list.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "item-grid";

    const itemsOfThisType = wardrobe.filter((item) => item.category === category);
    for (const item of itemsOfThisType) {
      const button = document.createElement("div");
      button.className = "item";
      if (wearing[item.category] === item.id) button.classList.add("selected");
      button.innerHTML = `
        <svg viewBox="0 0 40 40">${item.icon}</svg>
        <div class="item-name">${item.name}</div>`;
      button.addEventListener("click", () => clickItem(item));
      grid.appendChild(button);
    }
    list.appendChild(grid);
  }
}

// -------------------------------------------------------------------
// 9) 옷을 클릭했을 때 (같은 옷=벗기 / 다른 옷=갈아입기)
// -------------------------------------------------------------------
function clickItem(item) {
  if (wearing[item.category] === item.id) {
    wearing[item.category] = null;
  } else {
    wearing[item.category] = item.id;
  }
  dressCharacter();
  drawWardrobe();
}

// -------------------------------------------------------------------
// 10) 캐릭터에게 지금 입은 옷을 실제로 그려주기
// -------------------------------------------------------------------
function dressCharacter() {
  for (const category of ["hat", "top", "shoes"]) {
    const layer = document.getElementById("layer-" + category);
    const wornId = wearing[category];
    if (wornId) {
      const item = wardrobe.find((it) => it.id === wornId);
      layer.innerHTML = item.onBody;
    } else {
      layer.innerHTML = "";
    }
  }
}

// -------------------------------------------------------------------
// 11) '캐릭터 다시 고르기' 버튼
// -------------------------------------------------------------------
document.getElementById("back-button").addEventListener("click", () => {
  showScreen("select");
});

// -------------------------------------------------------------------
// 12) 게임 시작! 처음엔 캐릭터 고르는 화면부터.
// -------------------------------------------------------------------
drawCharacterSelect();
showScreen("select");
