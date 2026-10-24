import { PrismaClient, Skill } from '@prisma/client';
import { getPrismaClient } from '../lib/prisma';

export interface CanonicalSkillDefinition {
  name: string;
  slug: string;
  category: string;
  description: string;
  aliases: string[];
}

export const CANONICAL_SKILLS: CanonicalSkillDefinition[] = [
  {
    name: 'React',
    slug: 'react',
    category: 'Frontend',
    description: 'Declarative component-based UI library with hooks and virtual DOM.',
    aliases: ['reactjs', 'react.js', 'react-dom', 'react 19', 'react 18', 'react-hooks'],
  },
  {
    name: 'TypeScript',
    slug: 'typescript',
    category: 'Language',
    description: 'Typed superset of JavaScript providing static type verification.',
    aliases: ['ts', 'tsc', 'typed javascript', 'typescript 5'],
  },
  {
    name: 'JavaScript',
    slug: 'javascript',
    category: 'Language',
    description: 'Core dynamic programming language of the modern web platform.',
    aliases: ['js', 'ecmascript', 'es6', 'es2024', 'esnext'],
  },
  {
    name: 'HTML5',
    slug: 'html5',
    category: 'Frontend',
    description: 'Semantic markup and core document structures for the World Wide Web.',
    aliases: ['html', 'semantic html', 'dom', 'web markup'],
  },
  {
    name: 'CSS3',
    slug: 'css3',
    category: 'Frontend',
    description: 'Styling, responsive design, Flexbox, CSS Grid, and modern design systems.',
    aliases: ['css', 'styling', 'flexbox', 'grid', 'tailwind', 'vanilla css'],
  },
  {
    name: 'Next.js',
    slug: 'nextjs',
    category: 'Full-Stack',
    description: 'React production framework with Server Components and App Router.',
    aliases: ['next', 'next.js', 'nextjs 15', 'app router', 'server components', 'ssr'],
  },
  {
    name: 'Node.js',
    slug: 'nodejs',
    category: 'Backend',
    description: 'JavaScript runtime built on V8 for high-performance server applications.',
    aliases: ['node', 'node.js', 'express', 'backend javascript'],
  },
  {
    name: 'REST APIs',
    slug: 'rest-api',
    category: 'Architecture',
    description: 'HTTP API architecture, resource endpoints, status codes, and JSON schemas.',
    aliases: ['rest', 'api', 'http api', 'restful', 'endpoints'],
  },
  {
    name: 'State Management',
    slug: 'state-management',
    category: 'Frontend',
    description: 'Client state architectures including Context, Redux, Zustand, and Signals.',
    aliases: ['redux', 'zustand', 'context api', 'state', 'signals', 'reactive store'],
  },
  {
    name: 'Web Accessibility',
    slug: 'web-accessibility',
    category: 'Frontend',
    description: 'Inclusive design, WCAG compliance, ARIA attributes, and screen reader UX.',
    aliases: ['a11y', 'wcag', 'aria', 'accessibility', 'screen reader'],
  },
  {
    name: 'Testing & Quality',
    slug: 'testing',
    category: 'Engineering',
    description: 'Unit testing, component tests, test-driven development, and Vitest.',
    aliases: ['vitest', 'jest', 'unit test', 'e2e', 'playwright', 'testing'],
  },
  {
    name: 'Deployment & DevOps',
    slug: 'deployment',
    category: 'Operations',
    description: 'Cloud hosting, containerization, CI/CD pipelines, and web deployment.',
    aliases: ['deployment', 'vercel', 'docker', 'ci/cd', 'hosting', 'production build'],
  },
];

export class SkillCatalogService {
  constructor(private readonly prismaClient?: PrismaClient) {}

  private get client(): PrismaClient {
    return this.prismaClient ?? getPrismaClient();
  }

  /**
   * Returns in-memory canonical skill definitions.
   */
  public getCanonicalDefinitions(): CanonicalSkillDefinition[] {
    return [...CANONICAL_SKILLS];
  }

  /**
   * Matches raw text and optional technology tags against canonical skills.
   * Deterministic token matching against name, slug, and aliases.
   */
  public matchSkills(text: string, tags: string[] = []): CanonicalSkillDefinition[] {
    const normalizedText = ` ${text.toLowerCase()} `;
    const normalizedTags = tags.map((t) => t.toLowerCase().trim());

    const matched = new Map<string, CanonicalSkillDefinition>();

    for (const skill of CANONICAL_SKILLS) {
      // 1. Direct tag check
      if (
        normalizedTags.includes(skill.slug) ||
        normalizedTags.includes(skill.name.toLowerCase()) ||
        skill.aliases.some((alias) => normalizedTags.includes(alias))
      ) {
        matched.set(skill.slug, skill);
        continue;
      }

      // 2. Exact word boundaries in text for slug and name
      const regexName = new RegExp(`\\b${escapeRegex(skill.name.toLowerCase())}\\b`, 'i');
      if (regexName.test(normalizedText)) {
        matched.set(skill.slug, skill);
        continue;
      }

      // 3. Alias matches in text
      for (const alias of skill.aliases) {
        const regexAlias = new RegExp(`\\b${escapeRegex(alias)}\\b`, 'i');
        if (regexAlias.test(normalizedText)) {
          matched.set(skill.slug, skill);
          break;
        }
      }
    }

    return Array.from(matched.values());
  }

  /**
   * Seeds the canonical skill catalog into the database if not already present.
   */
  public async seedSkills(): Promise<Skill[]> {
    const existing = await this.client.skill.findMany();
    const existingSlugs = new Set(existing.map((s) => s.slug));

    const created: Skill[] = [...existing];

    for (const def of CANONICAL_SKILLS) {
      if (!existingSlugs.has(def.slug)) {
        const item = await this.client.skill.create({
          data: {
            name: def.name,
            slug: def.slug,
            category: def.category,
            description: def.description,
            aliases: def.aliases,
          },
        });
        created.push(item);
      }
    }

    return created;
  }

  /**
   * Finds or retrieves all canonical skills from the database.
   */
  public async getAll(): Promise<Skill[]> {
    const skills = await this.client.skill.findMany({
      orderBy: { name: 'asc' },
    });
    if (skills.length === 0) {
      return this.seedSkills();
    }
    return skills;
  }

  /**
   * Retrieves a skill by slug.
   */
  public async getBySlug(slug: string): Promise<Skill | null> {
    return this.client.skill.findUnique({
      where: { slug },
    });
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const skillCatalogService = new SkillCatalogService();
