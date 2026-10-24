export interface GeneratedLesson {
  title: string;
  description: string;
  order: number;
  durationMinutes: number;
  learningObjectives: string[];
  content: string;
  examples: string[];
  keyTakeaways: string[];
}

export interface GeneratedMilestone {
  title: string;
  description: string;
  order: number;
  estimatedDurationMinutes: number;
  lessons: GeneratedLesson[];
}

export interface GeneratedRoadmapStructure {
  title: string;
  skill: string;
  currentLevel: string;
  goal: string;
  estimatedDurationMinutes: number;
  milestones: GeneratedMilestone[];
}

export class UnsupportedSkillError extends Error {
  public statusCode = 400;
  constructor(skill: string, supportedSkills: string[]) {
    super(
      `Unsupported skill: "${skill}". Currently available roadmap templates: ${supportedSkills.join(', ')}.`
    );
    this.name = 'UnsupportedSkillError';
  }
}

export class RoadmapGeneratorService {
  private static readonly SUPPORTED_SKILLS = ['Web Development', 'Frontend Development'];

  public getSupportedSkills(): string[] {
    return [...RoadmapGeneratorService.SUPPORTED_SKILLS];
  }

  public isSkillSupported(skill: string): boolean {
    const normalized = skill.trim().toLowerCase();
    return (
      normalized === 'web development' ||
      normalized === 'web dev' ||
      normalized === 'webdev' ||
      normalized === 'frontend development' ||
      normalized === 'frontend'
    );
  }

  /**
   * Generates a deterministic, structured learning roadmap for supported skills.
   */
  public generate(
    skill: string,
    currentLevel: string = 'BEGINNER',
    goal: string = 'Build a personal website',
    minutesPerDay: number = 30
  ): GeneratedRoadmapStructure {
    if (!this.isSkillSupported(skill)) {
      throw new UnsupportedSkillError(skill, this.getSupportedSkills());
    }

    const normalizedLevel = currentLevel.toUpperCase();
    const title = `${skill}: ${goal ? `${goal} (${normalizedLevel})` : `Complete ${normalizedLevel} Path`}`;

    const milestones: GeneratedMilestone[] = [
      {
        title: 'Milestone 1: HTML5 & Semantic Web Architecture',
        description:
          'Build strong web foundations with valid HTML5 documents, accessible form controls, and semantic structuring.',
        order: 1,
        estimatedDurationMinutes: 90,
        lessons: [
          {
            title: 'Web Architecture & HTML5 Document Structure',
            description: 'Understand client-server communication, browsers, and valid HTML5 boilerplate.',
            order: 1,
            durationMinutes: 30,
            learningObjectives: [
              'Explain how web browsers request and render HTML documents',
              'Write valid HTML5 boilerplate with correct meta viewport tags',
              'Structure textual content using headings (h1-h6), paragraphs, and lists',
            ],
            content:
              'The World Wide Web operates on HTTP/HTTPS request-response cycles. Web browsers receive HTML from servers and parse it into an in-memory Document Object Model (DOM). In HTML5, proper document declaration (<!DOCTYPE html>) ensures modern standards compliance rather than legacy quirks mode. Every page requires <head> metadata for character encoding and mobile responsiveness, paired with a semantic <body> structure.',
            examples: [
              '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>My First Web Page</title>\n  </head>\n  <body>\n    <h1>Welcome to Hoollow</h1>\n    <p>Starting the web development journey.</p>\n  </body>\n</html>',
            ],
            keyTakeaways: [
              'Always declare <!DOCTYPE html> at line 1 of every HTML document.',
              'The <head> tag stores browser instructions and SEO meta; the <body> contains rendered content.',
              'Use one primary <h1> per page for accessibility and SEO hierarchy.',
            ],
          },
          {
            title: 'Semantic Markup & Accessible Elements',
            description: 'Organize content with semantic landmarks (<header>, <nav>, <main>, <article>, <footer>).',
            order: 2,
            durationMinutes: 30,
            learningObjectives: [
              'Differentiate semantic HTML elements from generic <div> and <span> tags',
              'Implement accessible navigation links and document outlines',
              'Ensure screen readers navigate web content accurately',
            ],
            content:
              'Semantic HTML introduces elements with inherent meaning to both developers and assistive technologies. Instead of nesting generic <div> containers, modern markup employs <header> for introductory banners, <nav> for site navigation, <main> for central unique content, and <footer> for copyright and site links. This eliminates ambiguity and empowers screen readers to leap directly to landmarks.',
            examples: [
              '<header>\n  <nav>\n    <a href="#about">About</a>\n    <a href="#projects">Projects</a>\n  </nav>\n</header>\n<main>\n  <article>\n    <h2>Semantic Web Standards</h2>\n    <p>Using the right tag for the right job.</p>\n  </article>\n</main>\n<footer>\n  <p>&copy; 2026 Hoollow Learner</p>\n</footer>',
            ],
            keyTakeaways: [
              'Prefer semantic elements over unstyled <div> containers whenever structural meaning exists.',
              'Assistive technologies rely on <main> and <nav> for rapid keyboard navigation.',
              'Search engines prioritize semantic hierarchies when indexing page content.',
            ],
          },
          {
            title: 'Interactive Forms & Input Validation',
            description: 'Collect learner input securely with accessible forms and native client-side validation.',
            order: 3,
            durationMinutes: 30,
            learningObjectives: [
              'Construct form groups with associated <label> elements',
              'Use appropriate input types (text, email, number, date)',
              'Apply native validation attributes like required, minlength, and pattern',
            ],
            content:
              'Web forms provide the primary interactive bridge for user data entry. To adhere to accessibility standards, every <input> must be linked to a <label> using matching "for" and "id" attributes. HTML5 provides built-in browser validation via types (e.g. type="email") and constraints (e.g. required, minlength="3") that validate input before network submission.',
            examples: [
              '<form action="/api/contact" method="POST">\n  <label for="learner-email">Email Address:</label>\n  <input type="email" id="learner-email" name="email" required />\n  <button type="submit">Submit Feedback</button>\n</form>',
            ],
            keyTakeaways: [
              'Never omit form labels; screen readers require explicit associations via for/id.',
              'Native validation attributes give instant user feedback without extra JavaScript.',
              'Choose specific input types to trigger the correct virtual keyboard on mobile devices.',
            ],
          },
        ],
      },
      {
        title: 'Milestone 2: CSS3 Styling, Flexbox & Responsive Layouts',
        description:
          'Style modern user interfaces with cascading stylesheets, the CSS box model, Flexbox alignment, and responsive media queries.',
        order: 2,
        estimatedDurationMinutes: 90,
        lessons: [
          {
            title: 'CSS Specificity, Inheritance & The Box Model',
            description: 'Master margins, borders, padding, content, and the universal box-sizing rule.',
            order: 1,
            durationMinutes: 30,
            learningObjectives: [
              'Calculate selector specificity (inline, ID, class, element)',
              'Explain the CSS Box Model (content, padding, border, margin)',
              'Configure box-sizing: border-box for predictable layouts',
            ],
            content:
              'CSS styles documents according to the cascade, inheritance, and specificity rules. In the browser rendering engine, every rendered element is a rectangular box. By default, box-sizing: content-box causes padding and borders to expand element dimensions outwards. Applying box-sizing: border-box ensures specified widths include padding and borders, avoiding unexpected layout wrapping.',
            examples: [
              '*,\n*::before,\n*::after {\n  box-sizing: border-box;\n  margin: 0;\n  padding: 0;\n}\n\n.card {\n  width: 320px;\n  padding: 24px;\n  border: 1px solid #e2e8f0;\n  border-radius: 8px;\n}',
            ],
            keyTakeaways: [
              'Set box-sizing: border-box globally to prevent margin and padding overflow bugs.',
              'Keep specificity low by styling through single class names rather than deep selector chains.',
              'Margins collapse vertically between adjacent block elements.',
            ],
          },
          {
            title: 'One-Dimensional Layouts with CSS Flexbox',
            description: 'Align and distribute elements along main and cross axes with modern Flexbox.',
            order: 2,
            durationMinutes: 30,
            learningObjectives: [
              'Create flexible container contexts with display: flex',
              'Align items with justify-content and align-items',
              'Build responsive navigation bars and flexible card rows',
            ],
            content:
              'CSS Flexible Box Layout (Flexbox) provides a powerful model for distributing space and aligning items within a container along a primary axis (row or column) and a cross axis. Flexbox handles dynamic element sizing without floats, clears, or brittle pixel positioning.',
            examples: [
              '.navbar {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 1rem 2rem;\n}\n\n.nav-links {\n  display: flex;\n  gap: 1.5rem;\n  list-style: none;\n}',
            ],
            keyTakeaways: [
              'justify-content controls alignment along the main axis; align-items controls cross-axis alignment.',
              'The gap property cleanly spaces flex children without margin workarounds.',
              'flex: 1 allows flex items to grow and fill available remaining space equally.',
            ],
          },
          {
            title: 'Mobile-First Responsive Web Design & Media Queries',
            description: 'Deliver responsive experiences across mobile, tablet, and desktop viewports.',
            order: 3,
            durationMinutes: 30,
            learningObjectives: [
              'Adopt a mobile-first stylesheet architecture using min-width queries',
              'Apply CSS breakpoints for tablet (768px) and desktop (1024px)',
              'Use fluid typography and responsive CSS units (rem, %, clamp)',
            ],
            content:
              'Mobile-first responsive web design styles default rules for small screens first, then progressively layers enhanced multi-column layouts for larger viewports using CSS media queries with min-width breakpoints. This reduces CSS bloat for mobile devices and improves performance.',
            examples: [
              '.project-grid {\n  display: grid;\n  grid-template-columns: 1fr;\n  gap: 1rem;\n}\n\n@media (min-width: 768px) {\n  .project-grid {\n    grid-template-columns: repeat(2, 1fr);\n  }\n}\n\n@media (min-width: 1024px) {\n  .project-grid {\n    grid-template-columns: repeat(3, 1fr);\n  }\n}',
            ],
            keyTakeaways: [
              'Mobile-first styles are faster and prevent desktop-override clutter.',
              'Never hardcode pixel widths on layout containers; use percentages, max-width, or auto-fit grids.',
              'Audit responsive views using device emulation in browser developer tools.',
            ],
          },
        ],
      },
      {
        title: 'Milestone 3: JavaScript Interactivity, Dynamic DOM & Deployment',
        description:
          'Make web pages interactive with JavaScript event listeners, dynamic DOM manipulation, and publish your project online.',
        order: 3,
        estimatedDurationMinutes: 90,
        lessons: [
          {
            title: 'DOM Manipulation & Event Listeners',
            description: 'Select DOM elements, listen to user click/keyboard events, and toggle dynamic UI states.',
            order: 1,
            durationMinutes: 30,
            learningObjectives: [
              'Query DOM elements using document.querySelector and querySelectorAll',
              'Attach robust event listeners with addEventListener',
              'Dynamically manipulate CSS classes and element attributes',
            ],
            content:
              'JavaScript interacts with HTML documents through the DOM API. By selecting elements and attaching event listeners, developers create reactive interfaces—such as theme toggles, modal dialogs, and mobile dropdown menus—in response to user interactions.',
            examples: [
              'const themeToggleBtn = document.querySelector("#theme-toggle");\n\nthemeToggleBtn.addEventListener("click", () => {\n  document.body.classList.toggle("dark-theme");\n  const isDark = document.body.classList.contains("dark-theme");\n  themeToggleBtn.setAttribute("aria-pressed", String(isDark));\n});',
            ],
            keyTakeaways: [
              'Use document.querySelector with standard CSS selector syntax.',
              'Avoid inline event handlers (onclick="..."); use addEventListener for clean separation of concerns.',
              'Synchronize accessibility states (e.g. aria-expanded, aria-pressed) when toggling UI elements.',
            ],
          },
          {
            title: 'Asynchronous Data Fetching with Fetch API',
            description: 'Communicate with backend REST APIs using async/await and native browser fetch.',
            order: 2,
            durationMinutes: 30,
            learningObjectives: [
              'Understand asynchronous operations and JavaScript Promises',
              'Fetch JSON data from backend endpoints using async/await',
              'Handle loading states, response status verification, and network error recovery',
            ],
            content:
              'Modern client applications retrieve and post server data asynchronously without page reloads. The Fetch API provides a modern Promise-based interface. Always verify response.ok before parsing JSON, and enclose network requests in try...catch blocks to handle connection drops gracefully.',
            examples: [
              'async function loadRoadmaps(learnerId) {\n  try {\n    const response = await fetch(`/api/learners/${learnerId}/roadmaps`);\n    if (!response.ok) {\n      throw new Error(`HTTP error! status: ${response.status}`);\n    }\n    const data = await response.json();\n    return data.roadmaps;\n  } catch (err) {\n    console.error("Failed to fetch roadmaps:", err);\n    return [];\n  }\n}',
            ],
            keyTakeaways: [
              'Use async/await for readable asynchronous control flow.',
              'Always inspect response.ok; fetch does not reject Promises on HTTP 4xx or 5xx statuses.',
              'Display accessible loading feedback to users while asynchronous operations are pending.',
            ],
          },
          {
            title: 'Capstone Project Assembly & Production Deployment',
            description: 'Assemble your project files, optimize assets, and deploy to a live URL.',
            order: 3,
            durationMinutes: 30,
            learningObjectives: [
              'Consolidate HTML, CSS, and JS into an organized project repository',
              'Audit performance, accessibility, and best practices with Lighthouse',
              'Deploy a public site using GitHub Pages, Vercel, or Netlify',
            ],
            content:
              'The culmination of this learning path: organizing code with modular asset directories, ensuring all relative links are verified, conducting automated accessibility and performance audits, and publishing your live personal website for the world to view.',
            examples: [
              '# Git deployment workflow\ngit init\ngit add .\ngit commit -m "feat: complete personal portfolio website"\ngit remote add origin https://github.com/user/portfolio.git\ngit push -u origin main',
            ],
            keyTakeaways: [
              'Keep asset folders cleanly partitioned (css/, js/, assets/images/).',
              'Run Lighthouse in Google Chrome to achieve scores above 90 in Performance and Accessibility.',
              'Pushing to a Git repository provides instant version control and deployment triggers.',
            ],
          },
        ],
      },
    ];

    const totalDuration = milestones.reduce(
      (sum, m) => sum + m.estimatedDurationMinutes,
      0
    );

    return {
      title,
      skill,
      currentLevel: normalizedLevel,
      goal,
      estimatedDurationMinutes: totalDuration,
      milestones,
    };
  }
}

export const roadmapGeneratorService = new RoadmapGeneratorService();
