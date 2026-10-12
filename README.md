## AVYAKTA – The Living Traditions

A culturally rooted, vibrant website for Avyakta - a cultural multi-domain club that brings together students passionate about performing arts, design, technology, event management, and more.

## Recent Handover Notes

For a detailed record of work completed since yesterday (implementation, DB checks, troubleshooting, seeded data, and pending steps), refer to [READMEBYNAMAN](READMEBYNAMAN).

---

## Tech Stack

- **Framework**: Next.js 14+ (App Router) with TypeScript (.tsx)
- **Styling**: Tailwind CSS
- **Animations**: CSS transitions
- **Backend/DB**: Supabase (PostgreSQL + Auth + Storage)
- **Forms**: React Hook Form + validation (regex + logic)
- **CI/CD**: GitHub Actions
- **Node.js**: v24.x
- Backend logic is handled using Next.js API routes (App Router)
---

## Project Structure

```
AVYAKTA-The-Living-Traditions/
│
├── frontend/                      # Next.js application
│   ├── src/
│   │   ├── app/                  # Next.js App Router (pages + routing)
│   │   │   ├── layout.tsx       # Root layout (required)
│   │   │   ├── page.tsx         # Home Page
│   │   │   ├── about/
│   │   │   │   └── page.tsx
│   │   │   ├── about-ira/
│   │   │   │   └── page.tsx
│   │   │   ├── recruitment/
│   │   │   │   └── page.tsx
│   │   │   ├── events/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx
│   │   │   ├── gallery/
│   │   │   │   └── page.tsx
│   │   │   ├── members/
│   │   │   │   └── page.tsx
│   │   │   ├── registrations/
│   │   │   │   └── page.tsx
│   │   │   ├── history/
│   │   │   │   └── page.tsx
│   │   │   └── avyakta-control/
│   │   │       └── [hash]/      # Dynamic hidden admin route
│   │   │           ├── page.tsx
│   │   │           └── dashboard/
│   │   │               ├── page.tsx
│   │   │               ├── announcements/
│   │   │               ├── recruitment/
│   │   │               ├── events/
│   │   │               ├── gallery/
│   │   │               ├── members/
│   │   │               └── users/
│   │   ├── app/api/             # Next.js API routes (backend logic)
│   │   │   ├── recruitment/
│   │   │   │   └── route.ts     # POST - submit applications
│   │   │   ├── events/
│   │   │   │   └── route.ts     # CRUD - events
│   │   │   ├── gallery/
│   │   │   │   └── route.ts     # GET, POST - images
│   │   │   ├── members/
│   │   │   │   └── route.ts     # GET, POST - members
│   │   │   ├── announcements/
│   │   │   │   └── route.ts     # GET, POST - announcements
│   │   │   └── admin/
│   │   │       └── recruits/
│   │   │           └── route.ts # GET, PATCH - admin recruit actions
│   │   ├── components/
│   │   │   ├── layout/          # Navbar, Footer, MobileMenu
│   │   │   ├── home/            # Hero, Announcements, Domains, etc.
│   │   │   ├── events/          # EventCard, EventFilter
│   │   │   ├── gallery/         # ImageGrid, Lightbox
│   │   │   ├── members/         # MemberCard, MemberModal
│   │   │   ├── forms/           # RecruitmentForm, RegistrationForm
│   │   │   ├── ui/              # Button, Card, Modal, Input, etc.
│   │   │   └── shared/          # RangoliDivider, MandalaLoader, etc.
│   │   │
│   │   ├── lib/
│   │   │   ├── supabase/        # Supabase client & config
│   │   │   └── utils/           # Helper functions
│   │   │
│   │   ├── hooks/               # Custom React hooks
│   │   ├── styles/              # Global styles
│   │   └── assets/
│   │       ├── icons/           # Custom SVG icons (diya, rangoli)
│   │       └── patterns/        # SVG patterns (paisley, jaali)
│   │
│   ├── public/
│   │   └── images/
│   │
│   ├── .env.local               # Environment variables 
│   ├── tailwind.config.js
│   ├── next.config.js
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── ci.yml               # CI Pipeline
│
└── README.md
```

---

## Pages Overview

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Hero, Announcements, About, Timeline, Domains, Events |
| `/about` | About | Mission, Vision, Domains, Why Join |
| `/about-ira` | About IRA | Parent club information |
| `/recruitment` | Recruitment | Application form with domain selection |
| `/events` | Events | Horizontal scroll carousel with filters |
| `/events/[slug]` | Event Detail | Full event information |
| `/gallery` | Gallery | Masonry layout with lightbox |
| `/members` | Members | Team grid with modal popups |
| `/registrations` | Registrations | Volunteer/participant signup |
| `/history` | History | Animated timeline page |
| *(hidden route)* | Admin | Hidden admin dashboard — URL shared privately by tech team only |

### Page-specific Notes

- **Home**: Announcements popup (recruitment/events), timeline/history scroll, subtle IRA mention linking to `/about-ira`.
- **Members**: Sections for founders, faculty advisors, previous heads, previous members. Hover animation on images; click opens popup with name, designation, and description/quote.
- **Recruitment**: Ethics statement → domain descriptions → form (name, SRN, branch, class, section, domain interest, experience) → dynamic links section (type dropdown + URL per link).
- **Gallery**: Event-wise image groups. Users scroll through events and view all images of a selected event.
- **Events**: Scroll-based layout for past/present/future. Past events show "View Gallery"; upcoming events show Register/Volunteer button.
- **Admin**: Not linked anywhere in public navigation. URL is shared privately. Navigation flow: `Homepage → Hidden URL → Login → Dashboard`.

---

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Bronze Gold | #92791B | Headings, CTAs, borders |
| Emerald Green | #1B5E3B | Nav highlights, success states |
| Charcoal Black | #1C1C1C | Body text, footer |
| Dull Olive Yellow | #737955 | Subheadings, captions |
| Deep Crimson | #8B1A1A | Alerts, tags, accents |
| Muted Warm White | #F5F0E8 | Backgrounds, cards |
| Gold Light | #C9A84C | Hover glows, icon highlights |

---

## Typography

- **Display**: Cormorant Garamond (serif) - headings, titles
- **Body**: Inter / DM Sans (sans-serif) - paragraphs, labels
- **Accent**: Playfair Display Italic - quotes, bios

---

## Indian Design Elements

- **Rangoli Dividers**: SVG geometric star/petal dividers between sections
- **Mandala Loader**: Full-screen rotating mandala on page load
- **Paisley Backgrounds**: Tiled patterns at 4-6% opacity
- **Jaali Overlays**: Geometric lattice on images
- **Diya Icons**: Custom lamp icons for domains
- **Kolam Border**: Animated border on hero section

---

## Supabase Schema

| Table | Purpose |
|-------|---------|
| `announcements` | Home popup content |
| `events` | Event listings |
| `recruitment_applications` | Applicant data |
| `registrations` | Event participation |
| `gallery_images` | Gallery photos |
| `members` | Team profiles |
| `history_milestones` | Timeline entries |
| `domain_accounts` | Domain head accounts |

---

## Development

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Lint
npm run lint

# Format
npx prettier --write .
```

---

## Team Responsibilities

| Team | Members | Tasks |
|------|---------|-------|
| Team 1 - Core & Structure | Suhith, Arrham | Layout, Navbar, Footer, Home, About, Admin |
| Team 2 - Recruitment & Data | Teja, Vrushabendra | Forms, Supabase, Domain Head Dashboard |
| Team 3 - Events, Gallery & UX | Naman, Akhil, Nikita | Events, Gallery, Members, History, Animations |

---

## Branching Strategy

| Branch | Purpose | Protection | Merge Approvals |
|--------|---------|------------|------------------|
| `main` | Production (final release) | Codeowner approval | Codeowner |
| `dev` | Integration & testing | Protected | Tech leads |
| `team/1-core-structure` | Team 1 integration | Protected | Min. 2 approvals |
| `team/2-recruitment-data` | Team 2 integration | Protected | Min. 2 approvals |
| `team/3-events-gallery-ux` | Team 3 integration | Protected | Min. 2 approvals |
| `feature/*` | Individual feature work | Not protected | — |
| Branch | Purpose | Protection |
|--------|---------|------------|
| `main` | Production-ready code | Protected |
| `dev` | Integration layer | Protected |
| `team/1-core-structure` | Team 1 integration | Protected (min approvals=2)|
| `team/2-recruitment-data` | Team 2 integration | Protected (min approvals=2)|
| `team/3-events-gallery-ux` | Team 3 integration | Protected (min approvals=2)|
| `feature/*` | Individual work | Not protected |

### Workflow

```
feature/* → PR → team branch → PR → dev → (tech leads) → main
```

1. Create a feature branch from your team branch:
   ```bash
   git checkout team/1-core-structure
   git checkout -b feature/navbar
   ```

2. Work and commit:
   ```bash
   git commit -m "feat: add navbar component"
   git push origin feature/navbar
   ```

3. Open PR → your team branch (requires **2 approvals**).

4. Team branch → PR → `dev` (handled by tech leads).

5. `dev` → `main` after integration testing (codeowner approval required).

### Rules

- No direct pushes to protected branches.
- All changes go through PRs.
- **Do not** merge directly between team branches — cross-team integration happens only via `dev`.
- CI checks must pass before any merge.
- Testing happens at the `dev` integration stage, not in isolation.
- Strictly don't make changes in CI Pipeline
- Avoid merging directly between team branches — cross-team integration goes through `dev` only

---

## CI Pipeline

The CI pipeline runs on every PR to protected branches:

1. Checkout code
2. Setup Node.js v24
3. Install dependencies
4. Run lint checks
5. Check formatting (Prettier)
6. Run unit tests
7. Build project
8. Run E2E tests

---

## Setup Instructions

Note: The main application is inside the `frontend/` folder.

```bash
# Clone the repository
git clone https://github.com/Praneeth1265/AVYAKTA-The-Living-Traditions

# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

---

## Important Notes

- Node.js v24.x required
- Do NOT commit `node_modules/` 
- Follow the project structure
- Write clean, modular code
- Use only TypeScript (.tsx / .ts). Do not use .js or .jsx files
- Supabase keys and environment variables must be stored in .env.local and never committed
- Authentication and role-based access (admin/domain heads) will be handled using Supabase Auth

---

## API Routes

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/recruitment` | `POST` | Submit recruitment application |
| `/api/events` | `GET, POST, PATCH, DELETE` | Manage events |
| `/api/gallery` | `GET, POST` | Fetch/upload gallery images |
| `/api/members` | `GET, POST` | Fetch/add members |
| `/api/announcements` | `GET, POST` | Fetch/create announcements |
| `/api/admin/recruits` | `GET, PATCH` | Domain heads view/update recruit status |

---

## Admin Dashboard

Embedded in the same Next.js app — not a separate deployment. Hidden from public navigation.

### Roles

| Role | Access | Active When |
|------|--------|-------------|
| Tech (main admin) | Full dashboard — all domains & data | Always |
| Domain Head | Own domain recruits only | Recruitment season only |

### Domain Head Can

- View their domain's recruits
- Edit recruit details
- Delete entries
- Update status: `selected` / `rejected` / `pending`

### Auth & Security

- Passwords are **hashed**. Each domain head sets their own.
- All dashboard routes are protected (auth + role check).
- Domain heads cannot access other domains' data.

---

## Form Validation Rules

Applied to Recruitment and Registration forms:

| Rule | Details |
|------|---------|
| Required fields | No field may be empty |
| Type checking | String / number enforced per field |
| SRN format | Regex pattern |
| Email format | Standard email regex |
| Phone number | Format + length |
| Min/Max length | Enforced per field |
| Allowed values | Dropdowns restricted to valid options |
| Links section | Each entry must be a valid URL; count is dynamic |

---

## Commit Message Format

```
type: description
```

**Types:**
- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code improvements
- `test` - Tests
- `ci` - CI changes

---

*A branch of Club IRA*

*Building tradition through technology. <3*
