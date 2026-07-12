'use strict';

const OPPONENT_ROSTER_VERSION = 1;

const OPPONENT_STAT_MEANING = {
  tough: 'hp',
  quick: 'evasion-critical',
  power: 'damage',
};

const OPPONENT_TIERS = [
  { id: 'yard', name: '공터 줄', base: 0.45 },
  { id: 'alley', name: '골목 줄', base: 0.82 },
  { id: 'shop', name: '가게 뒤 줄', base: 1.18 },
  { id: 'schoolyard', name: '학교 뒤 줄', base: 1.55 },
  { id: 'stream', name: '하천 줄', base: 1.92 },
  { id: 'market', name: '시장 줄', base: 2.3 },
  { id: 'warehouse', name: '창고 줄', base: 2.72 },
  { id: 'night', name: '밤골목 줄', base: 3.16 },
  { id: 'hill', name: '언덕 위 줄', base: 3.64 },
  { id: 'deep', name: '바닥 밑 줄', base: 4.1 },
];

const OPPONENT_FORMATIONS = {
  solo: { label: '혼자 나옴', unitCount: 1 },
  pair: { label: '둘이 같이 나옴', unitCount: 2 },
  trio: { label: '셋이 우르르 나옴', unitCount: 3 },
  pack: { label: '작은 무리로 나옴', unitCount: 5 },
  swarm: { label: '잔뜩 몰려 나옴', unitCount: 8 },
  leaderPack: { label: '대장 하나와 작은 애들', unitCount: 5 },
  giant: { label: '큰 덩어리 하나', unitCount: 1 },
  nested: { label: '큰 애와 붙은 작은 애들', unitCount: 4 },
};

const OPPONENT_BUILD_WEIGHTS = {
  tough: { tough: 1.35, quick: 0.62, power: 0.86 },
  quick: { tough: 0.72, quick: 1.34, power: 0.82 },
  power: { tough: 0.82, quick: 0.68, power: 1.38 },
  toughQuick: { tough: 1.18, quick: 1.18, power: 0.7 },
  quickPower: { tough: 0.72, quick: 1.17, power: 1.17 },
  toughPower: { tough: 1.16, quick: 0.7, power: 1.18 },
  balanced: { tough: 1, quick: 1, power: 1 },
  odd: { tough: 0.92, quick: 1.08, power: 0.96 },
};

const OPPONENT_SCALE_VALUES = {
  crumb: 0.58,
  tiny: 0.72,
  small: 0.86,
  medium: 1,
  tall: 1.08,
  wide: 1.16,
  big: 1.32,
  giant: 1.72,
};

const OPPONENT_PERSONALITY_FALLBACK = {
  숨음: '겁쟁이',
  툭치기: '겁쟁이',
  돌진: '저돌',
  버팀: '침착',
  재기: '침착',
  장난: '저돌',
  우르르: '저돌',
  지킴: '침착',
  어슬렁: '침착',
  침착: '침착',
  변덕: '겁쟁이',
};

const OPPONENT_LINES = {
  겁쟁이: {
    intro: '벌써 숨음',
    winLine: '피한 척함',
    loseLine: '조용히 끄덕임',
  },
  저돌: {
    intro: '앞발 먼저 옴',
    winLine: '끝까지 굴러옴',
    loseLine: '멈칫하고 비킴',
  },
  침착: {
    intro: '자리 잡음',
    winLine: '안 밀린 척함',
    loseLine: '천천히 끄덕임',
  },
};

const OPPONENT_CONCEPTS = [
  ['먼지 뭉치', '굴러다니는 먼지 생물', 'quick', '숨음', 'solo', 'tiny', '먼지', '', 'warm'],
  ['콩떡', '앞으로만 구르는 콩떡 생물', 'power', '돌진', 'solo', 'small', '떡', '', 'warm'],
  ['두부 반장', '말랑하지만 안 밀리는 두부 생물', 'tough', '버팀', 'solo', 'medium', '두부', '종이 완장', 'warm'],
  ['솜발 둘', '발만 바쁜 쌍둥이 솜 생물', 'quick', '툭치기', 'pair', 'tiny', '솜', '', 'warm'],
  ['깨알 군단', '깨알처럼 작은 무리 생물', 'quickPower', '우르르', 'swarm', 'crumb', '깨', '', 'warm'],
  ['찹쌀 돌돌', '느리게 말리는 찹쌀 생물', 'tough', '버팀', 'solo', 'small', '찹쌀', '', 'warm'],
  ['말랑 꼬마대장', '작은 애들을 데리고 온 대장 생물', 'balanced', '지킴', 'leaderPack', 'small', '말랑', '종이 왕관', 'warm'],
  ['분필 가루', '하얗게 흩어지는 가루 생물', 'quick', '변덕', 'pack', 'crumb', '분필', '', 'pale'],
  ['연필심 복실', '까만 끝이 있는 복실 생물', 'power', '돌진', 'solo', 'small', '연필심', '', 'pale'],
  ['지우개 둥실', '문지르면 모양이 바뀌는 생물', 'toughQuick', '재기', 'solo', 'medium', '지우개', '', 'pale'],
  ['골목 조약돌', '작지만 제법 단단한 조약돌 생물', 'tough', '버팀', 'solo', 'small', '돌', '', 'warm'],
  ['비닐 꼬리', '꼬리가 바스락대는 생물', 'quick', '숨음', 'solo', 'small', '비닐', '', 'pale'],
  ['낙엽 주머니', '낙엽을 품은 둥근 생물', 'toughPower', '어슬렁', 'solo', 'medium', '낙엽', '헐거운 주머니', 'autumn'],
  ['빨대 기사', '빨대를 들고 진지한 생물', 'power', '돌진', 'solo', 'small', '빨대', '빨대 창', 'warm'],
  ['고무줄 콩', '튀었다 돌아오는 콩 생물', 'quick', '재기', 'pair', 'tiny', '고무줄', '', 'warm'],
  ['종이컵 둥지', '컵 안에 들어간 말랑 생물', 'tough', '지킴', 'solo', 'medium', '종이컵', '종이컵 갑옷', 'warm'],
  ['초코 점박이', '작은 점이 많은 달콤한 생물', 'balanced', '장난', 'trio', 'tiny', '초코', '', 'warm'],
  ['젤리 발톱', '발끝만 날카로운 척하는 젤리 생물', 'quickPower', '툭치기', 'solo', 'small', '젤리', '말랑 발톱', 'bright'],
  ['보풀 모임', '보풀이 뭉쳐 한 몸처럼 움직임', 'toughQuick', '우르르', 'pack', 'crumb', '보풀', '', 'pale'],
  ['하품 찐빵', '싸우다 하품하는 찐빵 생물', 'tough', '어슬렁', 'solo', 'big', '찐빵', '', 'warm'],
  ['골목 진순', '자기 바닥을 지키는 골목 생물', 'balanced', '지킴', 'solo', 'medium', '골목', '낡은 목수건', 'warm'],
  ['빗방울 폴짝', '비 온 뒤 튀어오르는 생물', 'quick', '재기', 'trio', 'tiny', '비', '', 'cool'],
  ['껌딱 말랑', '한번 붙으면 잘 안 떨어지는 생물', 'tough', '버팀', 'solo', 'wide', '껌', '', 'warm'],
  ['단추 눈썹', '단추를 눈썹처럼 붙인 생물', 'power', '돌진', 'solo', 'small', '단추', '단추 눈썹', 'warm'],
  ['참깨 셋', '셋이 한 박자 늦게 움직이는 생물', 'quick', '우르르', 'trio', 'crumb', '참깨', '', 'warm'],
  ['양말 망토콩', '망토가 자꾸 끌리는 콩 생물', 'quickPower', '장난', 'solo', 'small', '양말', '양말 망토', 'warm'],
  ['봉투귀 둥이', '봉투처럼 접힌 귀를 가진 생물', 'toughQuick', '숨음', 'pair', 'small', '봉투', '', 'pale'],
  ['납작 부침', '바닥에 넓게 붙은 부침 생물', 'tough', '버팀', 'solo', 'wide', '부침', '', 'warm'],
  ['낮잠 보리', '졸면서도 버티는 보리 생물', 'toughPower', '어슬렁', 'solo', 'small', '보리', '', 'warm'],
  ['최초 말랑', '자기가 제일인 줄 아는 말랑 생물', 'balanced', '지킴', 'solo', 'medium', '말랑', '종이 띠', 'warm'],
  ['보리알', '작고 빠르게 숨는 보리 생물', 'quick', '숨음', 'solo', 'tiny', '보리', '', 'warm'],
  ['젤리 발', '발부터 먼저 오는 젤리 생물', 'quickPower', '돌진', 'solo', 'small', '젤리', '', 'bright'],
  ['골목 우두둑', '작은 소리를 내며 굴러오는 생물', 'power', '돌진', 'solo', 'medium', '골목', '', 'warm'],
  ['물컹 둘째', '둘째라고 우기는 물컹 생물', 'balanced', '장난', 'pair', 'small', '물컹', '', 'warm'],
  ['비누거품 떼', '거품처럼 몰려오는 생물', 'quick', '우르르', 'swarm', 'crumb', '거품', '', 'pale'],
  ['수건돌이', '수건을 두른 둥근 생물', 'tough', '버팀', 'solo', 'medium', '수건', '작은 수건', 'warm'],
  ['신문 모자빵', '신문 모자를 쓴 빵 생물', 'power', '지킴', 'solo', 'medium', '신문', '신문 모자', 'pale'],
  ['달고나 구석', '모서리가 자꾸 깨지는 생물', 'power', '돌진', 'solo', 'small', '달고나', '', 'warm'],
  ['풀씨 폴짝', '풀씨처럼 튀는 생물', 'quick', '재기', 'pack', 'crumb', '풀씨', '', 'green'],
  ['분홍 찹', '분홍빛 찹쌀 생물', 'balanced', '툭치기', 'solo', 'small', '찹쌀', '', 'bright'],
  ['고무신 콩떡', '고무신을 끌고 다니는 생물', 'toughPower', '어슬렁', 'solo', 'medium', '고무신', '작은 고무신', 'warm'],
  ['낡은 리본둥이', '리본이 삐뚤어진 쌍둥이 생물', 'quick', '변덕', 'pair', 'small', '리본', '낡은 리본', 'pale'],
  ['벽틈 먼지', '벽틈에서 나온 먼지 생물', 'quick', '숨음', 'pack', 'crumb', '먼지', '', 'dark'],
  ['통통 마개', '병마개처럼 튀는 생물', 'toughQuick', '재기', 'solo', 'small', '마개', '', 'warm'],
  ['조용한 호떡', '뒤집힐 생각만 하는 호떡 생물', 'tough', '침착', 'solo', 'wide', '호떡', '', 'warm'],
  ['콩비늘 장군', '콩비늘을 붙인 말랑 장군', 'toughPower', '지킴', 'leaderPack', 'medium', '콩비늘', '종이 갑옷', 'warm'],
  ['새벽 솜눈', '새벽색 눈을 가진 솜 생물', 'quick', '숨음', 'solo', 'small', '새벽', '', 'cool'],
  ['와르르 모래', '모래처럼 흩어졌다 모이는 생물', 'quickPower', '우르르', 'swarm', 'crumb', '모래', '', 'warm'],
  ['큰입 만두', '입만 큰 만두 생물', 'power', '장난', 'solo', 'big', '만두', '', 'warm'],
  ['천천 두부', '느리지만 잘 안 밀리는 두부 생물', 'tough', '버팀', 'solo', 'big', '두부', '', 'warm'],
  ['빵가루 대열', '줄지어 오는 빵가루 생물', 'quick', '우르르', 'pack', 'crumb', '빵가루', '', 'warm'],
  ['골판지 방패곰', '골판지를 두른 둥근 생물', 'tough', '지킴', 'solo', 'medium', '골판지', '골판지 방패', 'pale'],
  ['오목눈 밤톨', '눈이 오목한 밤톨 생물', 'toughPower', '버팀', 'solo', 'small', '밤톨', '', 'autumn'],
  ['연두 말랑이', '연두빛으로 살랑이는 생물', 'balanced', '재기', 'pair', 'small', '연두', '', 'green'],
  ['꼬불 국수발', '꼬불거리며 다가오는 생물', 'quick', '툭치기', 'trio', 'tiny', '국수', '', 'warm'],
  ['삐뚤 왕관콩', '왕관이 자꾸 내려오는 콩 생물', 'power', '지킴', 'solo', 'small', '왕관', '종이 왕관', 'warm'],
  ['계단 밑 솜', '계단 밑에서 굴러나온 생물', 'quick', '숨음', 'solo', 'tiny', '솜', '', 'dark'],
  ['꼬리 긴 보리', '꼬리로 균형 잡는 보리 생물', 'quickPower', '재기', 'solo', 'small', '보리', '', 'warm'],
  ['둥근딱지', '딱지처럼 버티는 둥근 생물', 'tough', '버팀', 'solo', 'medium', '딱지', '', 'warm'],
  ['한입 장군', '작지만 장군 행세하는 생물', 'balanced', '돌진', 'leaderPack', 'small', '한입', '종이 띠', 'warm'],
  ['누룽 꼬리', '누룽지색 꼬리를 가진 생물', 'quickPower', '툭치기', 'solo', 'small', '누룽지', '', 'warm'],
  ['빵떡 장군', '묵직하게 밀고 오는 빵떡 생물', 'power', '돌진', 'solo', 'big', '빵떡', '헐거운 투구', 'warm'],
  ['최강 말랑', '최강이라고 믿는 말랑 생물', 'balanced', '지킴', 'solo', 'medium', '말랑', '작은 깃발', 'warm'],
  ['골목 뒤 콩', '뒤에서 튀어나오는 콩 생물', 'quick', '숨음', 'pair', 'tiny', '콩', '', 'warm'],
  ['물먹은 찐빵', '젖어서 더 무거운 찐빵 생물', 'tough', '버팀', 'solo', 'big', '찐빵', '', 'cool'],
  ['우산버섯 말랑', '우산처럼 펼쳐진 생물', 'toughQuick', '어슬렁', 'solo', 'wide', '버섯', '잎 우산', 'green'],
  ['젖은 종이왕', '축 처진 왕관을 쓴 생물', 'tough', '지킴', 'leaderPack', 'medium', '젖은 종이', '젖은 왕관', 'cool'],
  ['새알 둥둥', '새알처럼 떠다니는 생물', 'quick', '재기', 'trio', 'tiny', '새알', '', 'pale'],
  ['양파껍질 형제', '겹겹이 붙은 형제 생물', 'toughQuick', '우르르', 'pack', 'tiny', '양파껍질', '', 'pale'],
  ['실밥 달팽', '실밥을 끌고 다니는 생물', 'tough', '어슬렁', 'solo', 'small', '실밥', '', 'pale'],
  ['빨간콩 발사대', '스스로 튀는 빨간콩 생물', 'power', '돌진', 'solo', 'small', '빨간콩', '', 'bright'],
  ['컵케이크 반장', '크림이 기울어진 생물', 'toughPower', '지킴', 'solo', 'medium', '컵케이크', '종이 컵', 'warm'],
  ['구름 납작이', '구름처럼 눌리는 생물', 'tough', '버팀', 'solo', 'wide', '구름', '', 'pale'],
  ['꼬마 번개솜', '번쩍이는 척하는 솜 생물', 'quickPower', '재기', 'pair', 'tiny', '번개', '종이 번개', 'bright'],
  ['회색 복숭아씨', '회색빛 씨앗 생물', 'toughPower', '침착', 'solo', 'small', '씨앗', '', 'dark'],
  ['파란 고무콩', '파랗게 튀는 고무콩 생물', 'quick', '재기', 'solo', 'small', '고무', '', 'cool'],
  ['바가지 투구떡', '바가지를 쓴 떡 생물', 'tough', '지킴', 'solo', 'big', '바가지', '바가지 투구', 'warm'],
  ['찢긴 스티커', '스티커처럼 붙었다 떨어지는 생물', 'quick', '툭치기', 'pack', 'crumb', '스티커', '', 'bright'],
  ['긴팔 만쥬', '소매가 긴 만쥬 생물', 'balanced', '장난', 'solo', 'medium', '만쥬', '긴 소매', 'warm'],
  ['도토리 줄장', '도토리 무리를 이끄는 생물', 'toughPower', '지킴', 'leaderPack', 'small', '도토리', '잎사귀 깃발', 'autumn'],
  ['비밀 물방울', '살짝 어두운 물방울 생물', 'quick', '숨음', 'solo', 'tiny', '물방울', '', 'dark'],
  ['기울어진 무', '자꾸 옆으로 서는 무 생물', 'power', '돌진', 'solo', 'tall', '무', '', 'pale'],
  ['찹쌀 유령콩', '유령 흉내를 내는 콩 생물', 'quick', '변덕', 'trio', 'tiny', '찹쌀', '얇은 천', 'dark'],
  ['잼뚜껑 왕자', '잼뚜껑을 얹은 생물', 'toughPower', '지킴', 'solo', 'medium', '잼', '뚜껑 모자', 'bright'],
  ['철푸덕 감자', '넘어져도 바로 버티는 감자 생물', 'tough', '버팀', 'solo', 'big', '감자', '', 'warm'],
  ['색종이 떼', '색종이를 붙인 작은 무리', 'quickPower', '우르르', 'swarm', 'crumb', '색종이', '', 'bright'],
  ['물방울 기수', '작은 깃발을 든 물방울 생물', 'balanced', '재기', 'solo', 'small', '물방울', '작은 깃발', 'cool'],
  ['연탄 솜뭉치', '검은 먼지가 묻은 솜 생물', 'tough', '버팀', 'solo', 'medium', '연탄', '', 'dark'],
  ['뾰족한 척 젤리', '뾰족해 보이지만 말랑한 생물', 'power', '돌진', 'solo', 'small', '젤리', '종이 가시', 'bright'],
  ['나른한 꽈배기', '몸이 꼬인 채 졸린 생물', 'toughQuick', '어슬렁', 'solo', 'wide', '꽈배기', '', 'warm'],
  ['소금 알갱단', '짭짤한 척하는 알갱이 무리', 'quick', '우르르', 'pack', 'crumb', '소금', '', 'pale'],
  ['까만 사탕알', '어둡게 반짝이는 사탕 생물', 'quickPower', '툭치기', 'solo', 'tiny', '사탕', '', 'dark'],
  ['두꺼운 팬케', '겹겹이 쌓인 팬케이크 생물', 'tough', '버팀', 'nested', 'wide', '팬케이크', '', 'warm'],
  ['양배추 망토장', '잎망토를 두른 생물', 'toughPower', '지킴', 'leaderPack', 'medium', '양배추', '잎 망토', 'green'],
  ['종이별 꼬마', '별을 붙이고 온 작은 생물', 'quick', '장난', 'trio', 'tiny', '종이별', '종이별', 'bright'],
  ['달빛 콩고물', '달빛처럼 흐린 콩고물 생물', 'balanced', '침착', 'solo', 'small', '콩고물', '', 'dark'],
  ['손수건 도깨비콩', '손수건을 뒤집어쓴 콩 생물', 'quickPower', '변덕', 'pair', 'small', '손수건', '손수건 덮개', 'dark'],
  ['묵직한 당근', '작지만 세게 박는 당근 생물', 'power', '돌진', 'solo', 'medium', '당근', '', 'bright'],
  ['밤톨 호위대', '밤톨 대장을 지키는 무리', 'toughPower', '지킴', 'leaderPack', 'small', '밤톨', '잎 방패', 'autumn'],
  ['후추 점떼', '점처럼 튀는 후추 생물', 'quick', '우르르', 'swarm', 'crumb', '후추', '', 'dark'],
  ['구부정 젤리곰', '허리가 구부정한 젤리 생물', 'toughQuick', '어슬렁', 'solo', 'medium', '젤리', '', 'bright'],
  ['밀가루 귀신', '밀가루를 뒤집어쓴 생물', 'quick', '숨음', 'pack', 'crumb', '밀가루', '', 'pale'],
  ['꼬마 냄비뚜껑', '뚜껑을 들고 버티는 생물', 'tough', '지킴', 'solo', 'small', '냄비뚜껑', '냄비뚜껑 방패', 'warm'],
  ['커튼 밑 말랑', '커튼 밑에서 나온 생물', 'balanced', '숨음', 'solo', 'small', '커튼', '', 'dark'],
  ['붕어빵 옆구리', '옆구리가 따뜻한 생물', 'toughPower', '돌진', 'solo', 'big', '붕어빵', '', 'warm'],
  ['계피 돌돌이', '빙글 말린 계피 생물', 'power', '돌진', 'solo', 'small', '계피', '', 'autumn'],
  ['미역 꼬리말랑', '꼬리가 흐느적이는 생물', 'quick', '툭치기', 'solo', 'small', '미역', '', 'green'],
  ['고요한 밤두부', '밤색 그림자를 단 두부 생물', 'tough', '침착', 'solo', 'medium', '두부', '검은 띠', 'dark'],
  ['딸기씨 합창단', '작은 씨앗들이 같이 움직임', 'quickPower', '우르르', 'swarm', 'crumb', '딸기씨', '', 'bright'],
  ['납작한 달', '달처럼 납작한 생물', 'tough', '버팀', 'solo', 'wide', '달', '', 'pale'],
  ['꼬불 수세미', '수세미처럼 꼬불한 생물', 'toughQuick', '버팀', 'solo', 'medium', '수세미', '', 'green'],
  ['기름종이 형제', '미끄럽게 피하는 형제 생물', 'quick', '툭치기', 'pair', 'small', '기름종이', '', 'pale'],
  ['과자봉지 대장', '바스락대며 지휘하는 생물', 'balanced', '지킴', 'leaderPack', 'medium', '과자봉지', '봉지 망토', 'bright'],
  ['잠긴 잼콩', '뚜껑이 안 열리는 콩 생물', 'tough', '버팀', 'solo', 'small', '잼', '작은 뚜껑', 'bright'],
  ['빗자루 먼지왕', '먼지들을 데리고 온 생물', 'quickPower', '우르르', 'leaderPack', 'medium', '먼지', '빗자루 털', 'dark'],
  ['초록 완두쌍', '둘이 같은 방향으로 튀는 생물', 'quick', '재기', 'pair', 'tiny', '완두', '', 'green'],
  ['대왕 김말이', '크지만 잘 굴러가는 생물', 'toughPower', '돌진', 'giant', 'giant', '김말이', '', 'green'],
  ['작은 먹구름', '어둡지만 보송한 구름 생물', 'balanced', '침착', 'solo', 'small', '먹구름', '', 'dark'],
  ['두유 방울', '흔들리는 두유빛 생물', 'quick', '재기', 'trio', 'tiny', '두유', '', 'pale'],
  ['불량 찐득이', '붙었다 떨어지는 어두운 생물', 'toughQuick', '툭치기', 'pack', 'tiny', '찐득', '', 'dark'],
  ['밤시장 호떡', '밤시장 냄새가 나는 호떡 생물', 'toughPower', '어슬렁', 'solo', 'big', '호떡', '종이 봉투', 'dark'],
  ['은박지 복실', '은박지를 걸친 복실 생물', 'quickPower', '변덕', 'solo', 'small', '은박지', '은박 망토', 'pale'],
  ['다크 푸딩', '검은 시럽이 흐르는 푸딩 생물', 'tough', '침착', 'solo', 'medium', '푸딩', '', 'dark'],
  ['깨진 과자병', '병 조각 흉내를 내는 생물', 'power', '돌진', 'solo', 'medium', '과자병', '종이 조각', 'dark'],
  ['까치발 무리', '발끝으로 몰려오는 생물', 'quick', '우르르', 'pack', 'crumb', '까치발', '', 'pale'],
  ['부풀린 만두왕', '김이 나는 큰 만두 생물', 'toughPower', '지킴', 'giant', 'giant', '만두', '종이 왕관', 'warm'],
  ['토마토 방울단', '방울방울 굴러오는 생물', 'quickPower', '우르르', 'swarm', 'tiny', '토마토', '', 'bright'],
  ['고장난 시계콩', '박자가 이상한 콩 생물', 'odd', '변덕', 'solo', 'small', '시계', '시계 태엽', 'pale'],
  ['수박씨 돌격대', '작지만 세게 튀는 씨앗들', 'power', '우르르', 'pack', 'crumb', '수박씨', '', 'dark'],
  ['창고 먼지불', '어둡게 뭉친 먼지 생물', 'quickPower', '숨음', 'pack', 'crumb', '먼지', '', 'dark'],
  ['물컹 갑옷젤', '갑옷인 척하는 젤리 생물', 'tough', '지킴', 'solo', 'medium', '젤리', '종이 갑옷', 'bright'],
  ['고추장 콩떡', '붉은 소스를 묻힌 콩떡 생물', 'power', '돌진', 'solo', 'medium', '고추장', '', 'bright'],
  ['하얀 그림자솜', '밝은데 그림자가 긴 솜 생물', 'quick', '숨음', 'solo', 'small', '그림자', '', 'dark'],
  ['깊은 컵푸딩', '컵 속에서 버티는 푸딩 생물', 'tough', '버팀', 'solo', 'big', '푸딩', '종이컵 갑옷', 'dark'],
  ['쌀알 기마대', '쌀알들이 줄지어 달리는 생물', 'quick', '우르르', 'swarm', 'crumb', '쌀알', '', 'pale'],
  ['헐렁 투구빵', '투구가 자꾸 내려오는 빵 생물', 'toughPower', '돌진', 'solo', 'big', '빵', '헐렁 투구', 'warm'],
  ['잿빛 모찌', '잿빛이 감도는 모찌 생물', 'balanced', '침착', 'solo', 'medium', '모찌', '', 'dark'],
  ['초승달 콩', '초승달처럼 휜 콩 생물', 'quickPower', '툭치기', 'pair', 'small', '초승달', '', 'dark'],
  ['녹슨 단추장', '녹슨 단추를 단 대장 생물', 'toughPower', '지킴', 'leaderPack', 'medium', '단추', '녹슨 단추', 'dark'],
  ['쫀득 늪알', '늪처럼 천천히 붙는 생물', 'tough', '버팀', 'solo', 'wide', '늪', '', 'dark'],
  ['먼지 박쥐콩', '날개 흉내를 내는 콩 생물', 'quick', '재기', 'trio', 'tiny', '박쥐', '종이 날개', 'dark'],
  ['어둑 양갱', '어둑한 빛의 양갱 생물', 'toughPower', '침착', 'solo', 'medium', '양갱', '', 'dark'],
  ['소용돌이 국수', '빙글거리며 휘감는 생물', 'quickPower', '변덕', 'solo', 'wide', '국수', '', 'warm'],
  ['헝겊 뒤집개', '헝겊을 뒤집어쓴 생물', 'toughQuick', '숨음', 'solo', 'medium', '헝겊', '헝겊 덮개', 'dark'],
  ['바닥 밑 꼬마', '바닥 밑에서 손만 내미는 생물', 'quick', '툭치기', 'pack', 'crumb', '바닥', '', 'dark'],
  ['냉장고 불빛콩', '차가운 빛을 품은 콩 생물', 'quick', '숨음', 'pair', 'small', '불빛', '', 'cool'],
  ['마른 귤껍질', '가볍게 바스락대는 생물', 'quick', '재기', 'trio', 'tiny', '귤껍질', '', 'autumn'],
  ['묵은 식빵장', '묵직하게 버티는 식빵 생물', 'toughPower', '지킴', 'solo', 'big', '식빵', '종이 띠', 'warm'],
  ['까만 우유방울', '까맣게 흐르는 우유 생물', 'balanced', '침착', 'solo', 'small', '우유', '', 'dark'],
  ['버터 귀신빵', '귀신 놀이를 하는 빵 생물', 'power', '장난', 'solo', 'medium', '버터', '얇은 천', 'warm'],
  ['자갈 호위단', '자갈들이 대장을 감싸는 무리', 'tough', '지킴', 'leaderPack', 'tiny', '자갈', '', 'pale'],
  ['밤하늘 보풀', '별빛을 붙인 보풀 생물', 'quick', '숨음', 'swarm', 'crumb', '보풀', '종이별', 'dark'],
  ['찐득 장판이', '장판에 붙었다 떨어지는 생물', 'toughQuick', '버팀', 'solo', 'wide', '장판', '', 'warm'],
  ['불꺼진 사탕', '빛이 꺼진 듯한 사탕 생물', 'quickPower', '툭치기', 'solo', 'small', '사탕', '', 'dark'],
  ['김빠진 탄산콩', '김이 빠져도 튀는 콩 생물', 'quick', '재기', 'trio', 'tiny', '탄산', '', 'cool'],
  ['납작 어묵왕', '넓고 따뜻한 어묵 생물', 'tough', '지킴', 'giant', 'giant', '어묵', '꼬치 깃발', 'warm'],
  ['깜빡 전구말랑', '깜빡이는 빛을 품은 생물', 'odd', '변덕', 'solo', 'medium', '전구', '작은 전구', 'pale'],
  ['종이칼 기사콩', '종이칼을 들고 폼 잡는 콩 생물', 'power', '돌진', 'solo', 'small', '종이칼', '종이칼', 'pale'],
  ['푸른 곰팡말랑', '푸른 점이 핀 말랑 생물', 'tough', '버팀', 'pack', 'tiny', '곰팡', '', 'dark'],
  ['창고쥐 아님', '쥐 흉내를 내는 말랑 생물', 'quickPower', '숨음', 'solo', 'small', '창고', '종이 귀', 'dark'],
  ['떨어진 별떡', '별 모양을 붙인 떡 생물', 'balanced', '침착', 'solo', 'medium', '별떡', '종이별', 'dark'],
  ['작은 먹물군', '먹물 자국처럼 움직이는 생물', 'quickPower', '우르르', 'swarm', 'crumb', '먹물', '', 'dark'],
  ['고요한 무쇠찹', '무쇠인 척하는 찹쌀 생물', 'toughPower', '버팀', 'solo', 'big', '무쇠', '검은 띠', 'dark'],
  ['비틀린 마카롱', '삐뚤어진 마카롱 생물', 'balanced', '변덕', 'solo', 'medium', '마카롱', '', 'bright'],
  ['달그림자 둘', '그림자처럼 붙어다니는 생물', 'quick', '숨음', 'pair', 'small', '그림자', '', 'dark'],
  ['왕큰 보리떡', '크기만 믿는 보리떡 생물', 'tough', '버팀', 'giant', 'giant', '보리떡', '', 'warm'],
  ['가느다란 파말랑', '길쭉하게 흔들리는 생물', 'quick', '재기', 'solo', 'tall', '파', '', 'green'],
  ['작은 망치콩', '작은 망치를 끌고 오는 콩 생물', 'power', '돌진', 'solo', 'small', '망치', '나무 망치', 'warm'],
  ['호일 투구젤', '호일 투구가 반짝이는 젤리 생물', 'toughQuick', '지킴', 'solo', 'medium', '호일', '호일 투구', 'pale'],
  ['검은 깨비알', '까만 깨알들이 모인 생물', 'quickPower', '우르르', 'pack', 'crumb', '깨', '', 'dark'],
  ['연못 찹방울', '연못빛 찹쌀 방울 생물', 'balanced', '침착', 'trio', 'tiny', '연못', '', 'cool'],
  ['빨래집게 장군', '집게를 집고 온 장군 생물', 'power', '지킴', 'leaderPack', 'medium', '빨래집게', '빨래집게 투구', 'pale'],
  ['서랍 속 말랑', '서랍 안쪽 냄새가 나는 생물', 'toughQuick', '숨음', 'solo', 'medium', '서랍', '', 'dark'],
  ['하얀 단팥빵', '속을 숨긴 단팥빵 생물', 'toughPower', '버팀', 'solo', 'big', '단팥빵', '', 'warm'],
  ['고춧가루 돌풍', '작게 매운 척하는 무리 생물', 'quickPower', '우르르', 'swarm', 'crumb', '고춧가루', '', 'bright'],
  ['찢긴 양말장', '양말을 두른 대장 생물', 'tough', '지킴', 'leaderPack', 'medium', '양말', '찢긴 양말 망토', 'dark'],
  ['뿌리채소 기사', '뿌리를 끌고 오는 생물', 'power', '돌진', 'solo', 'tall', '뿌리채소', '나뭇가지 창', 'green'],
  ['밤고구마 덩치', '크고 조용한 고구마 생물', 'toughPower', '어슬렁', 'giant', 'giant', '밤고구마', '', 'autumn'],
  ['눈밑 그늘솜', '눈 밑이 어두운 솜 생물', 'quick', '숨음', 'solo', 'small', '그늘', '', 'dark'],
  ['초록 유리알', '유리알처럼 보이는 말랑 생물', 'quick', '재기', 'pair', 'tiny', '유리알', '', 'green'],
  ['기절한 척 두부', '져도 안 진 척하는 두부 생물', 'tough', '버팀', 'solo', 'medium', '두부', '', 'pale'],
  ['까만 리본푸딩', '리본을 맨 어두운 푸딩 생물', 'balanced', '침착', 'solo', 'medium', '푸딩', '검은 리본', 'dark'],
  ['꼬마 북채콩', '북채를 들고 박자 맞추는 생물', 'power', '장난', 'trio', 'tiny', '북채', '작은 북채', 'warm'],
  ['흙먼지 대열', '흙먼지처럼 밀려오는 생물', 'toughQuick', '우르르', 'pack', 'crumb', '흙먼지', '', 'dark'],
  ['물렁 밤송이', '밤송이 흉내를 내는 말랑 생물', 'power', '지킴', 'solo', 'medium', '밤송이', '종이 가시', 'autumn'],
  ['은은한 쌀떡', '은은하게 빛나는 쌀떡 생물', 'balanced', '침착', 'solo', 'medium', '쌀떡', '', 'pale'],
  ['검은장갑 콩', '장갑을 낀 척하는 콩 생물', 'quickPower', '툭치기', 'solo', 'small', '장갑', '검은 장갑', 'dark'],
  ['두툼한 카스테라', '푹신하지만 묵직한 생물', 'tough', '버팀', 'giant', 'giant', '카스테라', '', 'warm'],
  ['우유팩 호위', '우유팩을 둘러쓴 호위 생물', 'toughQuick', '지킴', 'leaderPack', 'medium', '우유팩', '우유팩 갑옷', 'pale'],
  ['바람 빠진 풍선콩', '느리게 떠오르는 콩 생물', 'quick', '변덕', 'solo', 'small', '풍선', '', 'bright'],
  ['잊힌 쿠키부스러기', '잊힌 부스러기들이 모인 생물', 'quickPower', '우르르', 'swarm', 'crumb', '쿠키', '', 'dark'],
  ['어두운 잎사귀말랑', '잎 그림자를 두른 생물', 'quick', '숨음', 'solo', 'small', '잎사귀', '잎 망토', 'dark'],
  ['뭉툭 연필병', '연필처럼 서 있는 생물', 'power', '돌진', 'solo', 'tall', '연필', '종이 투구', 'pale'],
  ['철지난 귤왕', '귤껍질 왕관을 쓴 생물', 'toughPower', '지킴', 'leaderPack', 'big', '귤', '귤껍질 왕관', 'autumn'],
  ['나무숟가락 기사', '나무숟가락을 든 말랑 생물', 'power', '돌진', 'solo', 'medium', '숟가락', '나무숟가락 검', 'warm'],
  ['쌀뜨물 방울대', '쌀뜨물색 방울들이 몰려옴', 'quick', '우르르', 'pack', 'tiny', '쌀뜨물', '', 'pale'],
  ['먹구름 찹쌀왕', '커다란 먹구름빛 찹쌀 생물', 'tough', '침착', 'giant', 'giant', '먹구름', '검은 종이 왕관', 'dark'],
  ['간장 점말랑', '간장 점이 묻은 생물', 'balanced', '어슬렁', 'solo', 'medium', '간장', '', 'dark'],
  ['부러진 크레용콩', '크레용 자국을 남기는 콩 생물', 'quickPower', '변덕', 'trio', 'tiny', '크레용', '부러진 크레용', 'bright'],
  ['소파 밑 먼지장', '소파 밑 먼지를 이끄는 생물', 'quick', '숨음', 'leaderPack', 'small', '먼지', '', 'dark'],
  ['떡잎 방패둥이', '잎을 방패처럼 드는 생물', 'tough', '지킴', 'solo', 'medium', '떡잎', '잎 방패', 'green'],
  ['비린내 안 남', '억울한 표정의 생물', 'odd', '변덕', 'solo', 'small', '바다', '', 'cool'],
  ['긴 그림자떡', '그림자가 먼저 오는 떡 생물', 'quickPower', '툭치기', 'solo', 'medium', '그림자', '', 'dark'],
  ['가위손 아님', '종이 가위를 든 말랑 생물', 'power', '장난', 'solo', 'small', '가위', '종이 가위', 'pale'],
  ['대왕 솜사탕', '크지만 잘 녹는 솜사탕 생물', 'toughQuick', '변덕', 'giant', 'giant', '솜사탕', '', 'bright'],
  ['무거운 미숫가루', '가루인데 이상하게 묵직함', 'toughPower', '버팀', 'solo', 'wide', '미숫가루', '', 'warm'],
  ['빛바랜 별사탕', '색이 바랜 별사탕 생물', 'balanced', '침착', 'trio', 'tiny', '별사탕', '', 'pale'],
  ['그늘 옥수수알', '그늘진 옥수수알 생물', 'quick', '숨음', 'pack', 'crumb', '옥수수', '', 'dark'],
  ['물먹은 종이용', '용 흉내를 내는 종이 생물', 'toughPower', '지킴', 'nested', 'big', '종이용', '젖은 종이날개', 'cool'],
  ['바삭한 척 어묵', '바삭한 척하지만 말랑한 생물', 'power', '돌진', 'solo', 'medium', '어묵', '', 'warm'],
  ['밤눈 말랑대장', '밤눈을 가진 대장 생물', 'balanced', '지킴', 'leaderPack', 'medium', '밤눈', '검은 목수건', 'dark'],
  ['흔들 푸딩둘', '서로 반대로 흔들리는 생물', 'quick', '재기', 'pair', 'small', '푸딩', '', 'bright'],
  ['왕큰 두부벽', '벽처럼 서 있는 두부 생물', 'tough', '버팀', 'giant', 'giant', '두부', '', 'pale'],
  ['깨진 달조각', '달조각을 붙인 말랑 생물', 'quickPower', '툭치기', 'solo', 'small', '달조각', '종이 달조각', 'dark'],
  ['미끄럼 양갱대', '양갱들이 미끄러져 오는 무리', 'quick', '우르르', 'pack', 'tiny', '양갱', '', 'dark'],
  ['푹신 번개빵', '번개 모양을 붙인 빵 생물', 'power', '돌진', 'solo', 'big', '번개빵', '종이 번개', 'bright'],
  ['콩나물 창병', '콩나물을 들고 온 생물', 'quickPower', '돌진', 'trio', 'tiny', '콩나물', '콩나물 창', 'green'],
  ['자정 고무말랑', '자정색으로 튀는 말랑 생물', 'quick', '재기', 'solo', 'medium', '자정', '', 'dark'],
  ['무서운 척 만쥬', '무서운 표정을 그린 만쥬 생물', 'toughPower', '지킴', 'solo', 'medium', '만쥬', '그린 눈썹', 'dark'],
  ['비밀 과자상자', '상자에서 나온 과자 생물', 'odd', '변덕', 'nested', 'big', '상자', '과자 상자', 'warm'],
  ['호박씨 파수꾼', '씨앗들을 지키는 생물', 'toughQuick', '지킴', 'leaderPack', 'small', '호박씨', '', 'autumn'],
  ['푸른 밤방울', '푸른 밤빛 방울 생물', 'quickPower', '침착', 'solo', 'small', '밤방울', '', 'cool'],
  ['그림자 고로케', '그림자가 진한 고로케 생물', 'power', '돌진', 'solo', 'big', '고로케', '', 'dark'],
  ['대왕 보풀덩이', '보풀들이 뭉친 큰 생물', 'tough', '버팀', 'giant', 'giant', '보풀', '', 'pale'],
  ['검은 봉투귀', '검은 봉투를 접은 귀 생물', 'quick', '숨음', 'solo', 'medium', '봉투', '', 'dark'],
  ['나른한 쑥떡', '쑥향이 나는 느긋한 생물', 'balanced', '어슬렁', 'solo', 'medium', '쑥떡', '', 'green'],
  ['젤리 꼬리부대', '꼬리가 먼저 움직이는 무리', 'quickPower', '우르르', 'pack', 'tiny', '젤리꼬리', '', 'bright'],
  ['딱딱한 척 모찌', '딱딱한 척하는 모찌 생물', 'toughPower', '버팀', 'solo', 'big', '모찌', '종이 갑옷', 'pale'],
  ['어둑한 홍시', '어둑하게 물든 홍시 생물', 'tough', '침착', 'solo', 'medium', '홍시', '', 'autumn'],
  ['우르르 완두병', '완두들이 줄지어 돌진함', 'quickPower', '우르르', 'swarm', 'crumb', '완두', '종이 투구', 'green'],
  ['깃털 단팥', '깃털이 붙은 단팥 생물', 'quick', '재기', 'solo', 'small', '깃털', '작은 깃털', 'warm'],
  ['밤바람 밀떡', '밤바람에 흔들리는 밀떡 생물', 'quick', '숨음', 'pair', 'small', '밀떡', '', 'dark'],
  ['거대 말랑반장', '크게 굴러온 반장 생물', 'toughPower', '지킴', 'giant', 'giant', '말랑', '큰 종이 완장', 'warm'],
  ['쭈글 자두콩', '쭈글하지만 빠른 콩 생물', 'quickPower', '변덕', 'solo', 'small', '자두', '', 'bright'],
  ['떨어진 밤별', '밤하늘에서 떨어진 척하는 생물', 'balanced', '침착', 'solo', 'medium', '밤별', '별 조각', 'dark'],
  ['대걸레 먼지떼', '대걸레에서 굴러온 먼지 무리', 'quick', '우르르', 'swarm', 'crumb', '대걸레', '', 'dark'],
  ['묵직한 조랭이', '조랭이처럼 이어진 생물', 'toughPower', '버팀', 'nested', 'wide', '조랭이', '', 'warm'],
  ['차가운 수제비', '차갑게 눌린 수제비 생물', 'tough', '침착', 'solo', 'wide', '수제비', '', 'cool'],
  ['보라 사탕귀', '보라색 귀를 단 사탕 생물', 'quickPower', '장난', 'solo', 'small', '사탕귀', '', 'bright'],
  ['흙감자 호위', '흙감자를 지키는 작은 무리', 'tough', '지킴', 'leaderPack', 'small', '흙감자', '', 'autumn'],
  ['검은잉크 콩떡', '잉크가 묻은 콩떡 생물', 'power', '돌진', 'solo', 'medium', '잉크', '', 'dark'],
  ['비밀 털공', '어디선가 굴러온 털공 생물', 'quick', '숨음', 'solo', 'small', '털공', '', 'dark'],
  ['헐렁 갑옷찹', '갑옷이 헐거운 찹쌀 생물', 'toughPower', '지킴', 'solo', 'big', '찹쌀', '헐렁 갑옷', 'pale'],
  ['작은 북소리말랑', '북소리에 맞춰 뛰는 생물', 'quickPower', '재기', 'trio', 'tiny', '북소리', '작은 북', 'warm'],
  ['대왕 검은찹쌀', '크고 어두운 찹쌀 생물', 'tough', '버팀', 'giant', 'giant', '찹쌀', '', 'dark'],
  ['말린 파도방울', '파도처럼 말린 방울 생물', 'quick', '재기', 'pair', 'small', '파도', '', 'cool'],
  ['삐걱 나무콩', '나무 소리를 내는 콩 생물', 'power', '돌진', 'solo', 'medium', '나무', '나뭇가지 검', 'warm'],
  ['그늘진 카라멜', '그늘에 녹은 카라멜 생물', 'toughQuick', '어슬렁', 'solo', 'wide', '카라멜', '', 'dark'],
  ['이불 속 장군', '이불을 끌고 온 장군 생물', 'tough', '지킴', 'leaderPack', 'big', '이불', '이불 망토', 'warm'],
  ['새까만 콩가루', '까만 콩가루들이 모인 생물', 'quickPower', '우르르', 'swarm', 'crumb', '콩가루', '', 'dark'],
  ['무른 배조각', '무른 배처럼 눌리는 생물', 'balanced', '침착', 'solo', 'medium', '배조각', '', 'pale'],
  ['쫀득한 별그림자', '별 그림자를 붙인 생물', 'quickPower', '툭치기', 'solo', 'small', '별그림자', '', 'dark'],
  ['커다란 밤솜', '밤색으로 물든 큰 솜 생물', 'tough', '버팀', 'giant', 'giant', '솜', '', 'autumn'],
  ['유리조각 아님', '유리인 척하는 말랑 생물', 'quick', '숨음', 'pack', 'crumb', '유리', '종이 조각', 'cool'],
  ['꼬마 깃발떡', '깃발을 들고 떨리는 떡 생물', 'balanced', '지킴', 'solo', 'small', '깃발떡', '작은 깃발', 'warm'],
  ['고요한 진흙알', '진흙처럼 눌리는 알 생물', 'tough', '버팀', 'solo', 'wide', '진흙', '', 'dark'],
  ['밤골목 빵떡', '밤골목에서 굴러온 빵떡 생물', 'power', '돌진', 'solo', 'big', '빵떡', '검은 띠', 'dark'],
  ['마지막 보리알', '끝까지 남는 보리 생물', 'quickPower', '숨음', 'solo', 'tiny', '보리', '', 'dark'],
  ['대왕 냄비푸딩', '냄비를 쓰고 버티는 푸딩 생물', 'toughPower', '지킴', 'giant', 'giant', '푸딩', '냄비 투구', 'warm'],
  ['작은 그림자떼', '그림자처럼 번지는 작은 생물', 'quick', '우르르', 'swarm', 'crumb', '그림자', '', 'dark'],
  ['우두커니 단호박', '서서 버티는 단호박 생물', 'tough', '침착', 'solo', 'big', '단호박', '', 'autumn'],
  ['꼬인 실뭉치왕', '실뭉치들을 데리고 온 생물', 'toughQuick', '지킴', 'leaderPack', 'medium', '실뭉치', '실 왕관', 'pale'],
  ['진한 콩국물', '진하게 흔들리는 콩국물 생물', 'balanced', '어슬렁', 'solo', 'wide', '콩국물', '', 'pale'],
  ['밤색 쫀득발', '발자국이 진한 생물', 'quickPower', '툭치기', 'solo', 'small', '쫀득발', '', 'dark'],
  ['검은 모래만쥬', '검은 모래를 묻힌 만쥬 생물', 'toughPower', '버팀', 'solo', 'big', '모래', '', 'dark'],
  ['낡은 스카프콩', '스카프를 끌고 오는 콩 생물', 'quick', '재기', 'solo', 'small', '스카프', '낡은 스카프', 'pale'],
  ['얼룩진 두유떼', '얼룩진 방울들이 몰려옴', 'quick', '우르르', 'pack', 'tiny', '두유', '', 'dark'],
  ['큰소리 약과', '소리만 큰 약과 생물', 'power', '장난', 'solo', 'medium', '약과', '', 'warm'],
  ['초록 어둠젤', '초록빛 어둠을 단 젤리 생물', 'quickPower', '숨음', 'pair', 'small', '젤리', '', 'dark'],
  ['겹겹 무지개떡', '겹이 많은 무지개떡 생물', 'tough', '버팀', 'nested', 'wide', '무지개떡', '', 'bright'],
  ['깊은 밤쌀', '깊은 밤색 쌀알 생물', 'quick', '우르르', 'swarm', 'crumb', '쌀알', '', 'dark'],
  ['왕관 삐뚤푸딩', '왕관이 삐뚤어진 푸딩 생물', 'balanced', '지킴', 'solo', 'medium', '푸딩', '삐뚤 왕관', 'bright'],
  ['철푸덕 흑임자', '흑임자 점이 많은 생물', 'toughPower', '버팀', 'solo', 'big', '흑임자', '', 'dark'],
  ['매듭 꼬리콩', '꼬리가 매듭진 콩 생물', 'quickPower', '재기', 'solo', 'small', '매듭', '', 'warm'],
  ['어둑한 설기', '하얗지만 어두운 설기 생물', 'tough', '침착', 'solo', 'medium', '설기', '', 'dark'],
  ['공책 귀말랑', '공책 귀퉁이를 단 생물', 'quick', '숨음', 'trio', 'tiny', '공책', '공책 귀', 'pale'],
  ['뒤집힌 종지떡', '종지를 뒤집어쓴 떡 생물', 'tough', '지킴', 'solo', 'medium', '종지', '종지 투구', 'warm'],
  ['거미줄 아님', '실에 엉킨 말랑 생물', 'quick', '변덕', 'pack', 'crumb', '실', '얇은 실', 'dark'],
  ['검붉은 사과콩', '검붉은 빛의 사과콩 생물', 'power', '돌진', 'solo', 'medium', '사과', '', 'dark'],
  ['구석진 별푸딩', '구석에서 빛나는 푸딩 생물', 'balanced', '숨음', 'solo', 'small', '별푸딩', '', 'dark'],
  ['두툼한 떡방패', '몸이 방패처럼 넓은 생물', 'tough', '지킴', 'solo', 'wide', '떡', '', 'warm'],
  ['잔잔한 물젤리', '잔물결처럼 움직이는 생물', 'quick', '침착', 'pair', 'small', '물젤리', '', 'cool'],
  ['바닥 밑 대장', '바닥 밑 애들을 이끄는 생물', 'toughPower', '지킴', 'leaderPack', 'medium', '바닥밑', '검은 완장', 'dark'],
  ['달콤한 독설탕', '독한 척하는 설탕 생물', 'quickPower', '툭치기', 'swarm', 'crumb', '설탕', '', 'dark'],
  ['커다란 누룽벽', '누룽지처럼 넓은 벽 생물', 'tough', '버팀', 'giant', 'giant', '누룽지', '', 'warm'],
  ['밤잎 방랑자', '밤잎을 뒤집어쓴 생물', 'quick', '숨음', 'solo', 'medium', '밤잎', '밤잎 망토', 'dark'],
  ['코코아 먼지단', '코코아빛 먼지들이 몰려옴', 'quickPower', '우르르', 'pack', 'crumb', '코코아', '', 'dark'],
  ['나사못 모자콩', '나사못 모자를 쓴 콩 생물', 'power', '돌진', 'solo', 'small', '나사못', '나사못 모자', 'pale'],
  ['큰눈 그림자찹', '큰눈이 어두운 찹쌀 생물', 'balanced', '침착', 'solo', 'medium', '그림자찹', '', 'dark'],
  ['얇은 오징어떡', '길게 늘어지는 떡 생물', 'quickPower', '변덕', 'solo', 'tall', '오징어떡', '', 'cool'],
  ['단단한 척 식빵', '식빵 껍질을 믿는 생물', 'toughPower', '버팀', 'solo', 'big', '식빵', '', 'warm'],
  ['검은콩 쌍둥이', '둘이 동시에 피하는 생물', 'quick', '툭치기', 'pair', 'small', '검은콩', '', 'dark'],
  ['오래된 카스테라왕', '낡은 종이 왕관을 쓴 생물', 'toughPower', '지킴', 'giant', 'giant', '카스테라', '낡은 종이 왕관', 'warm'],
  ['물풀 꼬리대', '물풀 꼬리가 흔들리는 무리', 'quick', '우르르', 'pack', 'tiny', '물풀', '', 'green'],
  ['은근한 밤양갱', '조용히 밀고 오는 양갱 생물', 'power', '침착', 'solo', 'medium', '밤양갱', '', 'dark'],
  ['조각난 쿠션솜', '쿠션에서 나온 솜 생물', 'toughQuick', '재기', 'pack', 'crumb', '쿠션솜', '', 'pale'],
  ['딱밤 장군콩', '딱밤을 준비하는 콩 생물', 'power', '돌진', 'leaderPack', 'small', '딱밤', '종이 완장', 'warm'],
  ['검은비 방울', '검은 비처럼 떨어진 생물', 'quickPower', '숨음', 'trio', 'tiny', '검은비', '', 'dark'],
  ['대왕 조용이', '큰데 아무 말 없는 생물', 'tough', '침착', 'giant', 'giant', '조용이', '', 'dark'],
  ['말랑한 가시밤', '가시를 그린 밤 생물', 'toughPower', '지킴', 'solo', 'medium', '가시밤', '그린 가시', 'autumn'],
];

function opponentHash(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function opponentRound(value) {
  return Math.round(value * 100) / 100;
}

function opponentClamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function opponentParticle(text) {
  const code = text.charCodeAt(text.length - 1) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0 ? '이' : '가';
}

function opponentStats(tierIndex, slotIndex, build, seed) {
  const tier = OPPONENT_TIERS[tierIndex];
  const weights = OPPONENT_BUILD_WEIGHTS[build] || OPPONENT_BUILD_WEIGHTS.balanced;
  const progress = slotIndex / 29;
  const base = tier.base + progress * 0.28;
  const jitter = ((seed % 17) - 8) * 0.012;
  return {
    tough: opponentRound(opponentClamp(base * weights.tough + jitter, 0.1, 5)),
    quick: opponentRound(opponentClamp(base * weights.quick - jitter, 0.1, 5)),
    power: opponentRound(opponentClamp(base * weights.power + jitter * 0.5, 0.1, 5)),
  };
}

function opponentPowerCoeff(tierIndex, slotIndex, stats) {
  const statMean = (stats.tough + stats.quick + stats.power) / 3;
  return opponentRound(tierIndex * 0.28 + slotIndex * 0.006 + statMean * 0.12);
}

function opponentLines(name, personality) {
  const lines = OPPONENT_LINES[personality] || OPPONENT_LINES.침착;
  return {
    intro: `${name}${opponentParticle(name)} ${lines.intro}`,
    winLine: lines.winLine,
    loseLine: lines.loseLine,
  };
}

function opponentTags(build, formation, scale, tone, accessory) {
  return [build, formation, scale, tone].concat(accessory ? ['accessory'] : []);
}

function buildOpponentRoster() {
  return OPPONENT_CONCEPTS.map((concept, index) => {
    const [
      name,
      conceptLine,
      build,
      behavior,
      formation,
      scale,
      motif,
      accessory,
      tone,
    ] = concept;
    const tierIndex = Math.floor(index / 30);
    const slotIndex = index % 30;
    const seed = opponentHash(`${index + 1}:${name}:${motif}`);
    const stats = opponentStats(tierIndex, slotIndex, build, seed);
    const personality = OPPONENT_PERSONALITY_FALLBACK[behavior] || '침착';
    const lines = opponentLines(name, personality);
    return {
      id: `foe-${String(index + 1).padStart(3, '0')}`,
      number: index + 1,
      name,
      concept: conceptLine,
      tier: OPPONENT_TIERS[tierIndex].id,
      tierName: OPPONENT_TIERS[tierIndex].name,
      seed,
      personality,
      behavior,
      build,
      stats,
      statMeaning: OPPONENT_STAT_MEANING,
      powerCoeff: opponentPowerCoeff(tierIndex, slotIndex, stats),
      formation,
      formationLabel: OPPONENT_FORMATIONS[formation].label,
      unitCount: OPPONENT_FORMATIONS[formation].unitCount,
      scale,
      renderScale: OPPONENT_SCALE_VALUES[scale],
      motif,
      accessory,
      tone,
      intro: lines.intro,
      winLine: lines.winLine,
      loseLine: lines.loseLine,
      tags: opponentTags(build, formation, scale, tone, accessory),
    };
  });
}

const OPPONENT_ROSTER = buildOpponentRoster();

if (typeof globalThis !== 'undefined') {
  globalThis.OPPONENT_FORMATIONS = OPPONENT_FORMATIONS;
  globalThis.OPPONENT_ROSTER = OPPONENT_ROSTER;
  globalThis.OPPONENT_ROSTER_VERSION = OPPONENT_ROSTER_VERSION;
  globalThis.OPPONENT_STAT_MEANING = OPPONENT_STAT_MEANING;
  globalThis.OPPONENT_TIERS = OPPONENT_TIERS;
}

if (typeof module !== 'undefined') {
  module.exports = {
    OPPONENT_FORMATIONS,
    OPPONENT_ROSTER,
    OPPONENT_ROSTER_VERSION,
    OPPONENT_STAT_MEANING,
    OPPONENT_TIERS,
  };
}
