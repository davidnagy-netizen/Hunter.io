import { BRAND } from '@/brand';
import { REVENUE_BANDS } from '@/features/profile/data/revenueBands';

const privacyHref = 'mailto:legal@fundor.hu?subject=Adatkezel%C3%A9si%20t%C3%A1j%C3%A9koztat%C3%B3%20k%C3%A9r%C3%A9se';
const termsHref = 'mailto:legal@fundor.hu?subject=%C3%81SZF%20k%C3%A9r%C3%A9se';
const hu = {
  skipLink: 'Ugrás a tartalomhoz',
  disclaimer: 'A Fundor tájékoztató előszűrést nyújt. Nem minősül hitelközvetítésnek, hitelajánlásnak vagy hatósági döntésnek.',
  nav: {
    brand: BRAND.name, domain: BRAND.domain, label: 'Fő navigáció', menu: 'Menü',
    links: [{ label: 'Pályázatok', href: '#palyazatok' }, { label: 'Hitelek', href: '#hitelek' }, { label: 'Fundor Plus', href: '#fundor-plus' }, { label: 'Rólunk', href: '#rolunk' }],
    login: 'Bejelentkezés', app: 'Alkalmazás megnyitása', register: 'Kezdés ingyen',
  },
  hero: {
    eyebrow: 'Támogatási források hazai vállalkozásoknak',
    title: 'A megfelelő pályázati tőke vállalkozása növekedéséhez',
    lead: 'Cégprofilja alapján előszűrheti a vissza nem térítendő támogatásokat. A kedvezményes hiteleket külön információs kategóriaként kezeljük, nem személyre szabott hitelajánlásként.',
    primary: 'Adószám megadása', secondary: 'Ingyenes előszűrés', microcopy: 'Ingyenes előszűrés • Tudatos adatkezelés', privacy: 'Adatkezelési tájékoztató kérése', privacyHref,
    trustItems: ['Ingyenes előszűrés', 'Néhány percet vesz igénybe', 'Nem jár elköteleződéssel'],
    statusLabel: 'Erős jelölt',
    profileMock: {
      sizeLabel: 'Vállalkozás mérete', sizeValue: 'KKV (10-49 fő)',
      goalLabel: 'Fejlesztési cél', goalValue: 'Technológiai beruházás',
      formLabel: 'Forrástípus', formValue: 'Vissza nem térítendő támogatás',
    },
    preview: 'Szemléltető előnézet, nem valós értékelés', dashboard: 'Finanszírozási áttekintés', brand: BRAND.name,
    grant: 'Vissza nem térítendő támogatás', category: 'Finanszírozási kategória', project: 'Fejlesztési cél', projectValue: 'Technológiai fejlesztés',
    amount: 'Összeg és jogosultság: a felhívás és a cégprofil alapján', score: 'Fundor Score', scoreValue: '87/100', scoreNote: 'Szemléltető pályázati pontszám',
    readiness: 'Fundor Readiness Score', readinessNote: 'A pályázati felkészültség és az adatok teljességének külön értékelése.',
    sources: ['NAV Online Számla', 'KSH TEÁOR’25', 'Hivatalos adatforrások'], sourcesNote: 'Adatforrások és besorolási szabványok, nem partneri ajánlások',
    metrics: {
      matchCount: '12',
      matchLabel: 'Pályázati találat',
      timeEstimate: '3 perc',
      timeLabel: 'Előszűrési idő',
      readinessScore: '92%',
      readinessStatus: 'Adatok teljessége',
    },
  },
  features: {
    eyebrow: '01 / Forrástípusok',
    title: 'A finanszírozás típusa számít', intro: 'Először a feltételeket tisztázza, utána tervezzen forrást.', tablist: 'Finanszírozási funkciók',
    tabs: ['Tőketámogatások', 'Kedvezményes hitelek', 'NAV-integráció'],
    grants: { title: 'A projektjéhez illő feltételek', text: 'A vissza nem térítendő támogatások saját jogosultsági, önerő- és megvalósítási feltételekhez kötöttek. A cégprofil és a projekt célja együtt ad alapot az előszűréshez.', action: 'Ingyenes előszűrés', previewTitle: 'Mit vizsgál az előszűrés?', fields: ['TEÁOR’25 tevékenység', 'Megvalósítás helyszíne', 'Lezárt üzleti évek', 'Árbevétel és önerő'], metric: { value: '10M – 500M Ft', label: 'Támogatási sáv' }, timeline: '3–6 hónap' },
    loans: { title: 'Visszafizetendő forrás, külön értékelés', text: 'A hitel tőkeösszegét vissza kell fizetni. Az előnyt a kamattámogatás és a megtakarított tőkeköltség jelentheti, nem a teljes hitelösszeg.', gate: 'A Kavosz-termékekre vonatkozó hitelajánlás jogi állásfoglalásig nem érhető el.', action: 'A támogatás és hitel különbsége', previewTitle: 'A hitel értelmezése', fields: ['Visszafizetendő tőke', 'Kamattámogatás', 'Tőkeköltség', 'Jogi feltételek'], metric: { value: '0% – 5%', label: 'Kedvezményes kamat' }, timeline: '1–3 hónap' },
    nav: { title: 'Cégadatok hivatalos forrásból', text: 'A regisztráció során külön kérheti a hivatalos cégnév és székhely lekérdezését. Itt csak az adószám helyi ellenőrzését próbálhatja ki.', local: 'Helyi ellenőrzés, nem NAV-lekérdezés', taxLabel: 'Adószám', helper: 'Adja meg a 8 vagy 11 számjegyű adószámot. A bemutató nem küld adatot a NAV-nak.', submit: 'CDV ellenőrzése', required: 'Adja meg az adószámot.', invalid: 'Érvénytelen vagy hiányos adószám.', valid: 'Az ellenőrzőszám megfelelő. A cégadatokat a regisztráció során a NAV ellenőrzi.', sample: 'Minta betöltése', sampleNumber: '12345676', sampleName: 'Minta vállalkozás (illusztráció)', sampleNote: 'Szemléltető mintaadat, nem NAV-válasz', companyLabel: 'Cégnév', companyEmpty: 'A hivatalos név a regisztrációs lekérdezés után jelenik meg.', action: 'Cégadatok lekérése a regisztrációban' },
  },
  stats: { eyebrow: 'Országos forráskatalógus', title: 'Országos áttekintés, helyi feltételek', label: 'Finanszírozási lehetőség a katalógusban', source: 'Forrás: Fundor katalógus', note: 'Katalógusrekordok száma, nem az Ön cégének elérhető pályázatok száma.', loading: 'Katalógusadatok betöltése…', empty: 'A katalógus adatai még nem érhetők el.', error: 'A katalógusadatok nem tölthetők be.', refreshError: 'A frissítés sikertelen. A legutóbb betöltött katalógusadat látható.', retry: 'Újrapróbálás', region: 'Magyarországi fejlesztésénél a területi jogosultság programonként eltér. Az ábra szemléltető hálózat, nem jogosultsági térkép.', regions: ['Budapest & Pest', 'Közép-Magyarország', 'Konvergencia régiók'], highlightStat: '4', highlightLabel: 'Kiemelt finanszírozási régió' },
  entrepreneur: { eyebrow: 'Reálgazdasági fókusz', title: 'Szervezze jövőbeli finanszírozását magabiztosan', text: 'A következő beruházás előtt rendezze cégadatait, és tisztázza projektje célját.', categories: ['Technológiai fejlesztés', 'Zöld átállás', 'Exporttámogatás'], note: 'Szemléltető fejlesztési célok, nem elérhető programok ígéretei.', alt: 'Textilipari munka: kezek és anyag egy varrógépnél.', imageError: 'A kép nem tölthető be.', milestones: [{ label: 'Támogatási keret', value: '250M – 500M Ft' }, { label: 'Pályázati felkészültség', value: '84%' }, { label: 'Határidő', value: '2026. IV. negyedév' }], action: 'Ingyenes előszűrés', registerAction: 'Adószám megadása' },
  value: {
    eyebrow: '02 / Értékelési metodika',
    title: 'Ismerje meg a finanszírozási lehetőségeit',
    items: [
      { title: 'Algoritmikus Fundor Score', text: 'A Fundor Score a támogatás feltételeihez való illeszkedést vizsgálja. A Fundor Readiness Score külön a felkészültséget és az adatok teljességét mutatja. Egyik pontszám sem támogatói döntés.', attributes: [{ label: 'Értékelési alap', value: 'Pályázati feltételrendszer' }, { label: 'Kimenet', value: 'Indikatív pontszám' }] },
      { title: 'TEÁOR’25 szektormegfelelés', text: 'A hivatalos, négyjegyű tevékenységi kódot a felhívás ágazati korlátozásaival vetjük össze. A szektoregyezés önmagában nem jelent jóváhagyást.', attributes: [{ label: 'Szabvány', value: 'Hivatalos KSH TEÁOR’25' }, { label: 'Funkció', value: 'Kizáró feltételek szűrése' }] },
      { title: 'Támogatás és hitel külön', text: 'A támogatás és a visszafizetendő hitel eltérő eszköz. A hitel értékét a kamattámogatás és a tőkeköltség alapján kell mérlegelni, nem támogatásként számolni a tőkeösszeget.', attributes: [{ label: 'Eszköztípus', value: 'Hitel vs. támogatás' }, { label: 'Számítás', value: 'Tőkeköltség megtakarítás' }] },
    ],
    gate: 'A Kavosz-termékekre vonatkozó hitelajánlás jogi állásfoglalásig nem érhető el.',
  },
  quickAction: { eyebrow: '03 / Hivatalos cégadatok', title: 'Kezdje vállalkozása adószámával', text: 'A hivatalos cégnevet és székhelyet a regisztráció során erősítheti meg.', action: 'Adószám megadása', steps: ['Adószám megadása', 'NAV-adatok megerősítése', 'Azonnali előszűrés'] },
  useCases: { eyebrow: '04 / Előszűrési rendszer', title: 'Cégprofilból induló előszűrés', cards: [{ title: 'Induló és mikrovállalkozások', bands: REVENUE_BANDS.slice(0, 2), text: 'A létszám, lezárt évek, jogi forma, ágazat és helyszín együtt számít. Az induló vállalkozás nem automatikusan jogosult vagy kizárt.' }, { title: 'Növekedési fázisban lévő KKV-k', bands: REVENUE_BANDS.slice(2, 5), text: 'A harmadik sáv mikro- és kisvállalati határterület. Az árbevételi sáv önmagában nem igazolja a teljes jogszabályi KKV-minősítést.' }], action: 'Cégprofilos előszűrés', bandsTitle: 'A hat árbevételi sáv', bands: REVENUE_BANDS, bandLabel: 'sáv', large: 'Nagyvállalat, nem KKV', note: 'Ha a felhívás pontos árbevételi határt kér, az árbevételi sáv önmagában nem elegendő. A pontos összeg nélkül további adat szükséges (INSUFFICIENT_DATA).' },
  journey: {
    eyebrow: '05 / Megvalósítási folyamat',
    title: 'Reális felkészülés, ellenőrizhető lépések',
    lead: 'A sikeres pályázati részvétel a jogosultsági feltételek és a pénzügyi mutatók szisztematikus ellenőrzésével kezdődik.',
    alt: 'Mérnöki tervezés és precíziós megvalósítás: hitelesített KKV folyamat.',
    imageError: 'A kép nem tölthető be.',
    badge: 'Hitelesített KKV folyamat',
    steps: [
      {
        num: '01',
        title: 'Hivatalos adószám és TEÁOR ellenőrzés',
        desc: 'NAV Online Számla CDV ellenőrzőszám és hatályos TEÁOR’25 ágazati besorolás ellenőrzése a kizáró okok szűrésére.',
      },
      {
        num: '02',
        title: 'Pénzügyi mutatók és KKV-besorolás',
        desc: 'Lezárt üzleti évek mérlegadatai, létszám és törvényi árbevételi sáv szerinti KKV-minősítés megállapítása.',
      },
      {
        num: '03',
        title: 'Támogatási felhívás és önerő-illesztés',
        desc: 'Tervezett beruházási cél illesztése az aktuális felhívási kerethez és a szükséges saját forrás fedezetéhez.',
      },
    ],
    action: 'Felkészültség ellenőrzése',
  },
  cases: { eyebrow: 'Gyakorlati helyzetek', title: 'Finanszírozási helyzetek', note: 'Szemléltető példák, nem ügyfélbeszámolók', previous: 'Előző példa', next: 'Következő példa', select: 'Példa kiválasztása', empty: 'Nincs megjeleníthető példa.', action: 'Projekt előszűrése', scenarioLabel: 'Esettanulmány', viewAction: 'Forgatókönyv megnyitása', slides: [{ title: 'Technológiai fejlesztés', text: 'Gépbeszerzést tervez? Ellenőrizze az eszköz támogathatóságát, a TEÁOR’25 ágazati feltételeket, az önerőt és a támogatás megvalósítási kötelezettségeit.', category: 'Eszköz és önerő' }, { title: 'Zöld átállás', text: 'Rögzítse az energiahatékonysági célt, a beruházás helyét és méretét. Különítse el a vissza nem térítendő támogatást a visszafizetendő hiteltől.', category: 'Cél és helyszín' }, { title: 'Export előkészítése', text: 'Vizsgálja meg az ágazati feltételeket, a program földrajzi hatályát, az együttműködési követelményeket és a beadási határidőt.', category: 'Piac és határidő' }] },
  plans: { title: 'Előszűrés vagy részletesebb előkészítés', free: 'Ingyenes Alapverzió', plus: `${BRAND.name} Plus`, freeText: 'Cégprofil-alapú tájékozódás a következő döntés előtt.', freeItems: ['Profilalapú előszűrés', 'Összesített és betekintő hozzáférés', 'A teljes katalógusrészletek feloldása nélkül'], freeAction: 'Ingyenes előszűrés', accountAction: 'Cégfiók létrehozása', plusText: 'Részletesebb értékelés és dokumentum-előkészítés.', plusItems: ['Részletes értékelési magyarázatok', 'Katalógushoz kapcsolódó dokumentumlisták', 'Cégprofilból és felhívásból kitöltött pályázatisablon-demó'], plusAction: 'Fundor Plus megnyitása', activation: 'A hozzáférést jelenleg adminisztrátor aktiválja. Online fizetés nem érhető el.', loanPolicy: 'A hitelmodul jogszerű elérhetősége esetén az ingyenes fiókok összesítéseket és kategóriajelöléseket láthatnak; a részletes hitelfeltételekhez Fundor Plus szükséges. A Plus nem oldja fel a Kavosz-termékek jogi korlátozását.' },
  faq: { title: 'Kérdések a kezdés előtt', alt: 'Anyag igazítása varrógépnél, közeli kép a textilipari munkáról.', imageError: 'A kép nem tölthető be.', privacy: 'Adatkezelési tájékoztató kérése', privacyHref, previewTitle: 'Felkészültség áttekintése', previewSubtitle: 'Hivatalos ellenőrzési szempontok', previewItems: ['NAV adószám és alapadatok', 'Lezárt gazdasági év', 'TEÁOR’25 tevékenységi kör', 'Önerő és pénzügyi fedezet'], questions: [{ question: 'Hogyan működik a NAV adószám-alapú lekérdezés?', answer: 'Először a formátumot és a CDV ellenőrzőszámot ellenőrizzük. A regisztrációban külön indítható lekérdezés után a hivatalos cégnév és székhely csak olvasható megerősítésként jelenik meg. Szolgáltatáshiba esetén hibajelzést és újrapróbálási lehetőséget kap. A nyitóoldali bemutató csak helyi ellenőrzés, nem kapcsolódik a NAV-hoz.', privacyLink: false }, { question: 'Miben különbözik a vissza nem térítendő támogatás a kedvezményes hiteltől?', answer: 'A támogatás saját feltételeinek teljesítése mellett általában nem kell visszafizetni a tőkét. A hitel tőkéje visszafizetendő, előnye nem a teljes tőkeösszeg. Az előszűrés nem hitelajánlás; a Kavosz-termékekre vonatkozó hitelajánlás jogi állásfoglalásig nem érhető el.', privacyLink: false }, { question: 'Mit tartalmaz a Fundor Plus előfizetés?', answer: 'Részletes értékelési magyarázatokat, dokumentumlistákat és pályázatisablon-demót. A hozzáférést jelenleg adminisztrátor aktiválja, nincs online fizetés. A sablonbemutató nem személyre szabott, mesterséges intelligenciával készített pályázat.', privacyLink: false }, { question: 'Biztonságban vannak a cégem adatai?', answer: 'A regisztráció külön kezeli az ÁSZF és az adatkezelési tájékoztató elfogadását, a marketinghozzájárulás opcionális. E-mail-megerősítés, adatexport és fióktörlés áll rendelkezésre. Az egyéni vállalkozók adatai személyes adatként különös figyelmet igényelnek. A részletes adatkezelési dokumentumot e-mailben kérheti.', privacyLink: true }] },
  footer: { brand: BRAND.name, domain: BRAND.domain, brandTitle: 'Fundor Platform', productTitle: 'Előszűrés és értékelés', links: [{ label: 'Pályázatok', href: '#palyazatok' }, { label: 'Hitelek', href: '#hitelek' }, { label: 'Fundor Plus', href: '#fundor-plus' }, { label: 'Ingyenes előszűrés', href: '/assess' }], legalTitle: 'Jogi dokumentumok', terms: 'ÁSZF kérése', termsHref, privacy: 'Adatkezelési tájékoztató kérése', privacyHref, contactTitle: 'Jogi és dokumentumkapcsolat', email: 'legal@fundor.hu', copyright: '© 2026 Fundor.hu. Minden jog fenntartva.' },
};

const en: typeof hu = {
  skipLink: 'Skip to content',
  disclaimer: 'Fundor provides informational pre-screening. It is not credit intermediation, a credit recommendation or an official decision.',
  nav: { brand: BRAND.name, domain: BRAND.domain, label: 'Main navigation', menu: 'Menu', links: [{ label: 'Grants', href: '#palyazatok' }, { label: 'Loans', href: '#hitelek' }, { label: 'Fundor Plus', href: '#fundor-plus' }, { label: 'About', href: '#rolunk' }], login: 'Sign in', app: 'Open the application', register: 'Start for free' },
  hero: {
    eyebrow: 'Grant funding for European SMEs',
    title: 'The right grant funding for your business to grow',
    lead: 'Pre-screen non-repayable grants using your company profile. Subsidised loans are a separate information category, not personalised credit recommendations.',
    primary: 'Enter tax number', secondary: 'Free pre-screening', microcopy: 'Free pre-screening • Considered data handling', privacy: 'Request the privacy notice', privacyHref,
    trustItems: ['Free pre-screening', 'Takes only a few minutes', 'No commitment required'],
    statusLabel: 'Strong candidate',
    profileMock: {
      sizeLabel: 'Company size', sizeValue: 'SME (10-49 staff)',
      goalLabel: 'Development goal', goalValue: 'Technology investment',
      formLabel: 'Funding instrument', formValue: 'Non-repayable grant',
    },
    preview: 'Illustrative preview, not an actual evaluation', dashboard: 'Funding overview', brand: BRAND.name,
    grant: 'Non-repayable grant', category: 'Funding category', project: 'Development goal', projectValue: 'Technology investment',
    amount: 'Amount and eligibility depend on the call and company profile', score: 'Fundor Score', scoreValue: '87/100', scoreNote: 'Illustrative grant score',
    readiness: 'Fundor Readiness Score', readinessNote: 'A separate evaluation of application readiness and data completeness.',
    sources: ['NAV Online Invoice', 'KSH TEÁOR’25', 'Official data sources'], sourcesNote: 'Data sources and classification standards, not partner endorsements',
    metrics: {
      matchCount: '12',
      matchLabel: 'Funding matches',
      timeEstimate: '3 min',
      timeLabel: 'Estimated screening',
      readinessScore: '92%',
      readinessStatus: 'Data completeness',
    },
  },
  features: {
    eyebrow: '01 / Funding instruments',
    title: 'The funding instrument matters', intro: 'Understand the conditions before planning your funding.', tablist: 'Funding features',
    tabs: ['Capital grants', 'Subsidised loans', 'NAV integration'],
    grants: { title: 'Conditions that fit your project', text: 'Non-repayable grants carry their own eligibility, own-contribution and delivery conditions. Your company profile and project goals together inform pre-screening.', action: 'Free pre-screening', previewTitle: 'What does pre-screening check?', fields: ['TEÁOR’25 activity', 'Project location', 'Closed business years', 'Revenue and own contribution'], metric: { value: '€25k – €1.2M', label: 'Typical funding' }, timeline: '3–6 months' },
    loans: { title: 'Repayable funding, assessed separately', text: 'Loan principal must be repaid. The benefit may come from interest subsidy and saved capital cost, not the full loan amount.', gate: 'Credit recommendations for Kavosz products are unavailable pending a legal opinion.', action: 'Grant and loan differences', previewTitle: 'Understanding a loan', fields: ['Repayable principal', 'Interest subsidy', 'Cost of capital', 'Legal conditions'], metric: { value: '0% – 5%', label: 'Subsidised rate' }, timeline: '1–3 months' },
    nav: { title: 'Company details from official sources', text: 'During registration, explicitly request the official company name and registered address. This demo only checks the tax number locally.', local: 'Local validation, not a NAV query', taxLabel: 'Tax number', helper: 'Enter the 8 or 11 digit tax number. This demo does not send data to NAV.', submit: 'Check CDV', required: 'Enter your tax number.', invalid: 'Invalid or incomplete tax number.', valid: 'The check digit is valid. NAV checks company details during registration.', sample: 'Load sample', sampleNumber: '12345676', sampleName: 'Sample business (illustration)', sampleNote: 'Illustrative sample data, not a NAV response', companyLabel: 'Company name', companyEmpty: 'The official name appears after the registration lookup.', action: 'Look up company details in registration' },
  },
  stats: { eyebrow: 'National funding directory', title: 'National overview, local conditions', label: 'Funding opportunities in the catalogue', source: 'Source: Fundor catalogue', note: 'Catalogue records, not the number of grants your company qualifies for.', loading: 'Loading catalogue data…', empty: 'Catalogue data is not available yet.', error: 'Catalogue data could not be loaded.', refreshError: 'Refresh failed. The last loaded catalogue data is shown.', retry: 'Retry', region: 'Regional eligibility for Hungarian projects varies by programme. This illustrative network is not an eligibility map.', regions: ['Budapest & Pest', 'Central Hungary', 'Convergence regions'], highlightStat: '4', highlightLabel: 'Priority funding regions' },
  entrepreneur: { eyebrow: 'Real economy focus', title: 'Plan your future funding with confidence', text: 'Before your next investment, organise your company data and define your project goal.', categories: ['Technology investment', 'Green transition', 'Export support'], note: 'Illustrative development goals, not promises of available programmes.', alt: 'Textilipari munka: kezek és anyag egy varrógépnél.', imageError: 'The image could not be loaded.', milestones: [{ label: 'Funding envelope', value: '€250k – €500k' }, { label: 'Application readiness', value: '84%' }, { label: 'Deadline', value: 'Q4 2026' }], action: 'Free pre-screening', registerAction: 'Enter tax number' },
  value: {
    eyebrow: '02 / Evaluation methodology',
    title: 'Understand your funding options',
    items: [
      { title: 'Algorithmic Fundor Score', text: 'Fundor Score examines fit with grant conditions. Fundor Readiness Score separately indicates readiness and data completeness. Neither score is an award decision.', attributes: [{ label: 'Assessment basis', value: 'Call criteria match' }, { label: 'Output', value: 'Indicative score' }] },
      { title: 'TEÁOR’25 sector fit', text: 'We compare the official four-digit activity code with programme-specific sector restrictions. A sector match alone does not mean approval.', attributes: [{ label: 'Standard', value: 'Official KSH TEÁOR’25' }, { label: 'Function', value: 'Exclusion filtering' }] },
      { title: 'Grants and loans kept separate', text: 'Grants and repayable loans are different instruments. Assess a loan through its interest subsidy and capital cost, rather than counting its principal as a grant award.', attributes: [{ label: 'Instrument', value: 'Loan vs grant' }, { label: 'Evaluation', value: 'Capital cost savings' }] },
    ],
    gate: 'Credit recommendations for Kavosz products are unavailable pending a legal opinion.',
  },
  quickAction: { eyebrow: '03 / Official business lookup', title: 'Start with your business tax number', text: 'Confirm your official company name and registered address during registration.', action: 'Enter tax number', steps: ['Tax number entry', 'NAV data verification', 'Instant pre-screening'] },
  useCases: { eyebrow: '04 / Pre-screening system', title: 'Pre-screening starts with your company profile', cards: [{ title: 'Startups and microbusinesses', bands: REVENUE_BANDS.slice(0, 2), text: 'Headcount, closed years, legal form, sector and location all matter. Startups are neither automatically eligible nor automatically excluded.' }, { title: 'Growing SMEs', bands: REVENUE_BANDS.slice(2, 5), text: 'Band three spans the micro/small boundary. A revenue band alone does not establish full statutory SME classification.' }], action: 'Pre-screen your company', bandsTitle: 'The six revenue bands', bands: REVENUE_BANDS, bandLabel: 'band', large: 'Large enterprise, not an SME', note: 'If a call requires an exact revenue threshold, a revenue band alone is not enough. Without the exact amount, further information is required (INSUFFICIENT_DATA).' },
  journey: {
    eyebrow: '05 / Delivery process',
    title: 'Real-world preparation, verifiable milestones',
    lead: 'Successful grant application begins with systematic verification of statutory eligibility and financial metrics.',
    alt: 'Engineering precision and manufacturing: verified SME planning workflow.',
    imageError: 'The image could not be loaded.',
    badge: 'Verified SME process',
    steps: [
      {
        num: '01',
        title: 'Official tax number & TEÁOR check',
        desc: 'NAV Online Invoice CDV check digit and statutory TEÁOR’25 sector classification check to screen exclusion criteria.',
      },
      {
        num: '02',
        title: 'Financial metrics & SME classification',
        desc: 'Closed fiscal years, headcount and statutory revenue band calculation to determine formal SME status.',
      },
      {
        num: '03',
        title: 'Call criteria & own contribution match',
        desc: 'Matching project objectives against published grant envelopes and required own equity contribution ratios.',
      },
    ],
    action: 'Check readiness',
  },
  cases: { eyebrow: 'Practical scenarios', title: 'Funding scenarios', note: 'Illustrative examples, not customer testimonials', previous: 'Previous example', next: 'Next example', select: 'Select example', empty: 'No examples to display.', action: 'Pre-screen your project', scenarioLabel: 'Scenario', viewAction: 'View scenario', slides: [{ title: 'Technology investment', text: 'Planning equipment purchases? Check eligible equipment, TEÁOR’25 sector conditions, own contribution and grant delivery obligations.', category: 'Equipment and own contribution' }, { title: 'Green transition', text: 'Record the energy-efficiency goal, investment location and scale. Distinguish non-repayable grants from repayable loans.', category: 'Goal and location' }, { title: 'Preparing to export', text: 'Check sector conditions, programme geography, cooperation requirements and closing dates.', category: 'Market and deadline' }] },
  plans: { title: 'Pre-screening or more detailed preparation', free: 'Free Basic', plus: `${BRAND.name} Plus`, freeText: 'Company-profile-based information before your next decision.', freeItems: ['Profile-based pre-screening', 'Aggregate and teaser access', 'Without unlocking full catalogue details'], freeAction: 'Free pre-screening', accountAction: 'Create a company account', plusText: 'Detailed evaluation and document preparation.', plusItems: ['Detailed evaluation explanations', 'Catalogue document checklists', 'Proposal-template demo populated from profile and call data'], plusAction: 'Open Fundor Plus', activation: 'Access is currently activated by an administrator. Online payment is not available.', loanPolicy: 'When the loan module is legally available, free accounts may see aggregates and category badges; detailed loan terms require Fundor Plus. Plus does not remove the legal gate for Kavosz products.' },
  faq: { title: 'Questions before you start', alt: 'Adjusting fabric at a sewing machine, a close-up of textile work.', imageError: 'The image could not be loaded.', privacy: 'Request the privacy notice', privacyHref, previewTitle: 'Readiness overview', previewSubtitle: 'Official verification criteria', previewItems: ['NAV tax number and basic details', 'Closed financial year', 'TEÁOR’25 activity sector', 'Own contribution and financial backing'], questions: [{ question: 'How does the NAV tax-number lookup work?', answer: 'Format and CDV check-digit validation come first. An explicit lookup during registration returns the official company name and registered address for read-only confirmation. Service failures show an error and allow retry. The landing demo only validates locally and does not contact NAV.', privacyLink: false }, { question: 'How is a non-repayable grant different from a subsidised loan?', answer: 'Grant principal normally does not need to be repaid if its conditions are met. Loan principal must be repaid; its benefit is not the full principal amount. Pre-screening is not a credit recommendation. Kavosz credit recommendations remain unavailable pending a legal opinion.', privacyLink: false }, { question: 'What does Fundor Plus include?', answer: 'Detailed evaluation explanations, document checklists and a proposal-template demo. Access is currently administrator-activated, with no online payment. The template demo is not an individually AI-written application.', privacyLink: false }, { question: 'How is my company data handled?', answer: 'Registration uses separate terms and privacy acknowledgements; marketing consent is optional. Email verification, data export and account erasure are available. Sole-proprietor data requires particular care as personal data. Request the detailed privacy document by email.', privacyLink: true }] },
  footer: { brand: BRAND.name, domain: BRAND.domain, brandTitle: 'Fundor Platform', productTitle: 'Pre-screening and evaluation', links: [{ label: 'Grants', href: '#palyazatok' }, { label: 'Loans', href: '#hitelek' }, { label: 'Fundor Plus', href: '#fundor-plus' }, { label: 'Free pre-screening', href: '/assess' }], legalTitle: 'Legal documents', terms: 'Request the terms', termsHref, privacy: 'Request the privacy notice', privacyHref, contactTitle: 'Legal and document contact', email: 'legal@fundor.hu', copyright: '© 2026 Fundor.hu. All rights reserved.' },
};

export const landingContent = { hu, en };
export type LandingCopy = typeof hu;
