export type MissionId = 'm-01' | 'm-02' | 'm-03' | 'm-04' | 'm-05' | 'm-06' | 'm-07' | 'm-08'
export type ProbeModel = 'curiosity' | 'ingenuity' | 'lunar-module' | 'osiris-rex' | 'perseverance' | 'opportunity' | 'bennu' | 'sky-hologram'
export type Category = 'web' | 'ai-ml' | 'engineering' | 'xr'

export interface Mission {
  id: MissionId
  code: string
  name: string
  category: Category[]
  url?: string
  repo?: string
  role: string
  context: string
  year: number
  stack: string[]
  brief: string
  highlights: string[]
  model: ProbeModel
  modelName: string
  modelReason: string
  status: 'deployed' | 'offline-archive'
  checkedAt: string
  orbit: { ring: 'inner' | 'outer'; phase: number }
}

// Stacks verified 2026-11-18 from github.com/AhmadRafliR and the live sites (implementasi.md §1.3).
export const MISSIONS: Mission[] = [
  {
    id: 'm-01',
    code: 'M-01',
    name: 'IPFEST 2027',
    category: ['web'],
    url: 'https://ipfest2027.com/',
    role: 'Front-end developer',
    context: 'IPFEST 2027 · web development team',
    year: 2026,
    stack: ['HTML', 'SCSS', 'JavaScript', 'Bootstrap', 'Webpack', 'Firebase'],
    brief: 'Front-end for an international petroleum festival: event pages, participant auth and admin tools on Firebase.',
    highlights: ['Participant authentication & competition info', 'Firebase Hosting, Firestore and Cloud Functions'],
    model: 'curiosity',
    modelName: 'Curiosity',
    modelReason: 'Geology rover with a rock drill, for a petroleum festival.',
    status: 'deployed',
    checkedAt: '2026-11-18',
    orbit: { ring: 'inner', phase: 0.0 },
  },
  {
    id: 'm-02',
    code: 'M-02',
    name: 'CarbonCapex',
    category: ['web', 'ai-ml'],
    url: 'https://carboncapex.vercel.app/',
    repo: 'https://github.com/AhmadRafliR/carboncapex',
    role: 'Builder',
    context: 'Competition entry',
    year: 2026,
    stack: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind v4', 'Zustand', 'Gemini API'],
    brief: 'Decarbonization capital planner with an auditable optimizer and a Gemini-powered advisor.',
    highlights: ['Gemini-powered advisor chat with a local fallback', 'Exact 2ⁿ portfolio optimizer · 11 built-in self-tests'],
    model: 'ingenuity',
    modelName: 'Ingenuity',
    modelReason: 'An autonomous flyer, for an AI advisor that reasons on its own.',
    status: 'deployed',
    checkedAt: '2026-11-18',
    orbit: { ring: 'inner', phase: 0.2 },
  },
  {
    id: 'm-03',
    code: 'M-03',
    name: 'Wispril 2026',
    category: ['web'],
    url: 'https://wispril2026.wisudaitb.id/',
    role: 'Design & front-end',
    context: 'ITB April 2026 graduation parade',
    year: 2026,
    stack: ['React', 'Vite', 'React Router', 'Supabase', 'Figma'],
    brief: "Design and front-end for ITB's April 2026 graduation parade site.",
    highlights: ['UI design in Figma to production React', 'Supabase-backed content'],
    model: 'lunar-module',
    modelName: 'Apollo Lunar Module',
    modelReason: 'A landing, for graduation day.',
    status: 'deployed',
    checkedAt: '2026-11-18',
    orbit: { ring: 'inner', phase: 0.4 },
  },
  {
    id: 'm-04',
    code: 'M-04',
    name: 'Pantra',
    category: ['web', 'ai-ml'],
    url: 'https://pantra-inky.vercel.app/',
    role: 'Builder',
    context: 'Competition entry',
    year: 2026,
    stack: ['Next.js', 'Computer vision', 'LLM assistant', 'QR'],
    brief: 'Bottle-deposit platform: edge AI scans plastic bottles at partner shops and pays out rupiah instantly.',
    highlights: ['Camera-based bottle quality check', 'Rupiah incentive calculator & partner-shop flow'],
    model: 'perseverance',
    modelName: 'Perseverance',
    modelReason: 'Camera-driven inspection that caches sample tubes, for AI bottle checks and deposits.',
    status: 'deployed',
    checkedAt: '2026-11-18',
    orbit: { ring: 'inner', phase: 0.6 },
  },
  {
    id: 'm-05',
    code: 'M-05',
    name: 'SPHEREx XR',
    category: ['xr', 'web'],
    url: 'https://helios-cosmic-explorer.vercel.app/explorer',
    role: 'XR & front-end',
    context: 'NASA Space Apps Challenge 2026',
    year: 2026,
    stack: ['React 19', 'Vite', 'TypeScript', 'React Three Fiber', 'WebXR', 'three.js'],
    brief: 'Explore the Solar System and SPHEREx sky data in WebXR and phone AR.',
    highlights: ['Gyro "magic window" and camera AR on any phone', 'iOS AR Quick Look and WebXR headsets'],
    model: 'sky-hologram',
    modelName: 'All-sky survey (illustrative)',
    modelReason: 'SPHEREx maps the whole sky in 102 colours.',
    status: 'deployed',
    checkedAt: '2026-11-18',
    orbit: { ring: 'inner', phase: 0.8 },
  },
  {
    id: 'm-06',
    code: 'M-06',
    name: 'HMS Simulation',
    category: ['engineering'],
    role: 'Solo',
    context: 'Petroleum engineering',
    year: 2026,
    stack: ['Python', 'Darcy’s Law', 'Advection-diffusion'],
    brief: 'Modular 2D oil and gas migration simulator in Python using Darcy’s Law and advection-diffusion.',
    highlights: ['Physics-based migration through porous media', 'Modular solver design'],
    model: 'bennu',
    modelName: 'Bennu',
    modelReason: 'A porous rubble-pile rock, for fluid migration through porous media.',
    status: 'offline-archive',
    checkedAt: '2026-11-18',
    orbit: { ring: 'outer', phase: 0.1 },
  },
  {
    id: 'm-07',
    code: 'M-07',
    name: 'KaryaSupply',
    category: ['web'],
    url: 'https://karya-supply-dummy.vercel.app/',
    repo: 'https://github.com/AhmadRafliR/KaryaSupplyDummy',
    role: 'Web architecture & business design',
    context: 'B2B supply-chain concept',
    year: 2026,
    stack: ['HTML', 'Tailwind CSS'],
    brief: 'B2B local procurement OS for cluster-based supply chains: architecture, roles and value proposition.',
    highlights: ['Role design & value proposition canvas', 'Clickable prototype'],
    model: 'osiris-rex',
    modelName: 'OSIRIS-REx',
    modelReason: 'Pick-up and return logistics, for B2B procurement.',
    status: 'deployed',
    checkedAt: '2026-11-18',
    orbit: { ring: 'outer', phase: 0.43 },
  },
  {
    id: 'm-08',
    code: 'M-08',
    name: 'Mud Monitor',
    category: ['engineering'],
    role: 'Solo',
    context: 'Upstream oil & gas',
    year: 2026,
    stack: ['HTML', 'JavaScript', 'Data visualization'],
    brief: 'Interactive visualization and prototype that flags well kicks during drilling.',
    highlights: ['Kick-detection logic on mud-flow signals', 'Operator-facing visualization'],
    model: 'opportunity',
    modelName: 'Opportunity',
    modelReason: 'A long-lived monitoring rover, for continuous kick detection.',
    status: 'offline-archive',
    checkedAt: '2026-11-18',
    orbit: { ring: 'outer', phase: 0.76 },
  },
]

/** Screenshots made by scripts/capture-shots.mjs for every mission with a live site. */
export function shotsFor(m: Mission): { desktop: string; mobile: string } | null {
  return m.url ? { desktop: `/shots/${m.id}-desktop.webp`, mobile: `/shots/${m.id}-mobile.webp` } : null
}

/** Live sites checked 2026-11-18: none sends X-Frame-Options or CSP frame-ancestors, so all may be framed. */
export const canFrame = (m: Mission) => Boolean(m.url)

export const MISSION_BY_ID = Object.fromEntries(MISSIONS.map((m) => [m.id, m])) as Record<MissionId, Mission>

export function neighbour(id: MissionId, step: 1 | -1): MissionId {
  const i = MISSIONS.findIndex((m) => m.id === id)
  return MISSIONS[(i + step + MISSIONS.length) % MISSIONS.length].id
}
