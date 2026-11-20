/* POLINATOR — static research data.
   Live FX comes from the network at runtime (see app.js). Everything here is
   sourced research or a clearly labelled estimate. */

var POL = (window.POL = {});

/* ---------- Countries: currency, macro region, 12m inflation estimate ---------- */
/* infl = estimated 12-month CPI (%). Used to turn nominal FX moves into real ones.
   Turkey 29.8 (TurkStat, Oct 2026) and Argentina 33.1 (INDEC via BBVA Research, Oct 2026)
   are reported figures; the rest are rounded estimates. */
POL.US_INFL = 3.0;
POL.countries = {
  MX: { name: "México", cur: "MXN", infl: 3.8 },
  BS: { name: "Bahamas", cur: "BSD", infl: 2.0, peg: true },
  IT: { name: "Itália", cur: "EUR", infl: 2.1 },
  GB: { name: "Reino Unido", cur: "GBP", infl: 3.4 },
  JP: { name: "Japão", cur: "JPY", infl: 2.5 },
  CA: { name: "Canadá", cur: "CAD", infl: 2.4 },
  FR: { name: "França", cur: "EUR", infl: 2.1 },
  DE: { name: "Alemanha", cur: "EUR", infl: 2.1 },
  ES: { name: "Espanha", cur: "EUR", infl: 2.1 },
  IL: { name: "Israel", cur: "ILS", infl: 2.6 },
  AU: { name: "Austrália", cur: "AUD", infl: 3.2 },
  GR: { name: "Grécia", cur: "EUR", infl: 2.1 },
  PT: { name: "Portugal", cur: "EUR", infl: 2.1 },
  HR: { name: "Croácia", cur: "EUR", infl: 2.1 },
  BG: { name: "Bulgária", cur: "EUR", infl: 3.5 },
  CZ: { name: "Tchéquia", cur: "CZK", infl: 2.6 },
  HU: { name: "Hungria", cur: "HUF", infl: 4.3 },
  PL: { name: "Polônia", cur: "PLN", infl: 3.5 },
  TR: { name: "Turquia", cur: "TRY", infl: 29.8 },
  IS: { name: "Islândia", cur: "ISK", infl: 4.0 },
  SE: { name: "Suécia", cur: "SEK", infl: 1.5 },
  GE: { name: "Geórgia", cur: "GEL", infl: 3.5 },
  CO: { name: "Colômbia", cur: "COP", infl: 5.0 },
  AR: { name: "Argentina", cur: "ARS", infl: 33.1 },
  BR: { name: "Brasil", cur: "BRL", infl: 4.8 },
  PE: { name: "Peru", cur: "PEN", infl: 2.2 },
  CL: { name: "Chile", cur: "CLP", infl: 3.8 },
  CR: { name: "Costa Rica", cur: "CRC", infl: 1.5 },
  DO: { name: "Rep. Dominicana", cur: "DOP", infl: 3.7 },
  UY: { name: "Uruguai", cur: "UYU", infl: 4.5 },
  GT: { name: "Guatemala", cur: "GTQ", infl: 3.0 },
  PA: { name: "Panamá", cur: "USD", infl: 1.5, peg: true },
  BZ: { name: "Belize", cur: "BZD", infl: 2.5, peg: true },
  SX: { name: "Sint Maarten", cur: "XCG", infl: 2.5, peg: true },
  KR: { name: "Coreia do Sul", cur: "KRW", infl: 2.2 },
  TH: { name: "Tailândia", cur: "THB", infl: 0.5 },
  VN: { name: "Vietnã", cur: "VND", infl: 3.3 },
  ID: { name: "Indonésia", cur: "IDR", infl: 2.5 },
  PH: { name: "Filipinas", cur: "PHP", infl: 2.0 },
  MY: { name: "Malásia", cur: "MYR", infl: 1.5 },
  TW: { name: "Taiwan", cur: "TWD", infl: 1.6 },
  IN: { name: "Índia", cur: "INR", infl: 3.0 },
  LK: { name: "Sri Lanka", cur: "LKR", infl: 2.5 },
  MV: { name: "Maldivas", cur: "MVR", infl: 2.5, peg: true },
  EG: { name: "Egito", cur: "EGP", infl: 14.0 },
  MA: { name: "Marrocos", cur: "MAD", infl: 1.5 },
  ZA: { name: "África do Sul", cur: "ZAR", infl: 3.5 },
  KE: { name: "Quênia", cur: "KES", infl: 4.5 },
  AE: { name: "Emirados", cur: "AED", infl: 2.0, peg: true },
  NZ: { name: "Nova Zelândia", cur: "NZD", infl: 2.8 },
};

/* ---------- Cities ----------
   cost = estimated traveller cost index (hotel + food + local transport), NYC = 100,
          at November 2025 exchange rates. Adjusted live by the real FX move.
   hype = 0–3, how many fresh survey / search-trend lists name the place (see POL.signals). */
POL.cities = [
  // Américas
  { id: "cdmx", city: "Cidade do México", cc: "MX", region: "americas", cost: 38, hype: 3, why: "Nº 2 em tendência no Google Flights (verão 2026) e destino internacional mais reservado no eDreams" },
  { id: "cancun", city: "Cancún", cc: "MX", region: "americas", cost: 44, hype: 2, why: "Top 5 nas buscas antecipadas para 2027 (eDreams) e líder no Thanksgiving" },
  { id: "gdl", city: "Guadalajara", cc: "MX", region: "americas", cost: 33, hype: 1, why: "2º destino internacional mais reservado por americanos em 2026 (eDreams)" },
  { id: "nassau", city: "Nassau", cc: "BS", region: "americas", cost: 86, hype: 1, why: "Destino nº 1 em 10 estados (InsureMyTrip)" },
  { id: "bogota", city: "Bogotá", cc: "CO", region: "americas", cost: 28, hype: 0 },
  { id: "medellin", city: "Medellín", cc: "CO", region: "americas", cost: 28, hype: 0 },
  { id: "cartagena", city: "Cartagena", cc: "CO", region: "americas", cost: 33, hype: 0 },
  { id: "bsas", city: "Buenos Aires", cc: "AR", region: "americas", cost: 40, hype: 0 },
  { id: "rio", city: "Rio de Janeiro", cc: "BR", region: "americas", cost: 31, hype: 2, why: "Nº 3 em tendência para Natal e Réveillon 2026 (Google Flights)" },
  { id: "floripa", city: "Florianópolis", cc: "BR", region: "americas", cost: 30, hype: 0 },
  { id: "lima", city: "Lima", cc: "PE", region: "americas", cost: 32, hype: 0 },
  { id: "cusco", city: "Cusco", cc: "PE", region: "americas", cost: 30, hype: 0 },
  { id: "santiago", city: "Santiago", cc: "CL", region: "americas", cost: 40, hype: 0 },
  { id: "sanjose", city: "San José", cc: "CR", region: "americas", cost: 48, hype: 2, why: "Costa Rica é o destino nº 1 dos planos de 2026 por estado (Nomad eSIM)" },
  { id: "puntacana", city: "Punta Cana", cc: "DO", region: "americas", cost: 46, hype: 2, why: "Rep. Dominicana em alta no Kayak (verão 2026) e Santiago (RD) no top 10 do Google" },
  { id: "montevideo", city: "Montevidéu", cc: "UY", region: "americas", cost: 52, hype: 0 },
  { id: "guate", city: "Cidade da Guatemala", cc: "GT", region: "americas", cost: 36, hype: 2, why: "Nº 5 em tendência para as festas de 2026 (Google Flights)" },
  { id: "panama", city: "Cidade do Panamá", cc: "PA", region: "americas", cost: 46, hype: 1, why: "Top 10 de tendência no verão 2026 (Google Flights)" },
  { id: "belize", city: "Ambergris Caye", cc: "BZ", region: "americas", cost: 66, hype: 1, why: "Belize é o 5º no ranking de planos para 2026 (Nomad eSIM)" },
  { id: "sxm", city: "Philipsburg", cc: "SX", region: "americas", cost: 80, hype: 2, why: "Nº 1 em tendência no verão 2026 (Google Flights)" },
  { id: "quebec", city: "Cidade de Québec", cc: "CA", region: "americas", cost: 62, hype: 2, why: "Nº 2 em tendência para Natal e Réveillon 2026 (Google Flights)" },
  { id: "montreal", city: "Montreal", cc: "CA", region: "americas", cost: 63, hype: 0 },
  // Europa
  { id: "lisboa", city: "Lisboa", cc: "PT", region: "europa", cost: 52, hype: 0 },
  { id: "porto", city: "Porto", cc: "PT", region: "europa", cost: 46, hype: 0 },
  { id: "atenas", city: "Atenas", cc: "GR", region: "europa", cost: 52, hype: 3, why: "Nº 1 em tendência para Natal e Réveillon 2026 (Google Flights); Grécia é 3ª na Nomad eSIM" },
  { id: "roma", city: "Roma", cc: "IT", region: "europa", cost: 65, hype: 3, why: "Roma no top 5 internacional das buscas para 2027 (eDreams); Itália é nº 1 em 6 estados" },
  { id: "paris", city: "Paris", cc: "FR", region: "europa", cost: 76, hype: 3, why: "Nº 3 nas buscas para 2027 (eDreams)" },
  { id: "londres", city: "Londres", cc: "GB", region: "europa", cost: 82, hype: 2, why: "Nº 2 nas buscas para 2027 (eDreams)" },
  { id: "barcelona", city: "Barcelona", cc: "ES", region: "europa", cost: 61, hype: 0 },
  { id: "palma", city: "Palma de Mallorca", cc: "ES", region: "europa", cost: 63, hype: 2, why: "Nº 4 em tendência no verão 2026 (Google Flights)" },
  { id: "berlim", city: "Berlim", cc: "DE", region: "europa", cost: 63, hype: 0 },
  { id: "praga", city: "Praga", cc: "CZ", region: "europa", cost: 52, hype: 2, why: "Buscas por voos à Tchéquia +180% (Kayak, previsão 2026)" },
  { id: "budapeste", city: "Budapeste", cc: "HU", region: "europa", cost: 45, hype: 2, why: "Nº 5 em tendência no verão 2026 (Google Flights)" },
  { id: "cracovia", city: "Cracóvia", cc: "PL", region: "europa", cost: 40, hype: 0 },
  { id: "istambul", city: "Istambul", cc: "TR", region: "europa", cost: 40, hype: 0 },
  { id: "reykjavik", city: "Reykjavík", cc: "IS", region: "europa", cost: 96, hype: 2, why: "Islândia é 4ª na Nomad eSIM; aurora boreal lidera a lista de desejos (Icelandair)" },
  { id: "estocolmo", city: "Estocolmo", cc: "SE", region: "europa", cost: 70, hype: 2, why: "Nº 3 em tendência no verão 2026 (Google Flights)" },
  { id: "dubrovnik", city: "Dubrovnik", cc: "HR", region: "europa", cost: 60, hype: 1, why: "Top 10 de tendência no verão 2026 (Google Flights)" },
  { id: "sofia", city: "Sófia", cc: "BG", region: "europa", cost: 40, hype: 0 },
  { id: "tbilisi", city: "Tbilisi", cc: "GE", region: "europa", cost: 30, hype: 0 },
  // Ásia
  { id: "toquio", city: "Tóquio", cc: "JP", region: "asia", cost: 57, hype: 3, why: "Nº 1 nas buscas para 2027 (eDreams) e 6º destino mais buscado de 2026" },
  { id: "osaka", city: "Osaka", cc: "JP", region: "asia", cost: 52, hype: 1 },
  { id: "seul", city: "Seul", cc: "KR", region: "asia", cost: 68, hype: 1, why: "Top 15 nas buscas para 2027 (eDreams)" },
  { id: "bangkok", city: "Bangkok", cc: "TH", region: "asia", cost: 40, hype: 2, why: "Top 10 nas buscas para 2027 (eDreams)" },
  { id: "chiangmai", city: "Chiang Mai", cc: "TH", region: "asia", cost: 31, hype: 0 },
  { id: "hanoi", city: "Hanói", cc: "VN", region: "asia", cost: 28, hype: 2, why: "Nº 4 em tendência para as festas de 2026 (Google Flights)" },
  { id: "hcmc", city: "Ho Chi Minh", cc: "VN", region: "asia", cost: 29, hype: 1, why: "Top 15 nas buscas para 2027 (eDreams)" },
  { id: "bali", city: "Bali", cc: "ID", region: "asia", cost: 31, hype: 0 },
  { id: "manila", city: "Manila", cc: "PH", region: "asia", cost: 33, hype: 1, why: "Top 12 nas buscas para 2027 (eDreams)" },
  { id: "kl", city: "Kuala Lumpur", cc: "MY", region: "asia", cost: 34, hype: 0 },
  { id: "taipei", city: "Taipé", cc: "TW", region: "asia", cost: 55, hype: 0 },
  { id: "jaipur", city: "Jaipur", cc: "IN", region: "asia", cost: 22, hype: 0 },
  { id: "colombo", city: "Colombo", cc: "LK", region: "asia", cost: 30, hype: 0 },
  { id: "male", city: "Malé", cc: "MV", region: "asia", cost: 95, hype: 2, why: "Maldivas é 2ª no ranking de planos para 2026 (Nomad eSIM)" },
  // África e Oriente Médio
  { id: "cairo", city: "Cairo", cc: "EG", region: "africa", cost: 22, hype: 0 },
  { id: "marrakech", city: "Marrakech", cc: "MA", region: "africa", cost: 30, hype: 1, why: "Marrocos em alta nas buscas do Kayak (verão 2026)" },
  { id: "capetown", city: "Cidade do Cabo", cc: "ZA", region: "africa", cost: 38, hype: 0 },
  { id: "nairobi", city: "Nairóbi", cc: "KE", region: "africa", cost: 35, hype: 0 },
  { id: "dubai", city: "Dubai", cc: "AE", region: "africa", cost: 68, hype: 0 },
  { id: "telaviv", city: "Tel Aviv", cc: "IL", region: "africa", cost: 82, hype: 1, why: "Top 10 de tendência no verão 2026 (Google Flights)" },
  // Oceania
  { id: "sydney", city: "Sydney", cc: "AU", region: "oceania", cost: 74, hype: 0 },
  { id: "auckland", city: "Auckland", cc: "NZ", region: "oceania", cost: 68, hype: 0 },
  { id: "christchurch", city: "Christchurch", cc: "NZ", region: "oceania", cost: 62, hype: 2, why: "Cidade em maior alta no Kayak para 2026 (≈ +200% nas buscas)" },
];

POL.regions = [
  { id: "all", label: "Todas" },
  { id: "americas", label: "Américas" },
  { id: "europa", label: "Europa" },
  { id: "asia", label: "Ásia" },
  { id: "africa", label: "África e Or. Médio" },
  { id: "oceania", label: "Oceania" },
];

/* ---------- State → top international destinations ----------
   InsureMyTrip, "Most Popular Travel Destinations in Every State" (Oct 7, 2025):
   all InsureMyTrip travel-insurance purchases in 2025 for trips outside the U.S. */
POL.states = {
  "Alabama": ["MX", "BS", "IT"], "Alaska": ["MX", "DE", "CA"], "Arizona": ["MX", "GB", "IT"],
  "Arkansas": ["MX", "GB", "BS"], "California": ["MX", "JP", "IT"], "Colorado": ["MX", "IT", "GB"],
  "Connecticut": ["IT", "BS", "GB"], "Delaware": ["BS", "IT", "FR"], "District of Columbia": ["FR", "ES", "IT"],
  "Florida": ["BS", "MX", "IT"], "Georgia": ["BS", "MX", "IT"], "Hawaii": ["JP", "CA", "AU"],
  "Idaho": ["MX", "IT", "CA"], "Illinois": ["MX", "IT", "GB"], "Indiana": ["MX", "BS", "IT"],
  "Iowa": ["MX", "BS", "GB"], "Kansas": ["MX", "GB", "BS"], "Kentucky": ["MX", "BS", "IT"],
  "Louisiana": ["MX", "IT", "BS"], "Maine": ["GB", "IT", "CA"], "Maryland": ["BS", "GB", "IT"],
  "Massachusetts": ["IT", "GB", "ES"], "Michigan": ["MX", "BS", "IT"], "Minnesota": ["MX", "IT", "GB"],
  "Mississippi": ["MX", "BS", "IT"], "Missouri": ["MX", "BS", "IT"], "Montana": ["MX", "GB", "CA"],
  "Nebraska": ["MX", "BS", "FR"], "Nevada": ["MX", "IT", "JP"], "New Hampshire": ["GB", "IT", "BS"],
  "New Jersey": ["IT", "BS", "GB"], "New Mexico": ["MX", "IT", "FR"], "New York": ["IT", "BS", "IL"],
  "North Carolina": ["BS", "IT", "MX"], "North Dakota": ["MX", "CA", "BS"], "Ohio": ["BS", "MX", "IT"],
  "Oklahoma": ["MX", "BS", "GB"], "Oregon": ["MX", "IT", "JP"], "Pennsylvania": ["BS", "IT", "GB"],
  "Rhode Island": ["IT", "BS", "GB"], "South Carolina": ["BS", "IT", "GB"], "South Dakota": ["MX", "GB", "GR"],
  "Tennessee": ["BS", "MX", "GB"], "Texas": ["MX", "IT", "GB"], "Utah": ["MX", "JP", "GB"],
  "Vermont": ["IT", "GB", "MX"], "Virginia": ["GB", "BS", "IT"], "Washington": ["CA", "MX", "IT"],
  "West Virginia": ["BS", "GB", "IT"], "Wisconsin": ["MX", "GB", "IT"], "Wyoming": ["MX", "IT", "DE"],
};

POL.stateAbbr = {
  "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR", "California": "CA", "Colorado": "CO",
  "Connecticut": "CT", "Delaware": "DE", "District of Columbia": "DC", "Florida": "FL", "Georgia": "GA",
  "Hawaii": "HI", "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
  "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD", "Massachusetts": "MA",
  "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS", "Missouri": "MO", "Montana": "MT",
  "Nebraska": "NE", "Nevada": "NV", "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM",
  "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
  "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
  "Tennessee": "TN", "Texas": "TX", "Utah": "UT", "Vermont": "VT", "Virginia": "VA", "Washington": "WA",
  "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
};

/* Map legend colours for each #1 destination */
POL.destColors = {
  MX: "#3fd39a", BS: "#35c2e8", IT: "#f07bbd", GB: "#8b93f8", JP: "#f2716b", CA: "#b4dd4a", FR: "#c48cf5",
};

/* ---------- Surveys & search-trend lists (the "pesquisas") ---------- */
POL.surveys = [
  {
    id: "edreams", kind: "Buscas", title: "Mais buscados para 2027",
    org: "eDreams ODIGEO · A Year in Travel 2026", date: "9 nov 2026",
    method: "Buscas antecipadas de viajantes americanos para 2027 (só destinos internacionais).",
    url: "https://www.hotel-online.com/news/a-year-in-travel-2026-las-vegas-tops-american-travelers-bookings-as-tokyo-leads-the-wish-list-for-2027",
    items: [
      { label: "Tóquio", cc: "JP" }, { label: "Londres", cc: "GB" }, { label: "Paris", cc: "FR" },
      { label: "Cancún", cc: "MX" }, { label: "Roma", cc: "IT" }, { label: "Bangkok", cc: "TH" },
      { label: "Manila", cc: "PH" }, { label: "Ho Chi Minh", cc: "VN" }, { label: "Seul", cc: "KR" },
    ],
  },
  {
    id: "gholiday", kind: "Tendência", title: "Em alta para Natal e Réveillon",
    org: "Google Flights · Holiday travel trends 2026", date: "5 out 2026",
    method: "Maior alta relativa nas buscas de voos internacionais saindo dos EUA, comparado a 2025.",
    url: "https://blog.google/products-and-platforms/products/search/holiday-travel-trends-2026/",
    items: [
      { label: "Atenas", cc: "GR" }, { label: "Cidade de Québec", cc: "CA" }, { label: "Rio de Janeiro", cc: "BR" },
      { label: "Hanói", cc: "VN" }, { label: "Cidade da Guatemala", cc: "GT" },
    ],
  },
  {
    id: "nomad", kind: "Intenção", title: "Planos de viagem para 2026",
    org: "Nomad eSIM · Top destinations 2026", date: "2026",
    method: "Volume de busca e sinais de intenção nos 50 estados; conta quantos estados elegem cada destino.",
    url: "https://www.nomadesim.com/media-center/The-Top-Destinations-Americans-Plan-to-Travel-to-in-2026-Ranked",
    items: [
      { label: "Costa Rica", cc: "CR" }, { label: "Maldivas", cc: "MV" }, { label: "Grécia", cc: "GR" },
      { label: "Islândia", cc: "IS" }, { label: "Belize", cc: "BZ" },
    ],
  },
  {
    id: "gsummer", kind: "Tendência", title: "Em alta no verão 2026",
    org: "Google Flights · Summer travel trends", date: "17 abr 2026",
    method: "Maior alta anual nas buscas de voos internacionais saindo dos EUA, 1º jun a 31 ago.",
    url: "https://blog.google/products-and-platforms/products/travel/2026-travel-trends/",
    items: [
      { label: "St. Maarten", cc: "SX", q: "Sint Maarten", country: true }, { label: "Cidade do México", cc: "MX" }, { label: "Estocolmo", cc: "SE" },
      { label: "Palma de Mallorca", cc: "ES" }, { label: "Budapeste", cc: "HU" }, { label: "Tel Aviv", cc: "IL" },
      { label: "Cidade do Panamá", cc: "PA" }, { label: "Guangzhou", cc: "CN" }, { label: "Dubrovnik", cc: "HR" },
      { label: "Santiago (RD)", cc: "DO", q: "Santiago de los Caballeros, República Dominicana" },
    ],
  },
  {
    id: "insure", kind: "Viagens reais", title: "Destino nº 1 por estado",
    org: "InsureMyTrip · compras de seguro viagem em 2025", date: "7 out 2025",
    method: "Destino que mais aparece nas apólices de seguro viagem compradas em cada estado.",
    url: "https://www.prnewswire.com/news-releases/insuremytrip-reveals-most-popular-destinations-in-every-state-302574918.html",
    items: [
      { label: "México", cc: "MX", note: "29 estados" }, { label: "Bahamas", cc: "BS", note: "10" },
      { label: "Itália", cc: "IT", note: "6" }, { label: "Reino Unido", cc: "GB", note: "3" },
      { label: "Japão", cc: "JP", note: "1" }, { label: "Canadá", cc: "CA", note: "1" }, { label: "França", cc: "FR", note: "1" },
    ],
  },
];

/* Weight each list when building the consensus “mais desejado” ranking */
POL.surveyWeights = { edreams: 1.2, gholiday: 1.0, nomad: 1.0, gsummer: 0.9, insure: 1.3 };

/* ---------- News & signals ---------- */
POL.news = [
  {
    tag: "Câmbio", title: "O peso egípcio perdeu mais de 10% contra o dólar em 12 meses",
    src: "Travelbinger", date: "8 nov 2026",
    url: "https://travelbinger.com/8-countries-where-the-u-s-dollar-still-goes-surprisingly-far",
  },
  {
    tag: "Demanda", title: "40% dos americanos viajam ao exterior; 43% deles viajaram menos no último ano",
    src: "YouGov · International Traveler Outlook 2026", date: "15 dez 2025",
    url: "https://yougov.com/en-us/articles/53736-americans-pull-back-on-global-travel-heading-into-2026",
  },
  {
    tag: "Preço", title: "Passagem internacional ficou quase US$ 200 mais cara em um ano, segundo o Kayak",
    src: "Axios", date: "5 jun 2026",
    url: "https://www.axios.com/2026/06/05/travel-trends-summer-destinations-airfare",
  },
  {
    tag: "Buscas", title: "Leste Europeu em alta: buscas por voos à Tchéquia sobem cerca de 180%",
    src: "Axios / Kayak", date: "11 dez 2025",
    url: "https://www.axios.com/2025/12/11/2026-travel-trends-hotspots-destinations",
  },
  {
    tag: "Dica", title: "Voo internacional fica mais barato cerca de 89 dias antes da partida",
    src: "Google Flights", date: "5 out 2026",
    url: "https://blog.google/products-and-platforms/products/search/holiday-travel-trends-2026/",
  },
  {
    tag: "Inflação", title: "Inflação turca fica em 29,8% em outubro, abaixo de 30% pela primeira vez em cinco anos",
    src: "Bianet", date: "3 nov 2026",
    url: "https://bianet.org/haber/turkeys-annual-inflation-falls-below-30-for-first-time-in-five-years-325040",
  },
];

/* ---------- Offline fallback snapshot (USD → local), used only if every live source fails ---------- */
POL.fallback = {
  date: "2026-11-19",
  now: { EUR: 0.9118, JPY: 159.57, GBP: 0.76098, MXN: 18.901, BRL: 5.8822, ARS: 1559.2, COP: 3354.8, EGP: 53.834, TRY: 50.46, ZAR: 17.295, THB: 33.979, VND: 25732, IDR: 18256, INR: 93.318, KRW: 1329.3, HUF: 336.37, PLN: 4.0244, CZK: 22.253, CRC: 445.07, PEN: 3.4146, DOP: 60.396, CAD: 1.4334, AUD: 1.4937, NZD: 1.8179, ISK: 124.92, MAD: 9.9704, CLP: 1007.0, PHP: 63.691, MYR: 4.1155, GEL: 2.5911, TWD: 32.962, SEK: 10.177, UYU: 40.604, GTQ: 7.6388, KES: 130.0, LKR: 332.63, ILS: 3.2655, AED: 3.6725, MVR: 15.438, BZD: 2.0127, XCG: 1.8004, BSD: 1, USD: 1 },
  m3: { EUR: 0.85606, JPY: 158.36, GBP: 0.73494, MXN: 16.948, BRL: 5.1785, ARS: 1497.1, COP: 3052.8, EGP: 50.652, TRY: 47.955, ZAR: 16.101, THB: 32.834, VND: 26123, IDR: 17802, INR: 95.621, KRW: 1393.6, HUF: 311.53, PLN: 3.6972, CZK: 20.691, CRC: 450.21, PEN: 3.3508, DOP: 58.403, CAD: 1.3803, AUD: 1.4068, NZD: 1.6823, ISK: 121.74, MAD: 9.2546, CLP: 921.58, PHP: 61.619, MYR: 4.0428, GEL: 2.6054, TWD: 31.837, SEK: 9.4373, UYU: 40.01, GTQ: 7.6115, KES: 129.44, LKR: 329.04, ILS: 2.9784, AED: 3.6725, MVR: 15.4587, BZD: 2.0087, XCG: 1.7912, BSD: 1, USD: 1 },
  y1: { EUR: 0.86769, JPY: 157.39, GBP: 0.76642, MXN: 18.346, BRL: 5.3305, ARS: 1406.2, COP: 3713.9, EGP: 47.393, TRY: 42.353, ZAR: 17.202, THB: 32.476, VND: 26361, IDR: 16717, INR: 88.504, KRW: 1468.9, HUF: 331.37, PLN: 3.6687, CZK: 20.971, CRC: 500.18, PEN: 3.3805, DOP: 63.436, CAD: 1.4055, AUD: 1.5428, NZD: 1.784, ISK: 127.38, MAD: 9.2802, CLP: 932.54, PHP: 59.063, MYR: 4.1589, GEL: 2.7039, TWD: 31.236, SEK: 9.5538, UYU: 39.837, GTQ: 7.6601, KES: 129.99, LKR: 308.16, ILS: 3.2652, AED: 3.6725, MVR: 15.446, BZD: 2.0135, XCG: 1.8022, BSD: 1, USD: 1 },
};

/* ---------- Trip price estimates (US$, per person) ----------
   DAILY_NYC: what a mid-range day costs in New York (hotel 3–4★ in a shared double,
   meals, local transport). A city's daily cost = DAILY_NYC × effective cost index / 100,
   so it moves with the exchange rate. Fares: typical round-trip economy fare from a
   major US hub, rounded. All of these are POLINATOR estimates, not quotes. */
POL.DAILY_NYC = 380;
POL.fareByRegion = { americas: 600, europa: 900, asia: 1250, africa: 1150, oceania: 1500 };
POL.fare = {
  cdmx: 450, cancun: 420, gdl: 450, nassau: 380, puntacana: 480, sxm: 520, belize: 520, guate: 500, panama: 500, sanjose: 520,
  bogota: 550, medellin: 560, cartagena: 560, lima: 750, cusco: 850, rio: 850, floripa: 900, bsas: 1000, santiago: 1000, montevideo: 1000,
  quebec: 420, montreal: 400,
  londres: 800, paris: 800, lisboa: 800, porto: 850, reykjavik: 650, istambul: 900, tbilisi: 1000,
  toquio: 1100, osaka: 1150, seul: 1100, taipei: 1150, male: 1600, jaipur: 1300, colombo: 1350,
  cairo: 1000, marrakech: 950, capetown: 1300, nairobi: 1300, dubai: 1100, telaviv: 1000,
  sydney: 1500, auckland: 1500, christchurch: 1600,
};
POL.extraNames = { CN: "China" };
