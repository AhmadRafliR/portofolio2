// Everything below comes from the CV (Ahmad Rafli Ramadhan CV.pdf) and the GitHub README; nothing is invented.

export const BIO = {
  lead: 'An engineering student bridging complex physical systems and interactive digital experiences.',
  body: 'I study Petroleum Engineering at Institut Teknologi Bandung and build for the web on the side: responsive interfaces, UI/UX in Figma, and physics-based simulations in Python. I founded my high school’s IT Club, and these days I design and ship sites for ITB events and organisations.',
  education: [
    { school: 'Institut Teknologi Bandung', detail: 'Petroleum Engineering', years: '2025 – present' },
    { school: 'SMAN 14 Bekasi', detail: 'Senior high school', years: '2022 – 2025' },
  ],
  matrix: [
    { title: 'Frontend artistry', text: 'HTML, CSS, JavaScript and React: responsive layouts and interactive components.' },
    { title: 'UI/UX design', text: 'Figma, design systems, colour transitions and glassmorphism aesthetics.' },
    { title: 'Engineering & simulation', text: "Python and physics/maths algorithms: Darcy's Law, advection-diffusion." },
    { title: 'Tools & workflow', text: 'Git, GitHub, version control and structured problem solving.' },
  ],
  languages: ['Indonesian (native)', 'English', 'Japanese'],
}

export type LogKind = 'competition' | 'olympiad' | 'academic' | 'certification'
export interface LogEntry {
  year: number
  title: string
  result: string
  kind: LogKind
  note?: string
}

export const LOG: LogEntry[] = [
  { year: 2026, title: 'NASA Space Apps Challenge · SPHEREx', result: 'Built SPHEREx XR (M-05)', kind: 'competition' },
  { year: 2026, title: 'GarudaHacks 7.0', result: 'Pilot project', kind: 'competition', note: 'BantuCepat: disaster-logistics dashboard (Gemini, Supabase, PostGIS, Leaflet)' },
  { year: 2026, title: 'Itechno 2026', result: 'Front end and UI/UX', kind: 'competition' },
  { year: 2026, title: 'Case Connect 2026 Mini Case Competition (Binus × UGM)', result: 'Participant', kind: 'competition' },
  { year: 2026, title: 'Career and Business Fest 2026 Business Plan Competition (UM)', result: 'Participant', kind: 'competition' },
  { year: 2026, title: 'Intro to Data Analytics · RevoU', result: 'Certificate', kind: 'certification', note: 'Credential ID DAMC-050126-01-1-00684' },
  { year: 2026, title: 'AI for Work & Career Readiness with Google AI Products · Hacktiv8', result: 'Certificate', kind: 'certification', note: 'Credential ID 02142/H8/CSR/MBA2/IV/2026' },
  { year: 2025, title: 'National Business Plan Competition 2025 (Ikutlomba.id)', result: 'Semifinalist', kind: 'competition' },
  { year: 2025, title: 'LOGIKA UI 2025 Essay Competition', result: 'Participant', kind: 'competition' },
  { year: 2024, title: 'Dewa Edu Science Competition 2024', result: 'Bronze medal · Physics', kind: 'olympiad' },
  { year: 2024, title: 'OSN-K Physics 2024', result: 'Participant', kind: 'olympiad' },
  { year: 2024, title: 'SCIENCATION debate, SMAN 1 Bekasi', result: 'Participant', kind: 'competition' },
  { year: 2023, title: 'OSN-K Physics 2023', result: 'Participant', kind: 'olympiad' },
  { year: 2022, title: '2nd National Student Olympiad (OPN)', result: 'Bronze medal · Biology', kind: 'olympiad' },
  { year: 2022, title: 'SMPN 21 Bekasi', result: 'Best male graduate', kind: 'academic' },
]

export interface CrewEntry {
  org: string
  orgNote?: string
  role: string
  years: string
  points: string[]
}

export const CREW: CrewEntry[] = [
  {
    org: 'IATMI SM ITB',
    orgNote: 'Indonesian Petroleum Engineers Association, ITB Student Chapter',
    role: 'Web Development Staff',
    years: '2026 – present',
    points: [
      'Develops and maintains the official IATMI SM ITB website for publications and event information.',
      'Designs UI/UX and implements responsive front-ends for event and programme landing pages.',
      'Runs the content management system and integrates digital event registration.',
    ],
  },
  {
    org: 'BFA FTTM ITB',
    orgNote: 'FTTM ITB class of 2025 formation board',
    role: 'Creative Division Staff',
    years: 'Mar – May 2026',
    points: [
      'Designed UI/UX and visual assets for the class’s communication media in Figma.',
      'Wrote the visual design system guide that keeps the FTTM ITB 2025 brand consistent.',
    ],
  },
  {
    org: 'LAKNAT 164',
    orgNote: 'FTTM ITB 2025 supporters, TPB Cup',
    role: 'Logistics Division Staff',
    years: '2025 – 2026',
    points: [
      'Procured, inventoried and allocated equipment for the supporters’ field actions.',
      'Coordinated venue permits, transport and on-site distribution of technical gear.',
    ],
  },
  {
    org: 'IT Club SMAN 14 Bekasi',
    role: 'Founder & first Chairman',
    years: '2023 – 2024',
    points: [
      'Set the club’s vision and mission and campaigned to launch it.',
      'Wrote its constitution, organisational system and divisions, and led it with regular evaluations.',
      'Built ties with the student council (OSIS) and external partners.',
    ],
  },
]

export const ALSO_ON_DECK = [
  'Web Dev Staff · IPFEST 2027',
  'IT Staff · Wisuda April ITB 2026',
  'IT Staff · OGG ITB 2026',
  'Creative Staff · PEMIRA HTMM “PATRA” ITB 2026',
  'Logistics Staff · GATRAKALA FTTM ITB 25',
  'Logistics Staff · Internalisasi FTTM ITB 25',
  'Web Developer · FOURTEEN CUP 5.0 (2023)',
  'Event Chair · IT Club Anniversary 2024',
  'Event Chair · IT Club × KIR Iftar 2024',
  'Event Chair · ABSTRAK Showcase Talent 2023',
  'Master of Ceremony · Bulan Bahasa 2023',
  'Operator · EKPARASI OSIS 2024',
]

export const ARSENAL: { group: string; items: string[] }[] = [
  { group: 'Frontend', items: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vite', 'Tailwind CSS', 'Bootstrap 5', 'SCSS'] },
  { group: '3D & XR', items: ['three.js', 'React Three Fiber', 'WebXR', 'GLSL shaders'] },
  { group: 'Design', items: ['Figma', 'Design systems', 'UI/UX'] },
  { group: 'Data & AI', items: ['Python', 'AI/ML', 'AI workflows', 'Gemini API', 'scikit-learn', 'XGBoost', 'Jupyter'] },
  { group: 'Platforms', items: ['Git', 'GitHub', 'VS Code', 'Firebase', 'Supabase', 'Vercel'] },
  { group: 'Office', items: ['Microsoft Office', 'Google Workspace'] },
]

export const CONTACT = {
  email: 'ahmadrafliramadhan123@gmail.com',
  line: '@kinantibs_',
}
