// ---------- 욕구 ----------
const needs = { hunger: 0.85, energy: 0.9, bond: 0.08 };
const careStats = {
  mealsFed: 0,
  lastMealAt: 0,
  napsTaken: 0,
  lastNapAt: 0,
  petStrokes: 0,
  lastPetAt: 0,
  lastCareLine: '아직 세상 구경 전',
  lastCareAt: 0,
  favoriteMeals: 0,
  routineBits: 0,
  routineCount: 0,
  lastRoutineAt: 0,
  traitMask: 0,
  fetchCount: 0,
  lastPlayAt: 0,
  stage: 'egg',
  stageChangedAt: nowTime(),
  hatchWarmth: 0,
  battleWins: 0,
  lastBattleAt: 0,
  grime: 0,
  adoptedAt: nowTime(),
  lastDailyLoginDay: -1,
  anniversaryMask: 0,
  memoryLog: [{ text: '아직 세상 구경 전', at: 0 }],
  pebbles: 0,
  lastWalkPebbleDay: -1,
  furnitureOwned: [],
  furnitureStored: [],
  furniturePlaced: {},
  stats: { tough: 0, quick: 0, power: 0 },
  league: { defeated: [], current: 'yard' },
  kinship: { daily: 0, walk: 0, battle: 0, xp: 0, lastDailyDay: -1 },
};
careStats.furniturePlaced = migrateFurniturePlaced(null);
let food = null;                             // {x, y} 밥그릇
let ball = null;
let battle = null;
let battleResult = null;
let battleDefeatReturn = null;
let place = 'home';
let travel = null;
let battleReturnT = 0;
let walkReturnT = 0;
const SAVE_KEY = 'protopet-care-v1';
const CARE_ACTION_BITS = { meal: 1, rest: 2, pet: 4 };
const ROUGHNESS_THROW_GAIN = 0.34;
const ROUGHNESS_SURPRISE_GAIN = 0.18;
const ROUGHNESS_DECAY_PER_SECOND = 0.06;
const ROUGHNESS_PENALTY_THRESHOLD = 0.5;
const ROUGHNESS_CLOSE_BOND = 0.55;
const ROUGHNESS_BOND_PENALTY = -0.012;
const ROUGHNESS_CLOSE_BOND_PENALTY = -0.006;
const ROUGH_HURT_LINES = ['어지러워', '무서웠어', '잠깐 내려놔 줘', '나 공 아니야', '바닥이 좋아', '나 조금 놀랐어', '눈 도는 중', '몸 흔들리는 중', '바닥 찾는 중', '잠깐 정지'];
const ROUGH_FUN_LINES = ['한 번 더!', '재밌다!', '날았다!', '또 하늘 가자', '나 봤어?', '통통 좋다'];
const FETCH_START_LINES = ['공이다!', '내가 갈게', '잡아볼래', '공 추격 중', '입 준비 중', '공만 보는 중'];
const FETCH_CAUGHT_LINES = ['잡았다', '내가 잡았어', '이거 내 거?', '입에 안전 보관', '물고 오는 중', '공 수거 완료'];
const FETCH_DONE_LINES = ['가져왔어', '나 잘했지', '다시 줄게', '칭찬해 줘', '공 반납 중', '입에서 꺼내는 중'];
const FETCH_REFUSE_LINES = ['지금은 조금 쉬자', '공은 이따가', '다리 쉬는 중', '나 배터리 없어', '공 멀리 있는 척', '누운 척'];
const FETCH_SKILL_LINES = ['나 길 알았어', '이제 좀 잘해', '공 냄새 기억해', '공 길 외우는 중'];
const EGG_LINES = ['콩', '나 여기 있어', '밖에 누구야?', '안에서 듣는 중', '껍질 안 조용해', '조금 흔들리는 중'];
const HATCH_WARM_LINES = ['따뜻해', '조금만 더', '밖에 갈까', '안쪽이 포근해', '껍질 간질간질', '나갈까 말까 중'];
const BATTLE_START_LINES = ['나 해볼게', '괜찮아', '보고 있어', '진지한 척', '발에 힘 주는 중', '작은 용기 장착'];
const BATTLE_WIN_LINES = ['나 이겼어?', '봤지?', '나 좀 했다', '안 밀렸어', '앞이 조용해짐', '발이 이긴 척'];
const BATTLE_LOSE_LINES = ['좀 누울래', '오늘은 여기까지', '다음엔 할게', '나 괜찮아', '다리 쉬는 중', '작아지는 중'];
const BATTLE_CHEER_LINES = ['들었어', '나 해볼게', '조금 세졌어', '응원 들어옴', '발 다시 출발', '용기 충전 중'];
const BATTLE_IGNORE_LINES = ['지금 집중 중', '내 맘대로 할래', '조금 바빠', '못 들은 척', '귀 닫는 중', '진지한 척 유지'];
const TRAVEL_BATTLE_LINES = ['싸우러 가자', '나 해볼게', '흙 밟으러 가', '싸움터 가는 중', '발에 힘 주는 중', '작은 용기 배송 중'];
const TRAVEL_WALK_LINES = ['밖에 가자', '냄새 맡으러 가', '같이 가', '산책중', '발 바쁜 중', '동네 구경 가는 중'];
const WALK_ARRIVE_LINES = ['여기 좋아', '바람 좋다', '풀 냄새 난다', '여기 넓어', '코 바쁜 중', '발밑 낯가리는 중'];
const RETURN_HOME_LINES = ['집이다', '돌아왔다', '여기 좋아', '아는 냄새다', '집 바닥 좋아', '다시 여기'];
const WALK_DISCOVERY_LINES = ['풀 냄새 찾은 날', '좋은 바닥 찾은 날', '작은 반짝 주운 날', '바깥 냄새 외운 날', '풀 옆에서 오래 킁킁한 날', '돌 밑이 궁금했던 날'];
const WALK_DISCOVERY_CAPTIONS = ['여기 좋아', '뭐 찾았어', '이거 봐', '킁킁 성공', '바닥 수상해', '작은 거 발견'];
const WALK_DONE_LINES = ['집 갈까?', '발 쉬자', '냄새 다 봤어', '집 냄새 생각나', '귀가 생각 중', '발 퇴근 준비'];
const SHINY_PEBBLE_CAPTIONS = ['이거 줄게', '반짝 찾았어', '작은 거 봐', '반짝 물고 옴', '입에서 선물 나옴', '작은 보물 배송'];
const ROUTINE_PEBBLE_CAPTIONS = ['이거 줄게', '고마워서 줌', '반짝 놓고 갈게', '입에서 선물 나옴', '작은 보상 배송', '반짝 반납 중'];
const WHEEL_FALL_CAPTIONS = ['어지러워', '바퀴가 셌어', '나 졌어', '바퀴 승리', '다리 꼬이는 중'];
const WHEEL_RUN_CAPTIONS = ['나 빨라?', '한 바퀴 더', '멈추는 법 까먹음', '발 시험 중', '바퀴 안 출근', '달리기 하는 척'];
const CUSHION_SLEEP_CAPTIONS = ['여기 좋아', '잘래…', '푹신해', '몸이 녹는 중', '쿠션에 잡힘', '말랑 충전 중'];
const BUTTERFLY_START_LINES = ['저거 뭐야?', '잡아볼래', '기다려 봐', '눈 따라가는 중', '작은 거 추적 중', '코까지 출동'];
const BUTTERFLY_MISS_LINES = ['놓쳤다', '봤으니까 됐어', '눈으로 잡았어', '작은 패배'];
const BUTTERFLY_NOSE_LINES = ['코에 앉았어', '나 잡힌 거야?', '간지러워', '코 점령당한 중'];
const AI_LINE_COOLDOWN = 12000;
const DAILY_GREETING_CAPTIONS = {
  morning: '왔어?',
  day: '기다렸어',
  evening: '같이 있자',
  night: '안 자?',
};
const ANNIVERSARY_DAYS = [7, 14, 30, 50, 100];
const BELLY_RUB_BOND_GAIN = 0.018;
const LEAGUE_REWARD_PEBBLES = 6;
const BATTLE_WIN_PEBBLES = 4;
const BATTLE_REMATCH_PEBBLES = 2;
const BATTLE_LOSS_PEBBLES = 1;
const BATTLE_RETURN_DELAY = 1.7;
const BATTLE_DEFEAT_RETURN_SPEED = 250;
const BATTLE_FOE_ENTRY_SPEED = 360;
const BATTLE_FOE_DEFEAT_SETTLE_SPEED = 0.52;
const BATTLE_FOE_DEFEAT_MIN_SECONDS = 0.9;
const BATTLE_FOE_DEFEAT_MAX_SECONDS = 4.2;
const BATTLE_PHYSICS_STEP_MAX = 1000 / 30;
const LEAGUES = [
  {
    id: 'yard',
    name: '공터 모임',
    memory: '공터를 평정한 날',
    opponents: [
      { id: 'yard-mungchi', name: '먼지 뭉치', seed: 0x120F17, personality: '겁쟁이', powerCoeff: 0.08, intro: '먼지 굴러옴', winLine: '나 피해도 돼?', loseLine: '먼지가 인정함' },
      { id: 'yard-kongtteok', name: '콩떡', seed: 0xC0A771, personality: '저돌', powerCoeff: 0.22, intro: '콩떡 돌진 중', winLine: '콩떡이 굴렀다', loseLine: '콩떡 납작해짐' },
      { id: 'yard-dubu', name: '두부 반장', seed: 0xD0B0AA, personality: '침착', powerCoeff: 0.46, rival: true, intro: '너 말랑하네', rematchLine: '또 왔어?', winLine: '두부 안 밀림', loseLine: '두부가 끄덕임' },
    ],
  },
  {
    id: 'alley',
    name: '골목 대회',
    memory: '골목을 지나간 날',
    opponents: [
      { id: 'alley-bori', name: '보리알', seed: 0xB0121A, personality: '겁쟁이', powerCoeff: 1.08, intro: '보리알 숨는 중', winLine: '보리알 버팀', loseLine: '보리알 놓침' },
      { id: 'alley-jelly', name: '젤리 발', seed: 0x9E1177, personality: '저돌', powerCoeff: 1.42, intro: '발 먼저 옴', winLine: '발이 이긴 척', loseLine: '발 꼬이는 중' },
      { id: 'alley-jinsun', name: '골목 진순', seed: 0x711150, personality: '침착', powerCoeff: 1.82, rival: true, intro: '여긴 내 바닥', rematchLine: '또 밟으러 왔어?', winLine: '진순이 지킴', loseLine: '진순이 비켜줌' },
    ],
  },
  {
    id: 'town',
    name: '마을 최강전',
    memory: '마을 앞에 선 날',
    opponents: [
      { id: 'town-nurung', name: '누룽 꼬리', seed: 0x901EAF, personality: '겁쟁이', powerCoeff: 1.96, intro: '꼬리만 보임', winLine: '꼬리가 살림', loseLine: '꼬리도 놀람' },
      { id: 'town-bbam', name: '빵떡 장군', seed: 0xBBAA90, personality: '저돌', powerCoeff: 2.28, intro: '빵떡 돌진 중', winLine: '빵떡 안 멈춤', loseLine: '빵떡 멈칫' },
      { id: 'town-king', name: '최강 말랑', seed: 0xF1A610, personality: '침착', powerCoeff: 2.55, rival: true, intro: '작은 애 왔네', rematchLine: '또 왔네 작은 애', winLine: '말랑이 위에 있음', loseLine: '말랑이 인정함' },
    ],
  },
];
const LEAGUE_OPPONENTS = LEAGUES.flatMap(league => league.opponents.map((opponent, index) => ({ ...opponent, leagueId: league.id, leagueName: league.name, leagueIndex: LEAGUES.indexOf(league), index })));
let sessionFetchRecorded = false;
let nextAiLineAt = 0;
const STAT_KEYS = ['tough', 'quick', 'power'];
const STAT_LABELS = { tough: '튼튼', quick: '빠름', power: '힘' };
const STAT_OBSERVATIONS = {
  tough: ['아직 평범함', '산책 뒤 덜 헉헉거림', '요즘 오래 버팀'],
  quick: ['아직 평범함', '요즘 눈에 띄게 빨라짐', '발이 먼저 나감'],
  power: ['아직 평범함', '부딪히면 제법 묵직함', '힘 쓰는 법 조금 앎'],
};
const STAT_HINTS = {
  tough: '산책과 싸움 뒤에 느는 듯',
  quick: '공놀이랑 쳇바퀴로 느는 듯',
  power: '싸움에서 버티면 느는 듯',
};
const furnitureState = {
  wheelRunT: 0,
  wheelSpin: 0,
  wheelRewarded: false,
  wheelCheered: false,
};
const CARE_TRAITS = {
  cuddly: { bit: 1, line: '손길 없으면 허전해짐', caption: '손 찾는 중' },
  foodie: { bit: 2, line: '나 밥 좋아하는 거 들킴', caption: '밥 냄새 기억함' },
  mellow: { bit: 4, line: '서두르는 법을 까먹음', caption: '천천히 할래' },
};
const BOND_MILESTONES = [
  { at: 0.25, line: '조금 친해졌어' },
  { at: 0.55, line: '이제 나 알아보지?' },
  { at: 0.85, line: '완전 믿고 있어' },
  { at: 0.95, line: '평생 껌딱지' },
];
const KINSHIP_RANKS = [
  { name: '초면', xp: 0, daily: 0, walk: 0, battle: 0 },
  { name: '눈인사', xp: 2, daily: 1, walk: 0, battle: 0 },
  { name: '낯익음', xp: 6, daily: 2, walk: 0, battle: 0 },
  { name: '기다림', xp: 13, daily: 4, walk: 1, battle: 0 },
  { name: '단짝', xp: 25, daily: 7, walk: 3, battle: 0 },
  { name: '내 편', xp: 42, daily: 10, walk: 5, battle: 1 },
  { name: '척하면 척', xp: 64, daily: 14, walk: 7, battle: 3 },
  { name: '한몸', xp: 92, daily: 20, walk: 10, battle: 6 },
  { name: '충신', xp: 130, daily: 30, walk: 15, battle: 10 },
];
const roughPlayState = {
  roughness: 0,
  penaltyCount: 0,
  flightMemoryRecorded: false,
};
let bondMilestone = 0;
const walkVisit = {
  active: false,
  discoveries: 0,
  maxDiscoveries: 0,
  nextDiscoveryAt: 0,
  targetSpot: 0,
  sniffing: false,
  sniffT: 0,
};
const butterfly = {
  active: false,
  t: 0,
  cooldown: 7,
  x: 0,
  y: 0,
  chaseT: 0,
  noseT: 0,
};
const homecoming = {
  active: false,
  arrived: false,
};
const bellyState = {
  rewarded: false,
};

function bondStage(value) {
  let stage = 0;
  for (let i = 0; i < BOND_MILESTONES.length; i++) if (value >= BOND_MILESTONES[i].at) stage = i + 1;
  return stage;
}

function normalizeKinship(savedKinship) {
  const source = savedKinship && typeof savedKinship === 'object' ? savedKinship : {};
  return {
    daily: Math.max(0, Math.floor(Number(source.daily) || 0)),
    walk: Math.max(0, Math.floor(Number(source.walk) || 0)),
    battle: Math.max(0, Math.floor(Number(source.battle) || 0)),
    xp: Math.max(0, Math.floor(Number(source.xp) || 0)),
    lastDailyDay: Math.floor(Number.isFinite(Number(source.lastDailyDay)) ? Number(source.lastDailyDay) : -1),
  };
}

function kinshipRankIndex() {
  let index = 0;
  const kinship = normalizeKinship(careStats.kinship);
  for (let i = 0; i < KINSHIP_RANKS.length; i++) {
    const rank = KINSHIP_RANKS[i];
    if (kinship.xp >= rank.xp && kinship.daily >= rank.daily && kinship.walk >= rank.walk && kinship.battle >= rank.battle) index = i;
  }
  return index;
}

function kinshipRank() {
  return KINSHIP_RANKS[kinshipRankIndex()];
}

function grantKinship(kind, amount, xp) {
  if (!['daily', 'walk', 'battle'].includes(kind)) return false;
  careStats.kinship = normalizeKinship(careStats.kinship);
  const before = kinshipRankIndex();
  careStats.kinship[kind] += Math.max(0, Math.floor(amount));
  careStats.kinship.xp += Math.max(0, Math.floor(xp));
  const after = kinshipRankIndex();
  if (after > before) {
    const rank = KINSHIP_RANKS[after];
    rememberCare(`유대 ${rank.name}이 된 날`);
    pet.caption = `${rank.name} 됐다`;
    pet.captionT = 0;
    pet.happy = Math.max(pet.happy, 0.85);
    for (let i = 0; i < 5; i++) spawn('heart', pet.x + rand(-24, 24), pet.y - pet.r * depthScale() * rand(1.0, 1.7));
  }
  saveCareState();
  return after > before;
}

function grantDailyKinship() {
  careStats.kinship = normalizeKinship(careStats.kinship);
  const today = dayStamp(nowTime());
  if (careStats.kinship.lastDailyDay === today) return false;
  careStats.kinship.lastDailyDay = today;
  return grantKinship('daily', 1, 2);
}

function updateBondMilestone() {
  const next = bondStage(needs.bond);
  if (next <= bondMilestone) return;
  bondMilestone = next;
  const milestone = BOND_MILESTONES[next - 1];
  pet.caption = milestone.line;
  pet.captionT = 0;
  rememberCare(milestone.line);
  pet.happy = Math.max(pet.happy, 0.75);
  for (let i = 0; i < 5; i++) spawn('heart', pet.x + rand(-26, 26), pet.y - pet.r * depthScale() * rand(1.0, 1.8));
}

function saveCareState() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      hunger: needs.hunger,
      energy: needs.energy,
      bond: needs.bond,
      mealsFed: careStats.mealsFed,
      lastMealAt: careStats.lastMealAt,
      napsTaken: careStats.napsTaken,
      lastNapAt: careStats.lastNapAt,
      petStrokes: careStats.petStrokes,
      lastPetAt: careStats.lastPetAt,
      lastCareLine: careStats.lastCareLine,
      lastCareAt: careStats.lastCareAt,
      favoriteMeals: careStats.favoriteMeals,
      routineBits: careStats.routineBits,
      routineCount: careStats.routineCount,
      lastRoutineAt: careStats.lastRoutineAt,
      traitMask: careStats.traitMask,
      fetchCount: careStats.fetchCount,
      lastPlayAt: careStats.lastPlayAt,
      stage: careStats.stage,
      stageChangedAt: careStats.stageChangedAt,
	      hatchWarmth: careStats.hatchWarmth,
      battleWins: careStats.battleWins,
      lastBattleAt: careStats.lastBattleAt,
	      grime: careStats.grime,
	      adoptedAt: careStats.adoptedAt,
	      lastDailyLoginDay: careStats.lastDailyLoginDay,
	      anniversaryMask: careStats.anniversaryMask,
	      memoryLog: careStats.memoryLog,
	      pebbles: careStats.pebbles,
	      lastWalkPebbleDay: careStats.lastWalkPebbleDay,
	      furnitureOwned: careStats.furnitureOwned,
	      furnitureStored: careStats.furnitureStored,
	      furniturePlaced: careStats.furniturePlaced,
	      stats: careStats.stats,
	      league: careStats.league,
	      kinship: normalizeKinship(careStats.kinship),
	      bondMilestone,
      ts: nowTime(),
    }));
  } catch (_) {}
}

function loadCareState() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (!saved) return;
    const now = nowTime();
    const savedTs = Number(saved.ts);
    const away = clamp((now - (Number.isFinite(savedTs) ? savedTs : now)) / 1000, 0, 12 * 3600);
    const savedHunger = Number(saved.hunger);
    const savedEnergy = Number(saved.energy);
    const savedBond = Number(saved.bond);
    const savedBondMilestone = Number(saved.bondMilestone);
    const savedMealsFed = Number(saved.mealsFed);
    const savedLastMealAt = Number(saved.lastMealAt);
    const savedNapsTaken = Number(saved.napsTaken);
    const savedLastNapAt = Number(saved.lastNapAt);
    const savedPetStrokes = Number(saved.petStrokes);
    const savedLastPetAt = Number(saved.lastPetAt);
    const savedLastCareAt = Number(saved.lastCareAt);
    const savedFavoriteMeals = Number(saved.favoriteMeals);
    const savedRoutineBits = Number(saved.routineBits);
    const savedRoutineCount = Number(saved.routineCount);
    const savedLastRoutineAt = Number(saved.lastRoutineAt);
    const savedTraitMask = Number(saved.traitMask);
    const savedFetchCount = Number(saved.fetchCount);
    const savedLastPlayAt = Number(saved.lastPlayAt);
    const savedStageChangedAt = Number(saved.stageChangedAt);
    const savedHatchWarmth = Number(saved.hatchWarmth);
    const savedBattleWins = Number(saved.battleWins);
    const savedLastBattleAt = Number(saved.lastBattleAt);
	    const savedGrime = Number(saved.grime);
	    const savedAdoptedAt = Number(saved.adoptedAt);
	    const savedLastDailyLoginDay = Number(saved.lastDailyLoginDay);
	    const savedAnniversaryMask = Number(saved.anniversaryMask);
	    const savedPebbles = Number(saved.pebbles);
	    const savedLastWalkPebbleDay = Number(saved.lastWalkPebbleDay);
	    needs.hunger = clamp((Number.isFinite(savedHunger) ? savedHunger : needs.hunger) - away * 0.00012, 0, 1);
    needs.energy = clamp((Number.isFinite(savedEnergy) ? savedEnergy : needs.energy) + away * 0.0002, 0, 1);
    needs.bond = clamp(Number.isFinite(savedBond) ? savedBond : needs.bond, 0, 1);
    careStats.mealsFed = Math.max(0, Math.floor(Number.isFinite(savedMealsFed) ? savedMealsFed : careStats.mealsFed));
    careStats.lastMealAt = Math.max(0, Number.isFinite(savedLastMealAt) ? savedLastMealAt : careStats.lastMealAt);
    careStats.napsTaken = Math.max(0, Math.floor(Number.isFinite(savedNapsTaken) ? savedNapsTaken : careStats.napsTaken));
    careStats.lastNapAt = Math.max(0, Number.isFinite(savedLastNapAt) ? savedLastNapAt : careStats.lastNapAt);
    careStats.petStrokes = Math.max(0, Number.isFinite(savedPetStrokes) ? savedPetStrokes : careStats.petStrokes);
    careStats.lastPetAt = Math.max(0, Number.isFinite(savedLastPetAt) ? savedLastPetAt : careStats.lastPetAt);
    const memoryFallbackAt = Math.max(0, Number.isFinite(savedLastCareAt) ? savedLastCareAt : 0);
    careStats.lastCareAt = Math.max(0, Number.isFinite(savedLastCareAt) ? savedLastCareAt : careStats.lastCareAt);
    careStats.lastCareLine = typeof saved.lastCareLine === 'string' ? saved.lastCareLine : careStats.lastCareLine;
    careStats.memoryLog = migrateMemoryLog(saved.memoryLog, careStats.lastCareLine, memoryFallbackAt);
    careStats.favoriteMeals = Math.max(0, Math.floor(Number.isFinite(savedFavoriteMeals) ? savedFavoriteMeals : careStats.favoriteMeals));
    careStats.routineBits = Math.floor(clamp(Number.isFinite(savedRoutineBits) ? savedRoutineBits : careStats.routineBits, 0, 7));
    careStats.routineCount = Math.max(0, Math.floor(Number.isFinite(savedRoutineCount) ? savedRoutineCount : careStats.routineCount));
    careStats.lastRoutineAt = Math.max(0, Number.isFinite(savedLastRoutineAt) ? savedLastRoutineAt : careStats.lastRoutineAt);
    careStats.traitMask = Math.floor(clamp(Number.isFinite(savedTraitMask) ? savedTraitMask : careStats.traitMask, 0, 7));
    careStats.fetchCount = Math.max(0, Math.floor(Number.isFinite(savedFetchCount) ? savedFetchCount : careStats.fetchCount));
    careStats.lastPlayAt = Math.max(0, Number.isFinite(savedLastPlayAt) ? savedLastPlayAt : careStats.lastPlayAt);
    careStats.stage = migrateStage(saved.stage, saved);
    careStats.stageChangedAt = Math.max(0, Number.isFinite(savedStageChangedAt) ? savedStageChangedAt : nowTime());
    careStats.hatchWarmth = clamp(Number.isFinite(savedHatchWarmth) ? savedHatchWarmth : (careStats.stage === 'egg' ? 0 : 1), 0, 1);
    careStats.battleWins = Math.max(0, Math.floor(Number.isFinite(savedBattleWins) ? savedBattleWins : careStats.battleWins));
	    careStats.lastBattleAt = Math.max(0, Number.isFinite(savedLastBattleAt) ? savedLastBattleAt : careStats.lastBattleAt);
	    careStats.grime = clamp((Number.isFinite(savedGrime) ? savedGrime : careStats.grime) + (away > 3 * 3600 ? away * 0.000012 : 0), 0, 1);
	    careStats.adoptedAt = Number.isFinite(savedAdoptedAt) && savedAdoptedAt > 0 ? savedAdoptedAt : migrateAdoptedAt(saved);
	    careStats.lastDailyLoginDay = Math.floor(Number.isFinite(savedLastDailyLoginDay) ? savedLastDailyLoginDay : -1);
	    careStats.anniversaryMask = Math.floor(clamp(Number.isFinite(savedAnniversaryMask) ? savedAnniversaryMask : 0, 0, 31));
	    careStats.pebbles = Math.max(0, Math.floor(Number.isFinite(savedPebbles) ? savedPebbles : 0));
	    careStats.lastWalkPebbleDay = Math.floor(Number.isFinite(savedLastWalkPebbleDay) ? savedLastWalkPebbleDay : -1);
	    careStats.furnitureOwned = migrateFurnitureOwned(saved.furnitureOwned);
	    careStats.furnitureStored = migrateFurnitureStored(saved.furnitureStored, careStats.furnitureOwned);
	    careStats.furniturePlaced = migrateFurniturePlaced(saved.furniturePlaced);
	    careStats.stats = migrateStats(saved.stats, careStats.fetchCount);
	    careStats.league = migrateLeague(saved.league, careStats.battleWins);
	    careStats.kinship = normalizeKinship(saved.kinship);
	    bondMilestone = Math.floor(clamp(Number.isFinite(savedBondMilestone) ? savedBondMilestone : bondStage(needs.bond), 0, BOND_MILESTONES.length));
    handleReturnEvents(away);
  } catch (_) {}
}
loadCareState();
setInterval(saveCareState, 5000);
window.addEventListener('pagehide', saveCareState);
document.addEventListener('visibilitychange', () => { if (document.hidden) saveCareState(); });

function affectNeed(name, delta) {
  needs[name] = clamp(needs[name] + delta, 0, 1);
  if (name === 'bond') updateBondMilestone();
}
function adultConditionCount() {
  let count = 0;
  if (careStats.mealsFed >= 6) count += 1;
  if (careStats.napsTaken >= 3) count += 1;
  if (careStats.petStrokes >= 150) count += 1;
  return count;
}
function migrateStage(savedStage, saved) {
  if (validStage(savedStage)) return savedStage;
  const hasHistory = Number(saved.mealsFed) > 0 || Number(saved.napsTaken) > 0 || Number(saved.petStrokes) > 0 || Number(saved.fetchCount) > 0;
  if (!hasHistory) return 'egg';
  return adultConditionCount() >= 2 ? 'adult' : 'baby';
}
function migrateMemoryLog(savedLog, currentLine, fallbackAt) {
  const fallbackTime = Number.isFinite(fallbackAt) ? Math.max(0, fallbackAt) : 0;
  if (!Array.isArray(savedLog)) return currentLine ? [{ text: currentLine, at: fallbackTime }] : [];
  return savedLog
    .map(entry => {
      if (typeof entry === 'string') return { text: entry, at: fallbackTime };
      if (!entry || typeof entry !== 'object' || typeof entry.text !== 'string') return null;
      const at = Number(entry.at);
      return { text: entry.text, at: Math.max(0, Number.isFinite(at) ? at : 0) };
    })
    .filter(entry => entry && entry.text.trim())
    .slice(-30);
}
function migrateFurnitureOwned(savedOwned) {
  if (!Array.isArray(savedOwned)) return [];
  return savedOwned.filter(id => furnitureItemById(id)).filter((id, index, owned) => owned.indexOf(id) === index);
}
function migrateFurnitureStored(savedStored, owned) {
  if (!Array.isArray(savedStored)) return [];
  const ownedIds = Array.isArray(owned) ? owned : [];
  return savedStored.filter(id => ownedIds.includes(id)).filter((id, index, stored) => stored.indexOf(id) === index);
}
function migrateFurniturePlaced(savedPlaced) {
  const placed = {};
  for (const item of FURNITURE_ITEMS) {
    const saved = savedPlaced && typeof savedPlaced === 'object' ? savedPlaced[item.id] : null;
    placed[item.id] = normalizeFurnitureRatio(item.id, saved);
  }
  return placed;
}
function normalizeFurnitureRatio(id, value) {
  const fallback = defaultFurnitureRatio(id);
  if (!value || typeof value !== 'object') return fallback;
  const xr = Number(value.xr);
  const yr = Number(value.yr);
  return {
    xr: clamp(Number.isFinite(xr) ? xr : fallback.xr, 0, 1),
    yr: clamp(Number.isFinite(yr) ? yr : fallback.yr, 0, 1),
  };
}
function migrateStats(savedStats, fetchCount) {
  const stats = { tough: 0, quick: clamp((fetchCount / 8) * 5, 0, 5), power: 0 };
  if (!savedStats || typeof savedStats !== 'object') return stats;
  for (const key of STAT_KEYS) {
    const value = Number(savedStats[key]);
    stats[key] = clamp(Number.isFinite(value) ? value : stats[key], 0, 5);
  }
  return stats;
}
function opponentById(id) {
  return LEAGUE_OPPONENTS.find(opponent => opponent.id === id) || null;
}
function leagueById(id) {
  return LEAGUES.find(league => league.id === id) || LEAGUES[0];
}
function leagueOpponentIds(league) {
  return league.opponents.map(opponent => opponent.id);
}
function migrateLeague(savedLeague, oldBattleWins) {
  const validIds = LEAGUE_OPPONENTS.map(opponent => opponent.id);
  const defeated = [];
  if (savedLeague && typeof savedLeague === 'object' && Array.isArray(savedLeague.defeated)) {
    for (const id of savedLeague.defeated) {
      if (validIds.includes(id) && !defeated.includes(id)) defeated.push(id);
    }
  } else {
    const count = Math.floor(clamp(Number(oldBattleWins) || 0, 0, LEAGUE_OPPONENTS.length));
    for (let i = 0; i < count; i++) defeated.push(LEAGUE_OPPONENTS[i].id);
  }
  const savedCurrent = savedLeague && typeof savedLeague === 'object' ? savedLeague.current : '';
  const next = LEAGUE_OPPONENTS.find(opponent => !defeated.includes(opponent.id));
  const current = leagueById(typeof savedCurrent === 'string' ? savedCurrent : next && next.leagueId).id;
  return { defeated, current };
}
function isOpponentDefeated(id) {
  return careStats.league.defeated.includes(id);
}
function firstUndefeatedOpponent() {
  return LEAGUE_OPPONENTS.find(opponent => !isOpponentDefeated(opponent.id)) || LEAGUE_OPPONENTS[LEAGUE_OPPONENTS.length - 1];
}
function currentLeague() {
  const next = firstUndefeatedOpponent();
  return leagueById(next && next.leagueId ? next.leagueId : careStats.league.current);
}
function currentLeagueOpponent() {
  const league = currentLeague();
  return LEAGUE_OPPONENTS.find(opponent => opponent.leagueId === league.id && !isOpponentDefeated(opponent.id))
    || opponentById(league.opponents[league.opponents.length - 1].id);
}
function defeatedOpponentsForRematch() {
  return LEAGUE_OPPONENTS.filter(opponent => isOpponentDefeated(opponent.id));
}
function rivalMemoryLine(opponent) {
  return `${opponent.name}${subjectParticle(opponent.name)} 인정해준 날`;
}
function subjectParticle(text) {
  const code = text.charCodeAt(text.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0 ? '이' : '가';
}
function markLeagueCurrentFromProgress() {
  const next = firstUndefeatedOpponent();
  careStats.league.current = next && next.leagueId ? next.leagueId : LEAGUES[LEAGUES.length - 1].id;
}
function migrateAdoptedAt(saved) {
  const candidates = [
    Number(saved.lastCareAt),
    Number(saved.lastMealAt),
    Number(saved.lastNapAt),
    Number(saved.lastPetAt),
    Number(saved.lastRoutineAt),
    Number(saved.lastPlayAt),
    Number(saved.lastBattleAt),
  ];
  if (Array.isArray(saved.memoryLog)) {
    for (const entry of saved.memoryLog) {
      const at = typeof entry === 'string' ? 0 : Number(entry && entry.at);
      if (Number.isFinite(at)) candidates.push(at);
    }
  }
  const oldest = candidates.filter(value => Number.isFinite(value) && value > 0).sort((a, b) => a - b)[0];
  return oldest || nowTime();
}
function togetherDays() {
  const adoptedDay = dayStamp(careStats.adoptedAt || nowTime());
  return Math.max(1, dayStamp(nowTime()) - adoptedDay + 1);
}
function anniversaryIndex(day) {
  return ANNIVERSARY_DAYS.indexOf(day);
}
function hasCelebratedAnniversary(index) {
  return Boolean(careStats.anniversaryMask & (1 << index));
}
function markAnniversaryCelebrated(index) {
  careStats.anniversaryMask |= 1 << index;
}
function celebrateAnniversary(day, index) {
  markAnniversaryCelebrated(index);
  pet.caption = `같이 산 지 ${day}일`;
  pet.captionT = 0;
  rememberCare(`함께 ${day}일째 되는 날`);
  pet.happy = 1;
  for (let i = 0; i < 6; i++) spawn('heart', pet.x + rand(-28, 28), pet.y - pet.r * depthScale() * rand(1.0, 1.8));
}
function startNightSleepAfterReturn() {
  if (isEggStage() || !isNightPeriod()) return false;
  pet.behavior = 'sleep';
  pet.behaviorT = rand(BEHAVIORS.sleep.dur[0], BEHAVIORS.sleep.dur[1]) * 1.5;
  pet.zTimer = 0.2;
  return true;
}
function startHomecoming() {
  if (isEggStage() || awayFromHome() || travel || battle) return false;
  if (typeof input !== 'undefined' && input.mode === 'drag') return false;
  homecoming.active = true;
  homecoming.arrived = false;
  pet.behavior = 'zoomies';
  pet.behaviorT = 5;
  pet.target.x = W * 0.5;
  pet.target.y = H * 0.78;
  pet.caption = '왔다!!';
  pet.captionT = 0;
  return true;
}
function homecomingTarget() {
  if (!homecoming.active || homecoming.arrived) return null;
  if (typeof input !== 'undefined' && input.mode === 'drag') return null;
  return { x: W * 0.5, y: H * 0.78 };
}
function completeHomecoming() {
  if (!homecoming.active) return;
  homecoming.arrived = true;
  homecoming.active = false;
  pet.behavior = 'wiggle';
  pet.behaviorT = rand(BEHAVIORS.wiggle.dur[0], BEHAVIORS.wiggle.dur[1]);
  pet.caption = '왔다!!';
  pet.captionT = 0;
  pet.happy = Math.max(pet.happy, 0.85);
}
function handleReturnEvents(away) {
  const today = dayStamp(nowTime());
  const firstDailyLogin = careStats.lastDailyLoginDay !== today;
  let didAnniversary = false;
  const sleptAtNight = away > 60 && startNightSleepAfterReturn();
  if (away > 60 && !sleptAtNight) {
    pet.caption = careStats.grime > 0.55 ? '먼지 좀 붙음' : '기다렸어…';
    pet.captionT = 0;
  }
  if (firstDailyLogin) {
    careStats.lastDailyLoginDay = today;
    pet.caption = DAILY_GREETING_CAPTIONS[dayPeriod()] || DAILY_GREETING_CAPTIONS.day;
    pet.captionT = 0;
    const day = togetherDays();
    const index = anniversaryIndex(day);
    if (index >= 0 && !hasCelebratedAnniversary(index)) {
      celebrateAnniversary(day, index);
      didAnniversary = true;
    }
  }
  if (away > 60 && needs.bond >= 0.4 && !sleptAtNight && !didAnniversary) startHomecoming();
  if (firstDailyLogin || homecoming.active || sleptAtNight) saveCareState();
}
function isEggStage() { return currentStage() === 'egg'; }
function isBabyStage() { return currentStage() === 'baby'; }
function canPlayBallNow() { return currentStage() === 'adult'; }
function currentPlace() { return place; }
function isTraveling() { return Boolean(travel); }
function travelState() { return travel ? { ...travel } : null; }
function awayFromHome() { return place !== 'home'; }
function dayStamp(time) {
  const date = new Date(time);
  return Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 86400000);
}
function addStat(name, amount) {
  if (!STAT_KEYS.includes(name)) return;
  careStats.stats[name] = clamp(careStats.stats[name] + amount, 0, 5);
}
function addBattleStats(amount) {
  addStat('tough', amount);
  addStat('power', amount);
}
function hasFurniture(id) {
  return careStats.furnitureOwned.includes(id) && !careStats.furnitureStored.includes(id);
}
function ownsFurniture(id) {
  return careStats.furnitureOwned.includes(id);
}
function isFurnitureStored(id) {
  return careStats.furnitureStored.includes(id);
}
function ensureFurniturePlacement(id) {
  if (!furnitureItemById(id)) return;
  careStats.furniturePlaced[id] = normalizeFurnitureRatio(id, careStats.furniturePlaced[id]);
}
function setFurniturePlacement(id, x, y) {
  if (!hasFurniture(id)) return false;
  const point = constrainedFurniturePoint(id, x, y);
  careStats.furniturePlaced[id] = furnitureRatioFromPoint(id, point.x, point.y);
  return true;
}
function finishFurniturePlacement(id, x, y) {
  if (!setFurniturePlacement(id, x, y)) return false;
  const anchor = furnitureAnchor(id);
  furnitureMotion.heldId = '';
  furnitureMotion.settleId = id;
  furnitureMotion.settleT = furnitureMotion.settleDur;
  pet.squashVel = clamp(pet.squashVel - 0.6, -8, 8);
  for (let i = 0; i < 5; i++) spawn('dust', anchor.x + rand(-18, 18), anchor.y + rand(-5, 7));
  saveCareState();
  return true;
}
function restoreFurniture(id) {
  if (!ownsFurniture(id)) return false;
  careStats.furnitureStored = careStats.furnitureStored.filter(storedId => storedId !== id);
  ensureFurniturePlacement(id);
  pet.caption = '다시 꺼냈다';
  pet.captionT = 0;
  saveCareState();
  return true;
}
function storeFurniture(id) {
  if (!ownsFurniture(id) || isFurnitureStored(id)) return false;
  careStats.furnitureStored.push(id);
  furnitureMotion.heldId = '';
  furnitureMotion.settleId = '';
  furnitureMotion.settleT = 0;
  if (furnitureState.moveTargetId === id) furnitureState.moveTargetId = '';
  pet.caption = '잠깐 치움';
  pet.captionT = 0;
  for (let i = 0; i < 4; i++) spawn('dust', pet.x + rand(-16, 16), pet.y + rand(-5, 7));
  saveCareState();
  return true;
}
function furnitureUsePoint(id) {
  const anchor = furnitureAnchor(id);
  if (id === 'window') return { x: clamp(anchor.x - 42, 90, W - 90), y: H * 0.48 };
  if (id === 'wheel') {
    const wheelR = furniturePrimarySize('wheel', anchor.y);
    return {
      x: anchor.x,
      y: clamp(anchor.y - wheelR * 0.55 + stagedRadius() * 0.92, H * 0.4, H * 0.83),
    };
  }
  return anchor;
}
function buyFurniture(id) {
  const item = furnitureItemById(id);
  if (!item) return false;
  if (isFurnitureStored(id)) return restoreFurniture(id);
  if (ownsFurniture(id) || careStats.pebbles < item.price) return false;
  careStats.pebbles -= item.price;
  careStats.furnitureOwned.push(id);
  ensureFurniturePlacement(id);
  pet.caption = `${item.name} 여기 좋아`;
  pet.captionT = 0;
  pet.happy = Math.max(pet.happy, 0.5);
  saveCareState();
  return true;
}
function resetWheelState() {
  furnitureState.wheelRunT = 0;
  furnitureState.wheelRewarded = false;
  furnitureState.wheelCheered = false;
}
function setFurnitureBehaviorTarget(name) {
  furnitureState.moveTargetId = '';
  if (place !== 'home' || travel || battle) return;
  if (name === 'sleep' && hasFurniture('cushion')) {
    furnitureState.moveTargetId = 'cushion';
    const target = furnitureUsePoint('cushion');
    pet.target.x = target.x;
    pet.target.y = target.y;
    pet.caption = randomLine(CUSHION_SLEEP_CAPTIONS);
    return;
  }
  if (name === 'sniff' && hasFurniture('plant') && Math.random() < 0.65) {
    furnitureState.moveTargetId = 'plant';
    const target = furnitureUsePoint('plant');
    pet.target.x = target.x;
    pet.target.y = target.y;
    return;
  }
  if (name === 'stare' && hasFurniture('window') && Math.random() < 0.45) {
    furnitureState.moveTargetId = 'window';
    const target = furnitureUsePoint('window');
    pet.target.x = target.x;
    pet.target.y = target.y;
    pet.dir = furnitureAnchor('window').x > pet.x ? 1 : -1;
  }
  if (name === 'wheel' && hasFurniture('wheel')) {
    resetWheelState();
    furnitureState.moveTargetId = 'wheel';
    const target = furnitureUsePoint('wheel');
    pet.target.x = target.x;
    pet.target.y = target.y;
  }
}
function furnitureMoveTarget() {
  if (!furnitureState.moveTargetId || place !== 'home' || travel || battle || input.mode === 'drag' || input.mode === 'furniture-drag') return null;
  if (pet.behavior === 'sleep' && furnitureState.moveTargetId === 'cushion') return furnitureUsePoint('cushion');
  if (pet.behavior === 'stare' && furnitureState.moveTargetId === 'window') return furnitureUsePoint('window');
  if (pet.behavior === 'wheel' && furnitureState.moveTargetId === 'wheel') return furnitureUsePoint('wheel');
  if (pet.behavior === 'sniff' && furnitureState.moveTargetId === 'plant') return furnitureUsePoint('plant');
  return null;
}
function isUsingCushion() {
  return pet.behavior === 'sleep' && hasFurniture('cushion') && dist(pet.x, pet.y, furnitureUsePoint('cushion').x, furnitureUsePoint('cushion').y) < 42;
}
function recordWheelSession(fell) {
  if (furnitureState.wheelRewarded || furnitureState.wheelRunT < 2) return;
  furnitureState.wheelRewarded = true;
  addStat('quick', 0.04);
  affectNeed('energy', furnitureState.wheelCheered ? -0.06 : -0.05);
  pet.caption = fell ? randomLine(WHEEL_FALL_CAPTIONS) : randomLine(WHEEL_RUN_CAPTIONS);
  pet.captionT = 0;
  if (!fell) pet.happy = Math.max(pet.happy, 0.55);
}
function cheerWheelAt(x, y) {
  if (place !== 'home' || pet.behavior !== 'wheel' || !hasFurniture('wheel')) return false;
  const anchor = furnitureAnchor('wheel');
  const s = depthScaleAt(anchor.y);
  if (dist(x, y, anchor.x, anchor.y - 28 * s) > 54 * s) return false;
  furnitureState.wheelCheered = true;
  pet.happy = Math.max(pet.happy, 0.8);
  affectNeed('bond', 0.006);
  for (let i = 0; i < 3; i++) spawn('heart', anchor.x + rand(-18, 18), anchor.y - 52 * s + rand(-8, 8));
    pet.caption = '구경 중';
  pet.captionT = 0;
  return true;
}
function updateFurnitureUse(dt) {
  if (pet.behavior !== 'wheel') {
    recordWheelSession(false);
    furnitureState.wheelRunT = 0;
    return;
  }
  if (place !== 'home' || !hasFurniture('wheel') || needs.energy < 0.18) {
    pet.behavior = 'stare';
    pet.behaviorT = 1.5;
    pet.caption = '다리 쉬자';
    pet.captionT = 0;
    return;
  }
  const target = furnitureUsePoint('wheel');
  if (dist(pet.x, pet.y, target.x, target.y) > 26) return;
  furnitureState.wheelRunT += dt;
  furnitureState.wheelSpin += dt * (7.2 + furnitureState.wheelRunT * 0.55);
  pet.walkPhase += dt * 28;
  pet.squashVel = clamp(pet.squashVel + Math.sin(pet.wobblePhase * 8) * 0.08, -10, 10);
  affectNeed('energy', -dt * 0.006);
  if (!furnitureState.wheelRewarded && furnitureState.wheelRunT > 2.6 && Math.random() < dt * 0.08) {
    recordWheelSession(true);
    pet.tripT = 0.95;
    pet.squashVel = clamp(pet.squashVel - 5.5, -12, 12);
    pet.behavior = 'stare';
    pet.behaviorT = 2;
    for (let i = 0; i < 6; i++) spawn('dust', pet.x + rand(-22, 22), pet.y + rand(-6, 8));
  } else if (pet.behaviorT < 0.25) {
    recordWheelSession(false);
  }
}
function grantPebbles(count, captions) {
  careStats.pebbles = Math.max(0, careStats.pebbles + count);
  pet.caption = randomLine(captions);
  pet.captionT = 0;
  pet.happy = Math.max(pet.happy, 0.62);
  for (let i = 0; i < Math.min(6, count + 2); i++) spawn('spark', pet.x + rand(-22, 22), pet.y - pet.r * depthScale() * rand(0.7, 1.45));
  saveCareState();
  return count;
}
function clearPlaceObjects() {
  food = null;
  ball = null;
}
function beginWalkVisit() {
  walkVisit.active = true;
  walkVisit.discoveries = 0;
  walkVisit.maxDiscoveries = Math.random() < 0.65 ? 2 : 3;
  walkVisit.nextDiscoveryAt = rand(1.2, 2.6);
  walkVisit.targetSpot = Math.floor(Math.random() * placeWorld.walk.sniffSpots.length);
  walkVisit.sniffing = false;
  walkVisit.sniffT = 0;
  walkReturnT = 0;
  butterfly.active = false;
  butterfly.noseT = 0;
  butterfly.chaseT = 0;
  butterfly.cooldown = rand(4.5, 8.5);
}
function endWalkVisit() {
  walkVisit.active = false;
  walkVisit.sniffing = false;
  walkReturnT = 0;
  butterfly.active = false;
  butterfly.noseT = 0;
  butterfly.chaseT = 0;
}
function travelArrivalPoint(to) {
  if (to === 'battle') return { x: W * 0.46, y: H * 0.66 };
  if (to === 'walk') return { x: W * 0.52, y: H * 0.65 };
  return { x: W * 0.5, y: H * 0.62 };
}
function startTravel(to, options = {}) {
  if (travel) {
    pet.caption = '이미 가는 중';
    pet.captionT = 0;
    return false;
  }
  if (battleDefeatReturn) {
    pet.caption = '굴러가는 중';
    pet.captionT = 0;
    return false;
  }
  if (isEggStage()) {
    nudgeEgg('아직 세상 구경 전');
    return false;
  }
  if (input.mode === 'drag') {
    pet.caption = '손에 있어';
    pet.captionT = 0;
    return false;
  }
  if (battle && to !== 'home') {
    pet.caption = '지금 싸우는 중';
    pet.captionT = 0;
    return false;
  }
  const exitSide = pet.x < W / 2 ? -1 : 1;
  const targetY = clamp(pet.y + rand(-24, 24), H * 0.5, H * 0.78);
  if (to !== 'walk') endWalkVisit();
	  travel = {
	    to,
	    from: place,
	    phase: 'leaving',
    exitSide,
    y: targetY,
    t: 0,
    startBattle: Boolean(options.startBattle),
    opponentId: typeof options.opponentId === 'string' ? options.opponentId : '',
  };
  clearPlaceObjects();
  battleReturnT = 0;
  walkReturnT = 0;
  pet.behavior = 'travel';
  pet.behaviorT = 60;
  pet.target.x = exitSide < 0 ? -70 : W + 70;
  pet.target.y = targetY;
  pet.caption = to === 'battle' ? randomLine(TRAVEL_BATTLE_LINES) : to === 'walk' ? randomLine(TRAVEL_WALK_LINES) : '집에 가자';
  pet.captionT = 0;
  return true;
}
function travelTarget() {
  if (!travel) return null;
  if (travel.phase === 'leaving') {
    return { x: travel.exitSide < 0 ? -70 : W + 70, y: travel.y };
  }
  return travelArrivalPoint(travel.to);
}
function completeTravelStep() {
  if (!travel) return;
  if (travel.phase === 'leaving') {
    place = travel.to;
    travel.phase = 'arriving';
    travel.t = 0;
    const entrySide = -travel.exitSide;
    pet.x = entrySide < 0 ? -70 : W + 70;
    const arrival = travelArrivalPoint(travel.to);
    pet.y = arrival.y;
    pet.vx = 0;
    pet.vy = 0;
    pet.target.x = arrival.x;
    pet.target.y = arrival.y;
    pet.caption = travel.to === 'battle' ? '여기구나' : travel.to === 'walk' ? '밖이다' : '집 보인다';
    pet.captionT = 0;
    return;
  }
	  const destination = travel.to;
	  const origin = travel.from;
	  const shouldStartBattle = travel.startBattle;
	  const opponentId = travel.opponentId;
	  travel = null;
  if (destination === 'walk') {
    beginWalkVisit();
    rememberCare('밖 냄새 맡은 날');
    affectNeed('energy', -0.025);
    affectNeed('bond', 0.012);
    careStats.grime = clamp(careStats.grime + 0.018, 0, 1);
    pet.caption = randomLine(WALK_ARRIVE_LINES);
    pet.captionT = 0;
    pet.happy = Math.max(pet.happy, 0.58);
    for (let i = 0; i < 3; i++) spawn('dust', pet.x + rand(-24, 24), pet.y + rand(-8, 8));
    pet.behavior = 'sniff';
    pet.behaviorT = rand(BEHAVIORS.sniff.dur[0], BEHAVIORS.sniff.dur[1]);
  } else if (destination === 'battle' && shouldStartBattle) {
    startBattleHere(opponentId);
	  } else {
	    let rankedUp = false;
	    if (destination === 'home' && origin === 'walk') {
	      addStat('tough', 0.02);
	      rankedUp = grantKinship('walk', 1, 3);
	    }
	    if (!rankedUp) pet.caption = randomLine(RETURN_HOME_LINES);
    pet.captionT = 0;
    pet.behavior = 'stare';
    pet.behaviorT = rand(BEHAVIORS.stare.dur[0], BEHAVIORS.stare.dur[1]);
  }
}
function updateTravel(dt) {
  if (!travel) return;
  travel.t += dt;
  if (travel.t > 5) completeTravelStep();
}
function updateBattleReturn(dt) {
  if (battleReturnT <= 0) return;
  if (battle || travel || battleDefeatReturn || place !== 'battle') {
    battleReturnT = 0;
    return;
  }
  if (input.mode === 'drag') return;
  battleReturnT = Math.max(0, battleReturnT - dt);
  if (battleReturnT <= 0) startTravel('home');
}
function battleDefeatReturnTarget() {
  if (!battleDefeatReturn) return null;
  if (battleDefeatReturn.phase === 'rollingOut') {
    return {
      x: battleDefeatReturn.exitSide < 0 ? -90 : W + 90,
      y: battleDefeatReturn.y,
    };
  }
  return { x: W * 0.5, y: H * 0.66 };
}
function battleDefeatReturnSpeed() {
  return BATTLE_DEFEAT_RETURN_SPEED * stageScale('speed');
}
function isBattleDefeatReturning() {
  return Boolean(battleDefeatReturn);
}
function completeBattleDefeatReturnStep() {
  if (!battleDefeatReturn) return;
  if (battleDefeatReturn.phase === 'rollingOut') {
    const entrySide = -battleDefeatReturn.exitSide;
    place = 'home';
    clearPlaceObjects();
    battleDefeatReturn.phase = 'rollingIn';
    battleDefeatReturn.t = 0;
    battleDefeatReturn.y = H * 0.66;
    pet.x = entrySide < 0 ? -70 : W + 70;
    pet.y = battleDefeatReturn.y;
    pet.vx = 0;
    pet.vy = 0;
    pet.target.x = W * 0.5;
    pet.target.y = battleDefeatReturn.y;
    pet.caption = '데굴데굴 귀가';
    pet.captionT = 0;
    return;
  }
  battleDefeatReturn = null;
  pet.defeatT = Math.max(pet.defeatT || 0, 1.4);
  pet.rollSpin = 0;
  pet.behavior = 'sleep';
  pet.behaviorT = 4.8;
  pet.caption = '집 바닥 좋아';
  pet.captionT = 0;
}
function updateBattleResult(dt) {
  if (battleResult) {
    battleResult.t = Math.max(0, battleResult.t - dt);
    if (battleResult.t <= 0) battleResult = null;
  }
  if (battleDefeatReturn) battleDefeatReturn.t += dt;
  if (pet.defeatT > 0) pet.defeatT = Math.max(0, pet.defeatT - dt);
}
function fetchSkillLevel() {
  return clamp(careStats.stats.quick / 5, 0, 1);
}
function fetchChaseSpeed(baseSpeed) {
  return baseSpeed * (1 + fetchSkillLevel() * 0.32);
}
function fetchTripMultiplier() {
  return 1 - fetchSkillLevel() * 0.55;
}
function battleFocusChance() {
  return battleCoreFocusChance(playerBattleCoreSide());
}
function battlePower() {
  return battleCorePower(playerBattleCoreSide());
}
function playerBattleCoreSide() {
  const kinshipBoost = kinshipRankIndex() * 0.025;
  return {
    seed: genes.seed,
    personality: hasCareTrait('mellow') ? '침착' : needs.bond < 0.22 ? '겁쟁이' : '저돌',
    powerCoeff: 0,
    stats: careStats.stats,
    condition: { hunger: needs.hunger, energy: needs.energy, bond: clamp(needs.bond + kinshipBoost, 0, 1) },
    traits: careTraitNames(),
  };
}
function opponentBattleCoreSide(opponent) {
  return {
    seed: opponent.seed,
    personality: opponent.personality,
    powerCoeff: opponent.powerCoeff,
    stats: { tough: 0, quick: 0, power: 0 },
    condition: { hunger: 0.65, energy: 0.58, bond: 0 },
    traits: [],
  };
}
function grantWalkDiscoveryShinyPebble() {
  const today = dayStamp(nowTime());
  const firstToday = careStats.lastWalkPebbleDay !== today;
  const count = firstToday ? 2 + ((today + genes.seed) % 2) : 1;
  careStats.lastWalkPebbleDay = today;
  return grantPebbles(count, SHINY_PEBBLE_CAPTIONS);
}
function walkSniffSpot() {
  const spots = placeWorld.walk.sniffSpots;
  return spots[walkVisit.targetSpot % spots.length];
}
function completeWalkDiscovery() {
  walkVisit.discoveries += 1;
  walkVisit.sniffing = false;
  walkVisit.sniffT = 0;
  walkVisit.targetSpot = (walkVisit.targetSpot + 1 + Math.floor(Math.random() * 2)) % placeWorld.walk.sniffSpots.length;
  walkVisit.nextDiscoveryAt = rand(3.2, 6.2);
  rememberCare(randomLine(WALK_DISCOVERY_LINES));
  pet.caption = randomLine(WALK_DISCOVERY_CAPTIONS);
  pet.captionT = 0;
  pet.happy = Math.max(pet.happy, 0.55);
  pet.behaviorT = Math.max(pet.behaviorT, 1.4);
  for (let i = 0; i < 3; i++) spawn('dust', pet.x + rand(-14, 14), pet.y + rand(-4, 8));
  grantWalkDiscoveryShinyPebble();
  if (walkVisit.discoveries >= walkVisit.maxDiscoveries) {
    walkReturnT = 2.2;
    if (pet.captionT > 0.2) {
      pet.caption = randomLine(WALK_DONE_LINES);
      pet.captionT = 0;
    }
  }
}
function updateWalkDiscovery(dt) {
  if (!walkVisit.active || walkVisit.discoveries >= walkVisit.maxDiscoveries) return;
  if (input.mode === 'drag' || battle || travel || food || ball || pet.behavior === 'sleep' || pet.behavior === 'butterfly') return;
  walkVisit.nextDiscoveryAt -= dt;
  if (!walkVisit.sniffing && walkVisit.nextDiscoveryAt <= 0) {
    const spot = walkSniffSpot();
    walkVisit.sniffing = true;
    walkVisit.sniffT = 0;
    pet.target.x = spot.x * W;
    pet.target.y = spot.y * H;
    setBehavior('sniff');
    pet.caption = '킁킁';
    pet.captionT = 0;
  }
  if (!walkVisit.sniffing) return;
  walkVisit.sniffT += dt;
  const spot = walkSniffSpot();
  const sx = spot.x * W;
  const sy = spot.y * H;
  pet.target.x = sx;
  pet.target.y = sy;
  if (dist(pet.x, pet.y, sx, sy) < 34 || walkVisit.sniffT > 5.2) completeWalkDiscovery();
}
function updateWalkReturn(dt) {
  if (walkReturnT <= 0) return;
  if (travel || battle || place !== 'walk') {
    walkReturnT = 0;
    return;
  }
  if (input.mode === 'drag') return;
  walkReturnT = Math.max(0, walkReturnT - dt);
  if (walkReturnT <= 0) startTravel('home');
}
function updateButterflyPosition() {
  const spec = placeWorld.walk.butterfly;
  const phase = spec.phase + butterfly.t * 1.55;
  const loopX = Math.sin(phase) * spec.rx * W;
  const loopY = Math.sin(phase * 2) * spec.ry * H;
  butterfly.x = spec.x * W + loopX;
  butterfly.y = spec.y * H + loopY;
  if (pet.behavior !== 'butterfly') return;
  const dx = butterfly.x - pet.x;
  const dy = butterfly.y - pet.y;
  const d = Math.hypot(dx, dy) || 1;
  const evade = 24 + butterfly.chaseT * 18;
  butterfly.x = clamp(butterfly.x + dx / d * evade, 36, W - 36);
  butterfly.y = clamp(butterfly.y + dy / d * evade - butterfly.chaseT * 5, H * 0.34, H * 0.72);
}
function startButterflyChase() {
  butterfly.chaseT = 0;
  setBehavior('butterfly');
  pet.caption = randomLine(BUTTERFLY_START_LINES);
  pet.captionT = 0;
  pet.happy = Math.max(pet.happy, 0.62);
}
function missButterfly(onNose) {
  if (!butterfly.active) return;
  butterfly.chaseT = 0;
  if (onNose) {
    butterfly.noseT = 1.35;
    pet.caption = randomLine(BUTTERFLY_NOSE_LINES);
    pet.squashVel = clamp(pet.squashVel - 1.2, -8, 8);
  } else {
    butterfly.active = false;
    butterfly.cooldown = rand(10, 18);
    pet.caption = randomLine(BUTTERFLY_MISS_LINES);
  }
  pet.captionT = 0;
  pet.behavior = 'stare';
  pet.behaviorT = Math.max(pet.behaviorT, 1.6);
}
function updateButterfly(dt) {
  if (!walkVisit.active) return;
  if (butterfly.noseT > 0) {
    butterfly.noseT = Math.max(0, butterfly.noseT - dt);
    butterfly.x = pet.x + pet.dir * stagedRadius() * 0.42;
    butterfly.y = pet.y + pet.jy - stagedRadius() * 0.8;
    if (butterfly.noseT <= 0) {
      butterfly.active = false;
      butterfly.cooldown = rand(12, 20);
    }
    return;
  }
  if (!butterfly.active) {
    butterfly.cooldown -= dt;
    if (butterfly.cooldown <= 0 && !food && !ball && !battle && !travel && input.mode !== 'drag') {
      butterfly.active = true;
      butterfly.t = 0;
      butterfly.chaseT = 0;
      updateButterflyPosition();
    }
    return;
  }
  butterfly.t += dt;
  updateButterflyPosition();
  const d = dist(pet.x, pet.y, butterfly.x, butterfly.y);
  if (pet.behavior === 'butterfly') {
    butterfly.chaseT += dt;
    if (d < 32 || butterfly.chaseT > 4.2) missButterfly(Math.random() < 0.22);
    return;
  }
  if (input.mode !== 'drag' && pet.behavior !== 'sleep' && d < 150 && pet.captionT > 0.7) startButterflyChase();
}
function updateWalkPlace(dt) {
  if (place !== 'walk' || travel || isEggStage()) {
    if (walkVisit.active && place !== 'walk') endWalkVisit();
    return;
  }
  updateButterfly(dt);
  updateWalkDiscovery(dt);
}
function requestAiLine(event, fallback) {
  if (typeof fetch !== 'function') return;
  if (nowTime() < nextAiLineAt) return;
  nextAiLineAt = nowTime() + AI_LINE_COOLDOWN;
  fetch('/api/pet-line', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      event,
      mood: careMood(),
      stage: currentStage(),
      needs: { hunger: needs.hunger, energy: needs.energy, bond: needs.bond },
      traits: careTraitNames(),
      memory: careStats.lastCareLine,
    }),
  })
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      if (!data || typeof data.line !== 'string') return;
      const line = data.line.trim();
      if (!line || pet.captionT < 0.8) return;
      pet.caption = line;
      pet.captionT = 0;
      if (fallback) rememberCare(line);
    })
    .catch(() => {});
}
function nudgeEgg(line) {
  pet.eggShakeT = Math.max(pet.eggShakeT, 0.7);
  pet.squashVel = clamp(pet.squashVel - 1.2, -8, 8);
  pet.caption = line || randomLine(EGG_LINES);
  pet.captionT = 0;
}
function warmEgg(amount) {
  if (!isEggStage() || isStagePreview()) return;
  careStats.hatchWarmth = clamp(careStats.hatchWarmth + amount * 0.0012, 0, 1);
  pet.eggShakeT = Math.max(pet.eggShakeT, 0.36);
  if (careStats.hatchWarmth > 0.32 && pet.captionT > 1.2) {
    pet.caption = randomLine(HATCH_WARM_LINES);
    pet.captionT = 0;
  }
}
function transitionStage(stage) {
  if (!validStage(stage) || isStagePreview()) return false;
  const from = careStats.stage;
  if (from === stage) return false;
  careStats.stage = stage;
  careStats.stageChangedAt = nowTime();
  careStats.hatchWarmth = stage === 'egg' ? 0 : 1;
  pet.stageTween = from !== 'egg' && stage !== 'egg' ? { from, to: stage, t: 0, dur: 1.5 } : null;
  return true;
}
function tryHatchEgg() {
  if (!isEggStage() || isStagePreview()) return false;
  if (careStats.hatchWarmth < 1 || stageAgeSeconds() < eggHatchSeconds()) return false;
  if (!transitionStage('baby')) return false;
  rememberCare('알에서 나온 날');
  pet.caption = '너 누구야?';
  pet.captionT = 0;
  pet.hatchFxT = 1.2;
  pet.happy = Math.max(pet.happy, 0.72);
  pet.jy = 0;
  pet.jvy = 0;
  for (let i = 0; i < 6; i++) spawn('dust', pet.x + rand(-20, 20), pet.y + rand(-10, 8));
  for (let i = 0; i < 3; i++) spawn('heart', pet.x + rand(-22, 22), pet.y - pet.r * depthScale() * rand(0.9, 1.5));
  return true;
}
function canGrowAdult() {
  return isBabyStage() && !isStagePreview() && stageAgeSeconds() >= adultGrowthSeconds() && adultConditionCount() >= 2;
}
function tryGrowAdultOnSleep() {
  if (!canGrowAdult() || !transitionStage('adult')) return false;
  rememberCare('어른이 된 날');
  pet.caption = '나 좀 컸어';
  pet.captionT = 0;
  pet.happy = 1;
  for (let i = 0; i < 5; i++) spawn('heart', pet.x + rand(-24, 24), pet.y - pet.r * depthScale() * rand(1.0, 1.7));
  for (let i = 0; i < 5; i++) spawn('dust', pet.x + rand(-26, 26), pet.y + rand(-6, 8));
  return true;
}
function growAdultForDebug() {
  if (isStagePreview()) {
    pet.caption = '미리보기 중';
    pet.captionT = 0;
    return false;
  }
  if (currentStage() === 'adult') {
    pet.caption = '이미 다 컸어';
    pet.captionT = 0;
    return false;
  }
  const from = currentStage();
  careStats.hatchWarmth = 1;
  if (!transitionStage('adult')) return false;
  rememberCare('테스트로 어른 된 날');
  needs.hunger = Math.max(needs.hunger, 0.72);
  needs.energy = Math.max(needs.energy, 0.82);
  needs.bond = Math.max(needs.bond, 0.18);
  pet.caption = from === 'egg' ? '갑자기 컸어' : '나 좀 커졌어';
  pet.captionT = 0;
  pet.happy = 1;
  pet.hatchFxT = Math.max(pet.hatchFxT || 0, from === 'egg' ? 0.7 : 0);
  pet.jy = 0;
  pet.jvy = 0;
  for (let i = 0; i < 7; i++) spawn('heart', pet.x + rand(-26, 26), pet.y - pet.r * depthScale() * rand(0.9, 1.8));
  for (let i = 0; i < 7; i++) spawn('dust', pet.x + rand(-28, 28), pet.y + rand(-8, 10));
  saveCareState();
  return true;
}
function recordRoughPlay(amount) {
  roughPlayState.roughness = clamp(roughPlayState.roughness + amount, 0, 1);
  if (roughPlayState.roughness <= ROUGHNESS_PENALTY_THRESHOLD) return false;

  const closeEnough = needs.bond >= ROUGHNESS_CLOSE_BOND;
  affectNeed('bond', closeEnough ? ROUGHNESS_CLOSE_BOND_PENALTY : ROUGHNESS_BOND_PENALTY);
  roughPlayState.penaltyCount += 1;
  if (roughPlayState.penaltyCount >= 3 && !roughPlayState.flightMemoryRecorded) {
    roughPlayState.flightMemoryRecorded = true;
    rememberCare('오늘 너무 많이 날아다님');
  }
  pet.caption = closeEnough && Math.random() < 0.5 ? randomLine(ROUGH_FUN_LINES) : randomLine(ROUGH_HURT_LINES);
  pet.captionT = 0;
  return true;
}
function pickBallTarget() {
  let target = { x: W / 2, y: H * 0.64 };
  for (let i = 0; i < 18; i++) {
    target = { x: rand(90, W - 90), y: rand(H * 0.45, H * 0.82) };
    if (dist(target.x, target.y, pet.x, pet.y) >= 120) break;
  }
  return target;
}
function launchBall() {
  const start = ownerPlayPoint(0.9);
  const target = pickBallTarget();
  const flightT = rand(0.82, 1.04);
  ball = {
    x: start.x,
    y: start.y,
    vx: (target.x - start.x) / flightT,
    vy: (target.y - start.y) / flightT,
    jy: 0,
    jvy: -450 * flightT,
    bounces: 0,
    maxBounces: Math.random() < 0.5 ? 2 : 3,
    rebound: 0.55,
    age: 0,
    phase: 'flying',
    fetchState: 'waiting',
    fetchStarted: false,
    fetchSpeed: 220,
    fadeT: 0,
  };
}
function requestPlayBall() {
  if (awayFromHome() || travel) {
    pet.caption = awayFromHome() ? '공은 집에 있어' : '도착하면 하자';
    pet.captionT = 0;
    return;
  }
  if (battle) {
    pet.caption = '지금 바빠';
    pet.captionT = 0;
    return;
  }
  if (!canPlayBallNow()) {
    if (isEggStage()) nudgeEgg('아직 세상 구경 전');
    else {
      pet.caption = '공은 아직 어려워';
      pet.captionT = 0;
      pet.squashVel = clamp(pet.squashVel - 1.4, -8, 8);
    }
    return;
  }
  if (ball) {
    pet.caption = '공 여기 있다';
    pet.captionT = 0;
    return;
  }
  launchBall();
  pet.caption = randomLine(FETCH_START_LINES);
  pet.captionT = 0;
}
function startFetchBall() {
  if (!canPlayBallNow()) return false;
  if (!ball || food || ball.abandoned || ball.fetchState === 'return') return false;
  if (needs.energy < 0.25) {
    ball.declined = true;
    pet.caption = randomLine(FETCH_REFUSE_LINES);
    pet.captionT = 0;
    return false;
  }
  ball.fetchStarted = true;
  ball.fetchState = ball.phase === 'carried' ? 'return' : 'chase';
  ball.fetchSpeed = hasCareTrait('mellow') && Math.random() < 0.2 ? 62 : fetchChaseSpeed(220);
  setBehavior('fetch');
  if (ball.fetchSpeed === 62) pet.caption = '천천히 갈게';
  pet.captionT = 0;
  return true;
}
function tryResumeFetch() {
  if (!ball || food || ball.declined || ball.abandoned) return false;
  if (ball.phase !== 'settled' && ball.phase !== 'rolling' && ball.phase !== 'carried') return false;
  if (needs.energy < 0.25) return false;
  return startFetchBall();
}
function catchBall() {
  if (!ball) return;
  ball.phase = 'carried';
  ball.fetchState = 'return';
  ball.vx = 0;
  ball.vy = 0;
  ball.jy = 0;
  ball.jvy = 0;
  pet.caption = randomLine(FETCH_CAUGHT_LINES);
  pet.captionT = 0;
}
function abandonFetchBall() {
  if (!ball) return;
  ball.phase = 'settled';
  ball.fetchState = 'waiting';
  ball.abandoned = true;
  ball.vx = 0;
  ball.vy = 0;
  ball.jy = 0;
  ball.jvy = 0;
  pet.caption = '그만 뛸래…';
  pet.captionT = 0;
  pet.behavior = 'stare';
  pet.behaviorT = Math.max(pet.behaviorT, 1.6);
}
function dropFetchedBall() {
  if (!ball) return;
  ball.phase = 'fading';
  ball.fetchState = 'done';
  ball.fadeT = 1.5;
  ball.pendingComplete = true;
  ball.vx = 0;
  ball.vy = 0;
  ball.jy = 0;
  ball.jvy = 0;
}
function clearBallIfTimedOut() {
  if (!ball || ball.phase === 'carried' || ball.phase === 'fading') return false;
  if (ball.age < 25) return false;
  if (!ball.fetchStarted) {
    pet.caption = '공 까먹은 척';
    pet.captionT = 0;
  }
  ball = null;
  return true;
}
function recordFetchComplete() {
  const firstFetch = careStats.fetchCount === 0;
  careStats.fetchCount += 1;
	  careStats.lastPlayAt = nowTime();
	  addStat('quick', 0.025);
  affectNeed('bond', 0.02);
  affectNeed('energy', -0.03);
  if (firstFetch) rememberCare('공 물어오기 배움');
  else if (!sessionFetchRecorded) rememberCare('공 가져다줌');
  sessionFetchRecorded = true;
  const learnedFetch = careStats.fetchCount >= 3 && Math.random() < clamp(careStats.fetchCount * 0.04, 0.18, 0.42);
  pet.caption = learnedFetch ? randomLine(FETCH_SKILL_LINES) : randomLine(FETCH_DONE_LINES);
  pet.captionT = 0;
  pet.happy = Math.max(pet.happy, 0.8);
  for (let i = 0; i < 3; i++) spawn('heart', pet.x + rand(-22, 22), pet.y - pet.r * depthScale() * rand(1.0, 1.65));
  requestAiLine('fetch_done', false);
}
function requestBattle(opponentId = '') {
  if (battle) {
    cheerBattle();
    return;
  }
  if (travel) {
    pet.caption = '도착하면 하자';
    pet.captionT = 0;
    return;
  }
  if (isEggStage()) {
    nudgeEgg('아직 세상 구경 전');
    return;
  }
  if (!canPlayBallNow()) {
    pet.caption = '싸움은 아직 어려워';
    pet.captionT = 0;
    return;
  }
  if (food) {
    pet.caption = '밥부터 볼래';
    pet.captionT = 0;
    setBehavior('eat');
    return;
  }
  if (needs.energy < 0.28) {
    pet.caption = '오늘은 누울래';
    pet.captionT = 0;
    affectNeed('bond', 0.004);
    return;
  }
  const opponent = opponentById(opponentId) || currentLeagueOpponent();
  if (!opponent) return;
  if (place !== 'battle') {
    startTravel('battle', { startBattle: true, opponentId: opponent.id });
    return;
  }
  startBattleHere(opponent.id);
}
function startBattleHere(opponentId = '') {
  const opponent = opponentById(opponentId) || currentLeagueOpponent();
  if (!opponent) return;
  battleResult = null;
  battleDefeatReturn = null;
  pet.defeatT = 0;
  pet.rollSpin = 0;
  const foeX = clamp(pet.x < W / 2 ? W * 0.72 : W * 0.28, 90, W - 90);
  const entrySide = foeX > W / 2 ? 1 : -1;
  const entryX = entrySide > 0 ? W + 74 : -74;
  const plan = resolveBattleCore({
    seed: (genes.seed ^ opponent.seed ^ careStats.battleWins) | 0,
    pet: playerBattleCoreSide(),
    foe: opponentBattleCoreSide(opponent),
  });
  const defeated = isOpponentDefeated(opponent.id);
  const battleY = clamp(pet.y + rand(-50, 45), H * 0.48, H * 0.78);
  battle = {
    x: entryX,
    baseX: foeX,
    y: battleY,
    baseY: battleY,
    hp: 1,
    petHp: clamp(0.62 + needs.energy * 0.36 + needs.bond * 0.18, 0.45, 1),
    t: 0,
    hitT: 0,
    foeHitT: 0,
    cheerT: 0,
    nextAct: 0.4,
    phase: 'entering',
    entrySide,
    entryT: 0,
    opponentId: opponent.id,
    rematch: defeated,
    plan,
    roundIndex: 0,
    shape: makeBlobGenes(opponent.seed),
    physics: null,
    angle: 0,
    petImpactT: 0,
    defeatT: 0,
    haloT: 0,
    haloVisible: false,
    resultShown: false,
  };
  if (ball) ball = null;
  pet.behavior = 'battle';
  pet.behaviorT = 60;
  pet.caption = defeated && opponent.rival ? opponent.rematchLine : opponent.intro || randomLine(BATTLE_START_LINES);
  pet.captionT = 0;
  rememberCare('처음 싸움 구경한 날');
  requestAiLine('battle_start', false);
}
function matterApi() {
  return typeof globalThis !== 'undefined' && globalThis.Matter ? globalThis.Matter : null;
}
function battlePhysicsBounds() {
  return {
    left: 70,
    right: W - 70,
    top: H * 0.46,
    bottom: H * 0.82,
  };
}
function initBattlePhysics() {
  const Matter = matterApi();
  if (!battle || !Matter || !Matter.Engine || !Matter.World || !Matter.Bodies || !Matter.Body) return false;
  const { Engine, World, Bodies, Body } = Matter;
  const bounds = battlePhysicsBounds();
  const engine = Engine.create({ enableSleeping: false });
  engine.gravity.x = 0;
  engine.gravity.y = 0;
  const wall = 80;
  const petRadius = clamp(stagedRadius() * 0.68, 24, 42);
  const foeRadius = clamp(24 * depthScaleAt(battle.y), 19, 34);
  const common = {
    restitution: 0.86,
    friction: 0.08,
    frictionStatic: 0.16,
    frictionAir: 0.035,
    density: 0.004,
    slop: 0.05,
  };
  const petBody = Bodies.circle(pet.x, pet.y, petRadius, {
    ...common,
    label: 'pet',
    density: 0.0032,
  });
  const foeBody = Bodies.circle(battle.x, battle.y, foeRadius, {
    ...common,
    label: 'foe',
    density: 0.0048,
  });
  const walls = [
    Bodies.rectangle(W / 2, bounds.top - wall / 2, W, wall, { isStatic: true, restitution: 0.95 }),
    Bodies.rectangle(W / 2, bounds.bottom + wall / 2, W, wall, { isStatic: true, restitution: 0.95 }),
    Bodies.rectangle(bounds.left - wall / 2, H / 2, wall, H, { isStatic: true, restitution: 0.95 }),
    Bodies.rectangle(bounds.right + wall / 2, H / 2, wall, H, { isStatic: true, restitution: 0.95 }),
  ];
  Body.setVelocity(petBody, { x: pet.vx / 60, y: pet.vy / 60 });
  World.add(engine.world, [petBody, foeBody, ...walls]);
  battle.physics = {
    engine,
    petBody,
    foeBody,
    walls,
    bounds,
    width: W,
    height: H,
  };
  return true;
}
function ensureBattlePhysics() {
  if (!battle) return false;
  if (battle.physics && battle.physics.width === W && battle.physics.height === H) return true;
  return initBattlePhysics();
}
function steerBattleBody(body, targetX, targetY, amount) {
  const Matter = matterApi();
  if (!Matter || !body) return;
  const dx = targetX - body.position.x;
  const dy = targetY - body.position.y;
  const d = Math.hypot(dx, dy) || 1;
  const force = amount * body.mass;
  Matter.Body.applyForce(body, body.position, { x: dx / d * force, y: dy / d * force });
}
function syncBattleFromPhysics() {
  if (!battle || !battle.physics) return;
  const petBody = battle.physics.petBody;
  const foeBody = battle.physics.foeBody;
  pet.x = petBody.position.x;
  pet.y = petBody.position.y;
  pet.vx = petBody.velocity.x * 60;
  pet.vy = petBody.velocity.y * 60;
  battle.x = foeBody.position.x;
  battle.y = foeBody.position.y;
  battle.angle = foeBody.angle;
}
function updateBattlePhysics(dt) {
  const Matter = matterApi();
  if (!battle || !ensureBattlePhysics() || !Matter) return false;
  const { Engine, Body } = Matter;
  const petBody = battle.physics.petBody;
  const foeBody = battle.physics.foeBody;
  const opponent = opponentById(battle.opponentId);
  const personality = opponent ? opponent.personality : '침착';
  const directionAway = battle.baseX < W / 2 ? -1 : 1;
  const dx = foeBody.position.x - petBody.position.x;
  const dy = foeBody.position.y - petBody.position.y;
  const d = Math.hypot(dx, dy) || 1;
  const petHitStun = battle.petImpactT > 0;
  const foeHitStun = battle.hitT > 0;
  if (d > 58 && !petHitStun) {
    steerBattleBody(petBody, foeBody.position.x - dx / d * 48, foeBody.position.y - dy / d * 10, 0.00022 * stageScale('speed'));
  }
  let foeTargetX = battle.baseX + Math.sin(battle.t * 2.2) * 24;
  let foeTargetY = battle.baseY + Math.cos(battle.t * 1.9) * 12;
  if (personality === '겁쟁이') {
    foeTargetX = battle.baseX + directionAway * (42 + Math.sin(battle.t * 3.4) * 18);
    foeTargetY = battle.baseY + Math.cos(battle.t * 2.6) * 22;
  } else if (personality === '저돌') {
    foeTargetX = petBody.position.x + dx / d * 64;
    foeTargetY = petBody.position.y + dy / d * 20;
  }
  if (!foeHitStun) {
    steerBattleBody(foeBody, clamp(foeTargetX, battle.physics.bounds.left + 26, battle.physics.bounds.right - 26), clamp(foeTargetY, battle.physics.bounds.top + 26, battle.physics.bounds.bottom - 26), 0.00014);
  }
  const maxSpeed = 8.8;
  for (const body of [petBody, foeBody]) {
    const speed = Math.hypot(body.velocity.x, body.velocity.y);
    if (speed > maxSpeed) Body.setVelocity(body, { x: body.velocity.x / speed * maxSpeed, y: body.velocity.y / speed * maxSpeed });
  }
  Engine.update(battle.physics.engine, Math.min(dt * 1000, BATTLE_PHYSICS_STEP_MAX));
  syncBattleFromPhysics();
  return true;
}
function applyBattleRoundImpact(round) {
  if (!battle || !battle.physics || !round) return false;
  const Matter = matterApi();
  if (!Matter) return false;
  const { Body } = Matter;
  const petBody = battle.physics.petBody;
  const foeBody = battle.physics.foeBody;
  const petActs = round.actor === 'pet';
  const attacker = petActs ? petBody : foeBody;
  const target = petActs ? foeBody : petBody;
  const dx = target.position.x - attacker.position.x;
  const dy = target.position.y - attacker.position.y;
  const d = Math.hypot(dx, dy) || 1;
  const decisiveBoost = round.decisive ? 1.72 : 1;
  const damage = Number(round.damage) || 0.1;
  const hitImpulse = (6.4 + damage * 30) * decisiveBoost;
  const recoilImpulse = hitImpulse * (round.decisive ? 0.12 : 0.18);
  const lift = petActs ? -0.58 : -0.18;
  Body.setVelocity(target, {
    x: target.velocity.x + dx / d * hitImpulse,
    y: target.velocity.y + dy / d * hitImpulse + lift,
  });
  Body.setAngularVelocity(target, (target.angularVelocity || 0) + (petActs ? 0.34 : -0.28) * (dx >= 0 ? 1 : -1) * decisiveBoost);
  Body.setVelocity(attacker, {
    x: attacker.velocity.x - dx / d * recoilImpulse,
    y: attacker.velocity.y - dy / d * recoilImpulse * 0.65,
  });
  Body.setAngularVelocity(attacker, (attacker.angularVelocity || 0) - (petActs ? 0.05 : -0.05) * (dx >= 0 ? 1 : -1));
  syncBattleFromPhysics();
  return true;
}
function requestWalk() {
  if (isEggStage()) {
    nudgeEgg('아직 세상 구경 전');
    return;
  }
  if (travel) {
    pet.caption = '이미 가는 중';
    pet.captionT = 0;
    return;
  }
  if (battle) {
    pet.caption = '끝나고 가자';
    pet.captionT = 0;
    return;
  }
  if (place !== 'home') {
    startTravel('home');
    return;
  }
  if (food) {
    pet.caption = '밥부터 볼래';
    pet.captionT = 0;
    setBehavior('eat');
    return;
  }
  startTravel('walk');
}
function cheerBattle() {
  if (!battle) return;
  if (battle.phase !== 'active') {
    pet.caption = battle.phase === 'entering' ? '상대 오는 중' : '끝난 것 같아';
    pet.captionT = 0;
    return;
  }
  if (battle.cheerT > 0.2) {
    pet.caption = '방금 들었어';
    pet.captionT = 0;
    return;
  }
  battle.cheerT = 2.4;
  const focus = battle.plan && Number.isFinite(battle.plan.focusChance) ? battle.plan.focusChance : battleFocusChance();
  const heard = focus >= 0.48 || needs.bond >= 0.55;
  if (heard) {
    battle.hp = clamp(battle.hp - 0.05 - focus * 0.05 - needs.bond * 0.04, 0, 1);
    pet.happy = Math.max(pet.happy, 0.7);
    pet.caption = randomLine(BATTLE_CHEER_LINES);
    spawn('heart', pet.x + rand(-18, 18), pet.y - pet.r * depthScale() * rand(1.0, 1.5));
    affectNeed('bond', 0.006);
  } else {
    pet.caption = randomLine(BATTLE_IGNORE_LINES);
    affectNeed('bond', 0.002);
  }
  pet.captionT = 0;
}
function updateBattleEntry(dt) {
  if (!battle) return;
  battle.entryT += dt;
  battle.t += dt;
  const dx = battle.baseX - battle.x;
  const step = Math.sign(dx || -battle.entrySide) * Math.min(Math.abs(dx), BATTLE_FOE_ENTRY_SPEED * dt);
  battle.x += step;
  battle.y = lerp(battle.y, battle.baseY, 1 - Math.exp(-8 * dt));
  battle.angle += -battle.entrySide * dt * 7.5;
  pet.target.x = battle.baseX - battle.entrySide * 54;
  pet.target.y = battle.baseY + 8;
  if (Math.abs(battle.baseX - battle.x) <= 4) {
    battle.x = battle.baseX;
    battle.y = battle.baseY;
    battle.angle = 0;
    battle.t = 0;
    battle.phase = 'active';
    initBattlePhysics();
    pet.caption = '마주섰다';
    pet.captionT = 0;
  }
}
function launchDefeatedFoe() {
  const Matter = matterApi();
  if (!battle || !ensureBattlePhysics() || !Matter) return false;
  const { Body } = Matter;
  const foeBody = battle.physics.foeBody;
  const petBody = battle.physics.petBody;
  const dx = foeBody.position.x - petBody.position.x;
  const dy = foeBody.position.y - petBody.position.y;
  const d = Math.hypot(dx, dy) || 1;
  const side = dx >= 0 ? 1 : -1;
  Body.setVelocity(foeBody, {
    x: dx / d * 14.2 + side * 3.2,
    y: dy / d * 9.2 - 1.1,
  });
  Body.setAngularVelocity(foeBody, side * 0.62);
  foeBody.frictionAir = 0.018;
  foeBody.restitution = 0.96;
  battle.hitT = 0.78;
  return true;
}
function updateBattleDefeated(dt) {
  const Matter = matterApi();
  if (!battle) return;
  if (!battle.physics || !Matter) {
    battle.t += dt;
    battle.defeatT += dt;
    battle.x += (battle.defeatDir || 1) * 260 * dt;
    battle.angle += (battle.defeatDir || 1) * dt * 6;
    if (!battle.haloVisible && battle.defeatT >= 0.9) {
      battle.haloVisible = true;
      battle.haloT = 0;
      if (!battle.resultShown) {
        battle.resultShown = true;
        battleResult = {
          won: true,
          title: '이겼다!',
          line: battle.resultLine || '반짝 챙김',
          t: 3.4,
        };
      }
    }
    if (battle.haloVisible) {
      battle.haloT += dt;
      if (battle.haloT > 1.35) {
        battle = null;
        if (place === 'battle') battleReturnT = BATTLE_RETURN_DELAY;
      }
    }
    return;
  }
  const { Engine, Body } = Matter;
  battle.t += dt;
  battle.defeatT += dt;
  battle.hitT = Math.max(0, battle.hitT - dt * 0.75);
  Engine.update(battle.physics.engine, Math.min(dt * 1000, BATTLE_PHYSICS_STEP_MAX));
  const foeBody = battle.physics.foeBody;
  const speed = Math.hypot(foeBody.velocity.x, foeBody.velocity.y);
  const maxSpeed = 15.5;
  if (speed > maxSpeed) Body.setVelocity(foeBody, { x: foeBody.velocity.x / speed * maxSpeed, y: foeBody.velocity.y / speed * maxSpeed });
  syncBattleFromPhysics();
  const settled = battle.defeatT >= BATTLE_FOE_DEFEAT_MIN_SECONDS && speed < BATTLE_FOE_DEFEAT_SETTLE_SPEED;
  if (!battle.haloVisible && (settled || battle.defeatT >= BATTLE_FOE_DEFEAT_MAX_SECONDS)) {
    battle.haloVisible = true;
    battle.haloT = 0;
    Body.setVelocity(foeBody, { x: 0, y: 0 });
    Body.setAngularVelocity(foeBody, 0);
    battle.hitT = 0;
    if (!battle.resultShown) {
      battle.resultShown = true;
      battleResult = {
        won: true,
        title: '이겼다!',
        line: battle.resultLine || '반짝 챙김',
        t: 3.4,
      };
    }
  }
  if (battle.haloVisible) {
    battle.haloT += dt;
    if (battle.haloT > 2.25) {
      battle = null;
      if (place === 'battle') battleReturnT = BATTLE_RETURN_DELAY;
    }
  }
}
function finishBattle(won) {
  if (!battle) return;
  const battleY = battle.y;
  const opponent = battle.opponentId ? opponentById(battle.opponentId) : null;
  const rematch = Boolean(battle.rematch);
  const returnSide = Math.abs(pet.vx) > 90 ? Math.sign(pet.vx) : pet.x < W / 2 ? -1 : 1;
  pet.behavior = 'stare';
  pet.behaviorT = 2.4;
  careStats.lastBattleAt = nowTime();
  affectNeed('energy', won ? -0.08 : -0.14);
  if (won) {
    const firstDefeat = opponent && !isOpponentDefeated(opponent.id);
    const winCaption = opponent && opponent.loseLine ? opponent.loseLine : randomLine(BATTLE_WIN_LINES);
    careStats.battleWins += 1;
    addBattleStats(0.03);
    affectNeed('bond', 0.028);
    rememberCare(careStats.battleWins === 1 ? '처음 이겨본 날' : '싸움에서 돌아온 날');
    if (firstDefeat) recordOpponentDefeat(opponent);
    pet.happy = Math.max(pet.happy, 0.85);
    for (let i = 0; i < 5; i++) spawn('heart', pet.x + rand(-24, 24), pet.y - pet.r * depthScale() * rand(1.0, 1.7));
    grantPebbles(rematch ? BATTLE_REMATCH_PEBBLES : BATTLE_WIN_PEBBLES, SHINY_PEBBLE_CAPTIONS);
    const rankedUp = grantKinship('battle', 1, 5);
    if (!rankedUp) pet.caption = winCaption;
    battle.phase = 'defeated';
    battle.defeatT = 0;
    battle.defeatDir = battle.x >= pet.x ? 1 : -1;
    battle.haloT = 0;
    battle.haloVisible = false;
    battle.resultShown = false;
    battle.resultLine = firstDefeat && opponent ? `${opponent.name} 넘어섬` : '반짝 챙김';
    battle.hp = 0;
    launchDefeatedFoe();
  } else {
    battle = null;
    const loseCaption = opponent && opponent.winLine ? opponent.winLine : '졌지만 이거 봐';
    addBattleStats(0.015);
    rememberCare('싸우고 푹 쉬는 날');
    pet.squashVel = clamp(pet.squashVel - 4, -10, 10);
    for (let i = 0; i < 6; i++) spawn('dust', pet.x + rand(-26, 26), battleY + rand(-6, 8));
    grantPebbles(BATTLE_LOSS_PEBBLES, ['졌지만 이거 봐', '작은 반짝 챙김']);
    pet.caption = loseCaption;
    pet.defeatT = 5.6;
    pet.rollSpin = 0;
    pet.vx = returnSide * BATTLE_DEFEAT_RETURN_SPEED * 0.82;
    pet.vy = 0;
    pet.behavior = 'travel';
    pet.behaviorT = 60;
    battleDefeatReturn = {
      phase: 'rollingOut',
      exitSide: returnSide,
      y: clamp(pet.y, H * 0.55, H * 0.78),
      t: 0,
    };
    battleResult = {
      won: false,
      title: '져부렀다 ㅠㅠ',
      line: '데굴데굴 귀가',
      t: 4.0,
    };
  }
  pet.captionT = 0;
  requestAiLine(won ? 'battle_win' : 'battle_tired', false);
}
function recordOpponentDefeat(opponent) {
  if (!opponent || isOpponentDefeated(opponent.id)) return;
  careStats.league.defeated.push(opponent.id);
  if (opponent.rival) rememberCare(rivalMemoryLine(opponent));
  const league = leagueById(opponent.leagueId);
  const cleared = leagueOpponentIds(league).every(id => careStats.league.defeated.includes(id));
  if (cleared) {
    rememberCare(league.memory);
    grantPebbles(LEAGUE_REWARD_PEBBLES, SHINY_PEBBLE_CAPTIONS);
  }
  markLeagueCurrentFromProgress();
}
function updateBattle(dt) {
  if (!battle) return;
  if (battle.phase === 'entering') {
    updateBattleEntry(dt);
    return;
  }
  if (battle.phase === 'defeated') {
    updateBattleDefeated(dt);
    return;
  }
  if (battle.phase !== 'active') return;
  battle.t += dt;
  battle.hitT = Math.max(0, battle.hitT - dt);
  battle.foeHitT = Math.max(0, battle.foeHitT - dt);
  battle.petImpactT = Math.max(0, (battle.petImpactT || 0) - dt);
  battle.cheerT = Math.max(0, battle.cheerT - dt);
  const physicsActive = updateBattlePhysics(dt);
  const dx = battle.x - pet.x, dy = battle.y - pet.y, d = Math.hypot(dx, dy) || 1;
  if (!physicsActive) updateBattleFoeMotion(dt);
  pet.target.x = battle.x - Math.sign(dx || pet.dir) * 46;
  pet.target.y = battle.y + 8;
  if (d > 72) {
    if (!physicsActive) {
      pet.vx = lerp(pet.vx, dx / d * 105 * stageScale('speed'), 1 - Math.exp(-8 * dt));
      pet.vy = lerp(pet.vy, dy / d * 82 * stageScale('speed'), 1 - Math.exp(-8 * dt));
    }
    return;
  }
  if (!physicsActive) {
    pet.vx = lerp(pet.vx, Math.sin(battle.t * 8) * 24, 1 - Math.exp(-9 * dt));
    pet.vy = lerp(pet.vy, Math.cos(battle.t * 5) * 12, 1 - Math.exp(-9 * dt));
  }
  playBattlePlanRounds();
  if (battle && battle.phase === 'active' && battle.t > battle.plan.duration) finishBattle(battle.plan.won);
}
function updateBattleFoeMotion(dt) {
  const opponent = opponentById(battle.opponentId);
  const personality = opponent ? opponent.personality : '침착';
  const directionAway = battle.baseX < W / 2 ? -1 : 1;
  let targetX = battle.baseX;
  let targetY = battle.baseY;
  if (personality === '겁쟁이') {
    targetX += directionAway * (24 + Math.sin(battle.t * 2.8) * 10);
    targetY += Math.cos(battle.t * 2.1) * 14;
  } else if (personality === '저돌') {
    targetX += (pet.x - battle.baseX) * 0.16 + Math.sin(battle.t * 6.5) * 10;
    targetY += (pet.y - battle.baseY) * 0.08;
  } else {
    targetX += Math.sin(battle.t * 2.2) * 16;
    targetY += Math.cos(battle.t * 2.2) * 8;
  }
  battle.x = lerp(battle.x, clamp(targetX, 84, W - 84), 1 - Math.exp(-5 * dt));
  battle.y = lerp(battle.y, clamp(targetY, H * 0.48, H * 0.8), 1 - Math.exp(-5 * dt));
}
function playBattlePlanRounds() {
  if (!battle || !battle.plan || !Array.isArray(battle.plan.rounds)) return;
  while (battle.roundIndex < battle.plan.rounds.length && battle.t >= battle.plan.rounds[battle.roundIndex].at) {
    const round = battle.plan.rounds[battle.roundIndex];
    battle.roundIndex += 1;
    battle.hp = clamp(round.foeHp, 0, 1);
    battle.petHp = clamp(round.petHp, 0, 1);
    if (round.actor === 'pet') {
      battle.hitT = 0.22;
      applyBattleRoundImpact(round);
      pet.squashVel = clamp(pet.squashVel - 1.6, -9, 9);
      spawn('dust', battle.x + rand(-14, 14), battle.y + rand(-6, 6));
    } else {
      battle.foeHitT = 0.22;
      battle.petImpactT = 0.28;
      applyBattleRoundImpact(round);
      pet.squashVel = clamp(pet.squashVel - 2.4, -10, 10);
      if (pet.captionT > 1.1) {
        pet.caption = '헛발질했다';
        pet.captionT = 0;
      }
    }
    if (round.decisive) finishBattle(battle.plan.won);
    if (!battle) return;
  }
}
function careMood() {
  if (isEggStage()) return 'egg';
  if (needs.hunger < 0.24) return 'hungry';
  if (needs.energy < 0.18) return 'tired';
  if (needs.bond < 0.16 && careStats.petStrokes < 24) return 'shy';
  if (needs.bond > 0.65 && needs.hunger > 0.48 && needs.energy > 0.35) return 'content';
  return 'neutral';
}
function rememberCare(line) {
  careStats.lastCareLine = line;
  const now = nowTime();
  careStats.lastCareAt = now;
  careStats.memoryLog.push({ text: line, at: now });
  if (careStats.memoryLog.length > 30) careStats.memoryLog.splice(0, careStats.memoryLog.length - 30);
}
function hasCareTrait(name) {
  return Boolean(careStats.traitMask & CARE_TRAITS[name].bit);
}
function careTraitNames() {
  return Object.entries(CARE_TRAITS).filter(([, trait]) => careStats.traitMask & trait.bit).map(([name]) => name);
}
function careBehaviorCaptions(name, caps) {
  if (hasCareTrait('cuddly') && name === 'stare') return caps.concat(['가까이 있을래', '손 기다리는 중']);
  if (hasCareTrait('cuddly') && name === 'wiggle') return caps.concat(['쓰다듬 대기 중', '꼬물꼬물 다가가는 중']);
  if (hasCareTrait('foodie') && name === 'sniff') return caps.concat(['밥 냄새 찾는 중', '혹시 간식?']);
  if (hasCareTrait('mellow') && name === 'plop') return caps.concat(['천천히 녹는 중', '느긋하게 철푸덕']);
  if (hasCareTrait('mellow') && name === 'sleep') return caps.concat(['여기 좋다', '느긋한 꿈 보는 중']);
  return caps;
}
function careBehaviorStarted(name) {
  if (name === 'belly') bellyState.rewarded = false;
}
function revealCareTrait(name) {
  const trait = CARE_TRAITS[name];
  if (careStats.traitMask & trait.bit) return false;
  careStats.traitMask |= trait.bit;
  rememberCare(trait.line);
  pet.caption = trait.caption;
  pet.captionT = 0;
  pet.happy = Math.max(pet.happy, 0.72);
  for (let i = 0; i < 4; i++) spawn('heart', pet.x + rand(-24, 24), pet.y - pet.r * depthScale() * rand(1.0, 1.7));
  return true;
}
function updateCareTraits() {
  if (needs.bond >= 0.28 && careStats.petStrokes >= 72 && revealCareTrait('cuddly')) return true;
  if ((careStats.mealsFed >= 3 || careStats.favoriteMeals >= 2) && revealCareTrait('foodie')) return true;
  if (careStats.napsTaken >= 2 && revealCareTrait('mellow')) return true;
  return false;
}
function noteCareAction(kind) {
  const bit = CARE_ACTION_BITS[kind] || 0;
  if (!bit) return false;
  careStats.routineBits |= bit;
  if (careStats.routineBits !== 7) return false;
  careStats.routineBits = 0;
  careStats.routineCount += 1;
  careStats.lastRoutineAt = nowTime();
  affectNeed('bond', 0.045);
  rememberCare(careStats.routineCount > 1 ? '오늘도 풀코스로 챙겨받음' : '밥, 잠, 쓰담 다 받은 날');
  grantDailyKinship();
  pet.happy = 1;
  for (let i = 0; i < 6; i++) spawn('heart', pet.x + rand(-26, 26), pet.y - pet.r * depthScale() * rand(1.0, 1.8));
  grantPebbles(1, ROUTINE_PEBBLE_CAPTIONS);
  return true;
}
function isFavoriteFood(foodType) {
  return foodType.id === genes.favoriteFoodId;
}
function recordMeal(foodType) {
  careStats.mealsFed += 1;
  careStats.lastMealAt = nowTime();
  if (isFavoriteFood(foodType)) {
    careStats.favoriteMeals += 1;
    rememberCare(`${foodObjectLabel(foodType)} 제일 좋아함`);
    const routineCompleted = noteCareAction('meal');
    updateCareTraits();
    return routineCompleted;
  }
  rememberCare(`${foodObjectLabel(foodType)} 먹어봄`);
  const routineCompleted = noteCareAction('meal');
  updateCareTraits();
  return routineCompleted;
}
function rejectFoodWhenFull() {
  pet.caption = needs.hunger > 0.96 ? '배 빵빵해' : '조금 이따 먹을래';
  pet.captionT = 0;
  pet.happy = Math.max(pet.happy, 0.35);
  pet.squashVel = clamp(pet.squashVel - 2.2, -10, 10);
  affectNeed('bond', 0.004);
}
function mealCaption(foodType) {
  if (needs.hunger < 0.25) return '밥이다!! 살았다';
  if (isFavoriteFood(foodType)) return '이 냄새 좋아';
  if (needs.hunger < 0.55) return '냠냠 해야지';
  if (careStats.mealsFed > 0) return '또 밥 냄새';
  return '처음 밥이다';
}
function requestRest() {
  if (awayFromHome() || travel) {
    pet.caption = awayFromHome() ? '집 가서 누울래' : '도착하면 잘래';
    pet.captionT = 0;
    return;
  }
  if (battle) {
    pet.caption = '끝나고 누울래';
    pet.captionT = 0;
    return;
  }
  if (isEggStage()) {
    nudgeEgg('잠은 안에서 자는 중');
    return;
  }
  if (food && needs.hunger < 0.7) {
    pet.caption = '밥 먹고 잘래';
    pet.captionT = 0;
    if (input.mode !== 'drag') setBehavior('eat');
    return;
  }
  if (needs.energy > 0.88) {
    pet.caption = '아직 안 졸려';
    pet.captionT = 0;
    pet.happy = Math.max(pet.happy, 0.3);
    affectNeed('bond', 0.003);
    return;
  }
  careStats.napsTaken += 1;
  careStats.lastNapAt = nowTime();
  rememberCare(needs.energy < 0.28 ? '낮잠으로 기운 충전 중' : '잠깐 눈 붙이는 중');
  const routineCompleted = noteCareAction('rest');
  const traitRevealed = updateCareTraits();
  setBehavior('sleep');
  pet.behaviorT = Math.max(pet.behaviorT, clamp((1 - needs.energy) * 18, 7, 15));
  if (!routineCompleted && !traitRevealed) pet.caption = needs.energy < 0.28 ? '충전할게…' : '눈 좀 붙일게…';
  pet.captionT = 0;
  pet.zTimer = 0.2;
  pet.squashVel = clamp(pet.squashVel - 1.5, -8, 8);
  tryGrowAdultOnSleep();
}
function recordPetting(amount) {
  if (isEggStage()) {
    warmEgg(amount);
    return;
  }
  const now = nowTime();
  careStats.grime = clamp(careStats.grime - amount * 0.00022, 0, 1);
  careStats.petStrokes += amount;
  let bellyRewarded = false;
  if (pet.behavior === 'belly' && !bellyState.rewarded && amount > 1.5) {
    bellyState.rewarded = true;
    bellyRewarded = true;
    affectNeed('bond', BELLY_RUB_BOND_GAIN);
    pet.caption = '믿으니까 보여줘';
    pet.captionT = 0;
    pet.happy = 1;
    for (let i = 0; i < 5; i++) spawn('heart', pet.x + rand(-26, 26), pet.y - pet.r * depthScale() * rand(1.0, 1.75));
  }
  if (now - careStats.lastPetAt > 1400) rememberCare(needs.bond > 0.45 ? '쓰다듬받고 골골거림' : '손길을 기억함');
  if (amount > 2.4) {
    const routineCompleted = noteCareAction('pet');
    if (bellyRewarded && routineCompleted) {
      pet.caption = '믿으니까 보여줘';
      pet.captionT = 0;
    }
  }
  updateCareTraits();
  careStats.lastPetAt = now;
}
function updateCare(dt, { airborne, speed }) {
  updateBattleResult(dt);
  updateTravel(dt);
  updateBattle(dt);
  updateBattleReturn(dt);
  if (pet.stageTween) {
    pet.stageTween.t += dt;
    if (pet.stageTween.t >= pet.stageTween.dur) pet.stageTween = null;
  }
  if (pet.hatchFxT > 0) pet.hatchFxT = Math.max(0, pet.hatchFxT - dt);
  if (pet.eggShakeT > 0) pet.eggShakeT = Math.max(0, pet.eggShakeT - dt);
	  if (isEggStage()) {
    if (tryHatchEgg()) return;
    if (!isStagePreview()) careStats.hatchWarmth = clamp(careStats.hatchWarmth - dt * 0.004, 0, 1);
    return;
	  }
	  updateWalkPlace(dt);
  updateWalkReturn(dt);
	  updateFurnitureUse(dt);
	  if (pet.behavior !== 'belly') bellyState.rewarded = false;
	  roughPlayState.roughness = Math.max(0, roughPlayState.roughness - dt * ROUGHNESS_DECAY_PER_SECOND);
	  affectNeed('hunger', -dt * (0.00042 + speed * 0.000003) * stageScale('hunger'));
	  affectNeed('energy', pet.behavior === 'sleep' ? dt * 0.045 * (isUsingCushion() ? 1.3 : 1) : -dt * (0.0014 + speed * 0.000012) * stageScale('energy'));
  if (!airborne && input.mode !== 'drag' && !food && pet.behavior !== 'sleep' && needs.energy < 0.1) {
    setBehavior('sleep');
    pet.caption = '스르륵…';
    pet.captionT = 0;
    tryGrowAdultOnSleep();
  }
  if (needs.hunger < 0.24 && pet.captionT > 4) {
    pet.caption = '밥 생각 중…';
    pet.captionT = 0;
  } else if (needs.energy < 0.16 && pet.captionT > 4) {
    pet.caption = '졸려…';
    pet.captionT = 0;
  } else if (needs.bond > 0.65 && pet.captionT > 6 && Math.random() < dt * 0.35) {
    pet.caption = randomLine(BOND_LINES);
    pet.captionT = 0;
  }
}
function behaviorWeight(name, base) {
  let w = base.w;
  if (name === 'sleep') w *= needs.energy < 0.3 ? 5 : needs.energy < 0.6 ? 2 : 1;
  if (name === 'plop') w *= needs.energy < 0.4 ? 2.2 : 1;
  if (name === 'zoomies' || name === 'wiggle') w *= needs.energy < 0.35 ? 0.15 : 1;
	  if (name === 'zoomies') w *= stageScale('zoomies');
	  if (name === 'sniff') w *= needs.hunger < 0.5 ? 2.2 : 1;
	  if (name === 'stare') w *= 1 + needs.bond * 1.8;
	  if (name === 'wheel') w *= place === 'home' && hasFurniture('wheel') && needs.energy > 0.42 && !food && !ball ? 1 : 0;
	  if (name === 'belly') w *= needs.bond >= 0.7 && place === 'home' && !food && !ball && needs.energy > 0.32 ? 1 : 0;
	  if (name === 'wiggle') w *= 1 + needs.bond * 1.2;
  if (name === 'wander' && dayPeriod() === 'morning') w *= 1.4;
  if (name === 'zoomies' && dayPeriod() === 'morning') w *= 1.4;
  if (name === 'sniff' && dayPeriod() === 'evening') w *= 1.3;
  if (name === 'wiggle' && dayPeriod() === 'evening') w *= 1.3;
  if (name === 'sleep' && dayPeriod() === 'night') w *= 3;
  if (name === 'zoomies' && dayPeriod() === 'night') w *= 0.3;
  if (hasCareTrait('cuddly') && (name === 'stare' || name === 'wiggle')) w *= 1.45;
  if (hasCareTrait('foodie') && name === 'sniff') w *= 1.55;
  if (hasCareTrait('mellow') && (name === 'plop' || name === 'sleep')) w *= 1.35;
  return w;
}
