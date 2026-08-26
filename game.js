// ===================================================================
//  게임의 두뇌 (game.js) - 3단계 (수정판)
//
//  핵심 설계:
//   - 유저는 캐릭터의 '대사(quote)'만 보고 감으로 옷을 입혀요.
//   - 상세 평가 기준은 'evalPrompt'에 숨겨둬요 (화면에 안 보임).
//     이건 나중에 5단계에서 LLM(AI)에게 전달해서 채점받을 재료예요.
//   - '완성!' 버튼은 언제든 누를 수 있어요. (유저가 "다 됐다" 하면 끝)
// ===================================================================

// -------------------------------------------------------------------
// 1) 캐릭터 목록
//    - quote      : 유저에게 보이는 대사/힌트 (이걸 보고 유추해서 입힘)
//    - evalPrompt : 유저에게 '안 보이는' 상세 평가 기준.
//                   나중에 LLM에게 "이 기준으로 채점해줘" 하고 넘길 문장이에요.
// -------------------------------------------------------------------
const characters = [
  {
    id: "minji",
    name: "민지",
    quote: "오늘 소풍 가는 날이야! 화사하고 사랑스럽게 입혀줘 💕",
    skin: "#f7d7b5",
    hairColor: "#5b3b2e",
    hairStyle: "bob",
    // ↓↓↓ 유저에겐 안 보임 (LLM 평가용 프롬프트) ↓↓↓
    evalPrompt:
      "민지는 발랄하고 러블리한 스타일을 좋아합니다. 핑크·파스텔 계열이나 " +
      "사랑스러운 아이템(원피스, 리본, 밀짚모자 등)에는 높은 점수를 주세요. " +
      "운동화처럼 스포티하거나 투박한 아이템은 컨셉과 어울리지 않아 낮게 평가합니다. " +
      "머리끝부터 발끝까지 갖춰 입었는지, 전체적으로 화사하게 통일됐는지도 함께 봐 주세요.",
    // ↓↓↓ '가짜 평가'가 점수를 계산할 때 쓰는 내부 기준 (나중에 LLM 쓰면 필요 없어짐)
    likeTags: ["cute"],
    dislikeTags: ["sporty"],
  },
  {
    id: "haneul",
    name: "하늘",
    quote: "중요한 파티에 초대받았어. 우아하고 품격 있게 부탁해.",
    skin: "#f2c9a0",
    hairColor: "#2b2b2b",
    hairStyle: "long",
    evalPrompt:
      "하늘은 차분하고 우아한 스타일을 좋아합니다. 왕관, 구두, 드레스처럼 " +
      "격식 있고 우아한 아이템에는 높은 점수를 주세요. 캐주얼하거나 편한 느낌의 " +
      "아이템(티셔츠, 운동화)은 파티 컨셉과 맞지 않아 낮게 평가합니다. " +
      "전체적으로 통일감 있고 세련됐는지를 중점적으로 봐 주세요.",
    likeTags: ["elegant"],
    dislikeTags: ["casual"],
  },
  {
    id: "luna",
    name: "루나",
    quote: "오늘은 나답게! 남들과 다른, 톡톡 튀는 스타일이면 좋겠어 ✨",
    skin: "#f9dcc4",
    hairColor: "#d46aa0",
    hairStyle: "short",
    evalPrompt:
      "루나는 개성 있고 톡톡 튀는 스타일을 좋아합니다. 남들과 다른 조합이나 " +
      "포인트가 되는 개성 있는 아이템에는 높은 점수를 주세요. 너무 무난하거나 " +
      "지나치게 격식만 차린 조합은 재미없다고 느껴 낮게 평가합니다. " +
      "과감하고 자기다운 매치인지, 밋밋하지 않은지를 봐 주세요.",
    likeTags: ["unique"],
    dislikeTags: ["elegant"],
  },
];

// -------------------------------------------------------------------
// 2) 옷장 데이터
//    옷마다 'tags'(성격 태그)는 그대로 둬요.
//    이건 이제 화면에 안 보이고, 나중에 AI 평가를 도울 '내부 정보'예요.
// -------------------------------------------------------------------
const wardrobe = [
  // ---- 모자 ----
  {
    id: "hat_straw", category: "hat", name: "밀짚모자", tags: ["cute", "casual"],
    onBody: `
      <ellipse cx="150" cy="60" rx="70" ry="16" fill="#e8c06a"/>
      <path d="M118 60 Q150 18 182 60 Z" fill="#f0cd7d"/>
      <ellipse cx="150" cy="60" rx="34" ry="7" fill="#d9a94e"/>`,
    icon: `<ellipse cx="20" cy="26" rx="16" ry="5" fill="#e8c06a"/>
           <path d="M9 26 Q20 8 31 26 Z" fill="#f0cd7d"/>`,
  },
  {
    id: "hat_crown", category: "hat", name: "왕관", tags: ["elegant", "unique"],
    onBody: `
      <path d="M112 62 L124 36 L138 56 L150 30 L162 56 L176 36 L188 62 Z" fill="#ffd54a" stroke="#e6b800" stroke-width="2"/>
      <circle cx="150" cy="40" r="4" fill="#ff5b8a"/>`,
    icon: `<path d="M6 30 L11 12 L18 26 L20 8 L22 26 L29 12 L34 30 Z" fill="#ffd54a" stroke="#e6b800" stroke-width="1.5"/>`,
  },

  // ---- 상의 ----
  {
    id: "top_dress", category: "top", name: "핑크 원피스", tags: ["cute", "elegant"],
    onBody: `
      <path d="M112 150 Q150 138 188 150 L206 300 L94 300 Z" fill="#ff86b3"/>
      <path d="M112 150 Q150 168 188 150 L184 180 Q150 196 116 180 Z" fill="#ff6fa5"/>`,
    icon: `<path d="M11 10 Q20 6 29 10 L34 34 L6 34 Z" fill="#ff86b3"/>`,
  },
  {
    id: "top_tee", category: "top", name: "노란 티셔츠", tags: ["casual", "unique"],
    onBody: `
      <path d="M100 150 L112 150 Q150 138 188 150 L200 150 L200 176 L186 182 L186 240 L114 240 L114 182 L100 176 Z" fill="#ffd94a"/>`,
    icon: `<path d="M7 12 L11 10 Q20 6 29 10 L33 12 L33 19 L29 21 L29 34 L11 34 L11 21 L7 19 Z" fill="#ffd94a"/>`,
  },

  // ---- 신발 ----
  {
    id: "shoes_sneakers", category: "shoes", name: "운동화", tags: ["casual", "sporty"],
    onBody: `
      <rect x="118" y="338" width="30" height="16" rx="8" fill="#ffffff" stroke="#4a90d9" stroke-width="3"/>
      <rect x="152" y="338" width="30" height="16" rx="8" fill="#ffffff" stroke="#4a90d9" stroke-width="3"/>`,
    icon: `<rect x="5" y="18" width="14" height="9" rx="4" fill="#fff" stroke="#4a90d9" stroke-width="2"/>
           <rect x="21" y="18" width="14" height="9" rx="4" fill="#fff" stroke="#4a90d9" stroke-width="2"/>`,
  },
  {
    id: "shoes_heels", category: "shoes", name: "빨간 구두", tags: ["elegant"],
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
let currentCharacter = null;
const wearing = { hat: null, top: null, shoes: null };

// -------------------------------------------------------------------
// 4) 캐릭터 그림(임시) 만들기
//    - includeLayers=true : 옷을 걸 '빈 층'을 id와 함께 넣어요 (입히기 화면용)
//    - baked 를 주면       : 그 옷 그림을 아예 박아서 그려요 (런웨이/카드용)
// -------------------------------------------------------------------
function renderCharacterBase(char, includeLayers, baked) {
  let hairBack = "";
  let hairFront = "";
  if (char.hairStyle === "bob") {
    hairFront = `<path d="M104 96 Q100 46 150 46 Q200 46 196 96 Q196 118 188 124 L188 66 Q150 60 112 66 L112 124 Q104 118 104 96 Z" fill="${char.hairColor}"/>`;
  } else if (char.hairStyle === "long") {
    hairBack = `<path d="M104 90 Q100 150 108 168 L124 168 L120 96 Z" fill="${char.hairColor}"/>
                <path d="M196 90 Q200 150 192 168 L176 168 L180 96 Z" fill="${char.hairColor}"/>`;
    hairFront = `<path d="M104 96 Q100 44 150 44 Q200 44 196 96 Q196 74 150 68 Q104 74 104 96 Z" fill="${char.hairColor}"/>`;
  } else { // short
    hairFront = `<path d="M106 92 Q104 48 150 48 Q196 48 194 92 Q194 72 150 70 Q106 72 106 92 Z" fill="${char.hairColor}"/>`;
  }

  const b = baked || { hat: "", top: "", shoes: "" };
  const shoesLayer = includeLayers ? `<g id="layer-shoes"></g>` : b.shoes;
  const topLayer   = includeLayers ? `<g id="layer-top"></g>`   : b.top;
  const hatLayer   = includeLayers ? `<g id="layer-hat"></g>`   : b.hat;

  return `
    <rect x="128" y="255" width="18" height="90" rx="9" fill="${char.skin}"/>
    <rect x="154" y="255" width="18" height="90" rx="9" fill="${char.skin}"/>
    ${shoesLayer}
    <rect x="95" y="150" width="16" height="80" rx="8" fill="${char.skin}"/>
    <rect x="189" y="150" width="16" height="80" rx="8" fill="${char.skin}"/>
    <path d="M110 150 Q150 138 190 150 L182 258 L118 258 Z" fill="${char.skin}"/>
    ${topLayer}
    ${hairBack}
    <circle cx="150" cy="95" r="46" fill="${char.skin}"/>
    <circle cx="135" cy="95" r="4" fill="#3a2b25"/>
    <circle cx="165" cy="95" r="4" fill="#3a2b25"/>
    <path d="M138 112 Q150 122 162 112" stroke="#b56a5a" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${hairFront}
    ${hatLayer}`;
}

// -------------------------------------------------------------------
// 5) 화면 전환
// -------------------------------------------------------------------
function showScreen(name) {
  document.getElementById("screen-select").classList.toggle("hidden", name !== "select");
  document.getElementById("screen-dressup").classList.toggle("hidden", name !== "dressup");
  document.getElementById("screen-runway").classList.toggle("hidden", name !== "runway");
}

// -------------------------------------------------------------------
// 6) 캐릭터 고르는 화면 그리기
//    여기서 유저는 캐릭터의 '대사(quote)'를 보고 어떤 캐릭터인지 감을 잡아요.
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
      <div class="char-quote">“${char.quote}”</div>`;
    card.addEventListener("click", () => selectCharacter(char));
    list.appendChild(card);
  }
}

// -------------------------------------------------------------------
// 7) 캐릭터를 골랐을 때
// -------------------------------------------------------------------
function selectCharacter(char) {
  currentCharacter = char;
  wearing.hat = null;
  wearing.top = null;
  wearing.shoes = null;

  // 입히는 화면 상단에 캐릭터 이름과 '대사'를 보여줘요 (유일한 힌트!)
  document.getElementById("current-name").textContent = char.name;
  document.getElementById("current-quote").textContent = `“${char.quote}”`;
  document.getElementById("character-svg").innerHTML = renderCharacterBase(char, true);

  document.getElementById("finish-message").textContent = "";
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
// 9) 옷을 클릭했을 때
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
// 10) 캐릭터에게 지금 입은 옷 그려주기
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
// 11) 지금 입은 옷 목록을 가져오는 도우미
//     (나중에 LLM에게 "이런 옷을 입혔어요" 하고 알려줄 때 써요.)
// -------------------------------------------------------------------
function getWornItems() {
  const worn = [];
  for (const category of ["hat", "top", "shoes"]) {
    const id = wearing[category];
    if (id) worn.push(wardrobe.find((it) => it.id === id));
  }
  return worn;
}

// -------------------------------------------------------------------
// 12) 옷을 입은 캐릭터를 '통째로' 그리기 (런웨이용)
//     입히기 화면에선 옷을 층(layer)에 넣지만,
//     런웨이에선 지금 입은 옷을 그림에 아예 박아서 한 장으로 만들어요.
// -------------------------------------------------------------------
function renderDressed(char) {
  const baked = { hat: "", top: "", shoes: "" };
  for (const category of ["hat", "top", "shoes"]) {
    const id = wearing[category];
    if (id) baked[category] = wardrobe.find((it) => it.id === id).onBody;
  }
  return renderCharacterBase(char, false, baked);
}

// -------------------------------------------------------------------
// 13) [4단계 핵심] '완성!' → 런웨이 무대로 보내기
// -------------------------------------------------------------------
function startRunway() {
  // 지금 입은 모습 그대로 런웨이 캐릭터를 그려요
  document.getElementById("runway-svg").innerHTML = renderDressed(currentCharacter);
  document.getElementById("runway-name").textContent = currentCharacter.name;

  showScreen("runway");
  playWalk();
}

// 걷기 애니메이션을 재생(또는 다시 재생)하는 함수
function playWalk() {
  const walker = document.getElementById("walker");
  const controls = document.getElementById("runway-controls");

  controls.classList.add("hidden");     // 걷는 동안엔 버튼 숨김

  // 애니메이션을 처음부터 다시 시작시키는 기법:
  // 클래스를 뗐다가 → 브라우저가 한 번 그리게 한 뒤 → 다시 붙여요.
  walker.classList.remove("walking");
  void walker.offsetWidth; // (브라우저에게 "지금 상태를 반영해" 하고 알리는 한 줄)
  walker.classList.add("walking");
}

// 걷기가 끝나면(무대 앞 도착) 흔들림을 멈추고 버튼들을 보여줘요
document.getElementById("walker").addEventListener("animationend", () => {
  document.getElementById("walker").classList.remove("walking"); // 위아래 흔들림 정지 → 포즈
  document.getElementById("runway-controls").classList.remove("hidden");
});

// '완성!' 버튼 → 런웨이 시작
document.getElementById("finish-button").addEventListener("click", startRunway);

// '다시 걷기' 버튼
document.getElementById("rewalk-button").addEventListener("click", playWalk);

// '옷 고치기' 버튼 → 입히기 화면으로 (지금 입은 옷 그대로 유지)
document.getElementById("runway-edit-button").addEventListener("click", () => {
  showScreen("dressup");
});

// ===================================================================
//  [5단계 핵심] 옷차림 평가하기
//
//  ★★★ 나중에 '진짜 AI(LLM)'로 바꿀 부분은 딱 이 evaluateOutfit 함수예요. ★★★
//  지금은 인터넷/AI 없이, 미리 정한 규칙으로 점수를 계산하는 '가짜 평가'예요.
//  나중에는 이 함수 안에서 character.evalPrompt(숨은 기준)와 입은 옷을
//  LLM에게 보내서 점수·코멘트를 받아오도록 바꾸면 돼요.
//
//  입력: character(캐릭터), worn(입은 옷 목록)
//  출력: { score(점수), verdict(한줄평), comment(코멘트) }
// ===================================================================
function evaluateOutfit(character, worn) {
  let score = 60; // 기본 점수

  // 입은 옷들의 태그를 한 곳에 모아요
  const matchedLikes = [];    // 취향에 맞은 아이템
  const matchedDislikes = []; // 취향에 안 맞은 아이템
  for (const item of worn) {
    if (item.tags.some((t) => character.likeTags.includes(t))) {
      score += 12;
      matchedLikes.push(item.name);
    }
    if (item.tags.some((t) => character.dislikeTags.includes(t))) {
      score -= 15;
      matchedDislikes.push(item.name);
    }
  }

  // 머리끝~발끝 다 갖춰 입었는지 (모자·상의·신발)
  const fullyDressed = wearing.hat && wearing.top && wearing.shoes;
  const missing = [];
  if (!wearing.hat) missing.push("모자");
  if (!wearing.top) missing.push("상의");
  if (!wearing.shoes) missing.push("신발");
  if (fullyDressed) score += 15;

  // 점수를 0~100 사이로 정리
  score = Math.max(0, Math.min(100, score));

  // 점수에 따른 한줄평(verdict)과 이모지
  let verdict, emoji;
  if (score >= 85)      { verdict = "완벽해요! 오늘의 주인공! "; emoji = "👑"; }
  else if (score >= 70) { verdict = "꽤 마음에 들어요!";        emoji = "😊"; }
  else if (score >= 50) { verdict = "음… 나쁘진 않은데.";       emoji = "🤔"; }
  else                  { verdict = "이건 내 취향이 아니야…";    emoji = "😵"; }

  // 캐릭터가 말하듯 코멘트를 만들어요
  const parts = [];
  if (matchedLikes.length) parts.push(`${matchedLikes.join(", ")}는 완전 내 취향이야!`);
  if (matchedDislikes.length) parts.push(`근데 ${matchedDislikes.join(", ")}는 오늘 컨셉이랑 좀 안 맞아 ㅠ`);
  if (missing.length) parts.push(`${missing.join(", ")}까지 챙겼으면 더 좋았을 텐데!`);
  if (!parts.length) parts.push("음, 무난하네. 좀 더 나다운 포인트가 있으면 좋겠어.");
  const comment = parts.join(" ");

  return { score, verdict, emoji, comment };
}

// 'AI 평가 받기' 버튼 → 평가 실행 후 결과 카드 보여주기
document.getElementById("evaluate-button").addEventListener("click", () => {
  const worn = getWornItems();
  const result = evaluateOutfit(currentCharacter, worn);

  document.getElementById("result-emoji").textContent = result.emoji;
  document.getElementById("result-score-num").textContent = result.score;
  document.getElementById("result-verdict").textContent = result.verdict;
  document.getElementById("result-comment").textContent = `${currentCharacter.name}: “${result.comment}”`;

  document.getElementById("result-overlay").classList.remove("hidden");
});

// 결과 카드의 '옷 다시 입히기' 버튼
document.getElementById("result-edit-button").addEventListener("click", () => {
  document.getElementById("result-overlay").classList.add("hidden");
  showScreen("dressup");
});

// 결과 카드의 '다른 캐릭터' 버튼
document.getElementById("result-again-button").addEventListener("click", () => {
  document.getElementById("result-overlay").classList.add("hidden");
  showScreen("select");
});

// -------------------------------------------------------------------
// 13) '캐릭터 다시 고르기' 버튼
// -------------------------------------------------------------------
document.getElementById("back-button").addEventListener("click", () => {
  showScreen("select");
});

// -------------------------------------------------------------------
// 14) 게임 시작!
// -------------------------------------------------------------------
drawCharacterSelect();
showScreen("select");
