// Aptivelle — canonical skill / role / recommendation catalog.
// Used by the seed script to populate the DB and at runtime for gap analysis fallbacks.

export const SKILLS = [
  { name: 'JavaScript', category: 'Frontend' },
  { name: 'TypeScript', category: 'Frontend' },
  { name: 'React', category: 'Frontend' },
  { name: 'HTML/CSS', category: 'Frontend' },
  { name: 'Tailwind CSS', category: 'Frontend' },
  { name: 'Node.js', category: 'Backend' },
  { name: 'Express', category: 'Backend' },
  { name: 'REST APIs', category: 'Backend' },
  { name: 'Python', category: 'Programming' },
  { name: 'SQL', category: 'Data' },
  { name: 'Data Analysis', category: 'Data' },
  { name: 'Data Visualization', category: 'Data' },
  { name: 'Excel', category: 'Data' },
  { name: 'Statistics', category: 'Data' },
  { name: 'Machine Learning', category: 'Data' },
  { name: 'Git', category: 'Tools' },
  { name: 'Docker', category: 'Tools' },
  { name: 'Cloud Basics', category: 'Cloud' },
  { name: 'Communication', category: 'Soft Skills' },
  { name: 'Teamwork', category: 'Soft Skills' },
  { name: 'Problem Solving', category: 'Soft Skills' },
];

export const ROLES = [
  {
    name: 'Frontend Developer L1',
    description:
      'Builds responsive, accessible and polished web interfaces using modern React tooling and design systems.',
    requirements: [
      { skill: 'React', requiredProficiency: 'INTERMEDIATE' },
      { skill: 'JavaScript', requiredProficiency: 'INTERMEDIATE' },
      { skill: 'HTML/CSS', requiredProficiency: 'INTERMEDIATE' },
      { skill: 'Tailwind CSS', requiredProficiency: 'BEGINNER' },
      { skill: 'Git', requiredProficiency: 'BEGINNER' },
      { skill: 'REST APIs', requiredProficiency: 'BEGINNER' },
    ],
  },
  {
    name: 'Backend Developer L1',
    description:
      'Designs and ships server-side APIs and data layers with Node.js, Express and SQL databases.',
    requirements: [
      { skill: 'Node.js', requiredProficiency: 'INTERMEDIATE' },
      { skill: 'Express', requiredProficiency: 'BEGINNER' },
      { skill: 'JavaScript', requiredProficiency: 'INTERMEDIATE' },
      { skill: 'SQL', requiredProficiency: 'BEGINNER' },
      { skill: 'REST APIs', requiredProficiency: 'INTERMEDIATE' },
      { skill: 'Git', requiredProficiency: 'BEGINNER' },
    ],
  },
  {
    name: 'Data Analyst L1',
    description:
      'Cleans, analyses and visualises data to produce decisions-ready insights with Python, SQL and spreadsheets.',
    requirements: [
      { skill: 'Python', requiredProficiency: 'INTERMEDIATE' },
      { skill: 'SQL', requiredProficiency: 'INTERMEDIATE' },
      { skill: 'Excel', requiredProficiency: 'INTERMEDIATE' },
      { skill: 'Data Analysis', requiredProficiency: 'INTERMEDIATE' },
      { skill: 'Data Visualization', requiredProficiency: 'BEGINNER' },
      { skill: 'Statistics', requiredProficiency: 'BEGINNER' },
    ],
  },
];

// Static recommendations per skill used to enrich skill-gap results.
// type: COURSE | PROJECT | CERTIFICATION
export const RECOMMENDATIONS = {
  React: [
    {
      type: 'COURSE',
      title: 'Advanced React: Hooks, Context & Performance',
      provider: 'Meta · Coursera',
      link: 'https://www.coursera.org/professional-certificates/meta-front-end-developer',
      description:
        'Deep-dive into hooks, context, memoisation and component patterns used in production React codebases.',
    },
    {
      type: 'PROJECT',
      title: 'Ship a client project with a component design system',
      provider: 'Build lab',
      link: 'https://github.com',
      description:
        'Recreate a real dashboard UI from a Figma file and refactor it into reusable, typed components.',
    },
  ],
  JavaScript: [
    {
      type: 'COURSE',
      title: 'JavaScript: The Hard Parts (closures, async, prototypes)',
      provider: 'Frontend Masters',
      link: 'https://frontendmasters.com',
      description: 'Master the language fundamentals recruiters probe in interviews.',
    },
    {
      type: 'PROJECT',
      title: 'Implement array methods & a mini state manager from scratch',
      provider: 'Build lab',
      link: 'https://github.com',
      description: 'Write map/filter/reduce, a pub-sub store and an async task queue in vanilla JS.',
    },
  ],
  TypeScript: [
    {
      type: 'COURSE',
      title: 'TypeScript for React Developers',
      provider: 'Udemy',
      link: 'https://www.udemy.com',
      description: 'Typed props, generics and utility types for everyday component work.',
    },
  ],
  'Node.js': [
    {
      type: 'COURSE',
      title: 'Node.js: REST APIs & Testing',
      provider: 'NodeSchool / freeCodeCamp',
      link: 'https://www.freecodecamp.org',
      description: 'Express servers, middleware, file streaming and automated tests.',
    },
    {
      type: 'PROJECT',
      title: 'Build a JSON REST API with JWT auth and validation',
      provider: 'Build lab',
      link: 'https://github.com',
      description: 'A small CRUD service with hashed passwords, tokens and unit tests.',
    },
  ],
  Express: [
    {
      type: 'COURSE',
      title: 'Express.js Crash Course with Middleware & Error Handling',
      provider: 'freeCodeCamp',
      link: 'https://www.freecodecamp.org',
      description: 'Routing, middleware pipelines, validation and graceful error responses.',
    },
  ],
  'REST APIs': [
    {
      type: 'COURSE',
      title: 'API Design: REST best practices & OpenAPI',
      provider: 'Coursera',
      link: 'https://www.coursera.org',
      description: 'Resource modelling, status codes, versioning and API documentation.',
    },
    {
      type: 'PROJECT',
      title: 'Consume 3 public APIs into one dashboard',
      provider: 'Build lab',
      link: 'https://github.com',
      description: 'Fetch, transform and render data from GitHub, weather and news APIs.',
    },
  ],
  Python: [
    {
      type: 'COURSE',
      title: 'Python for Everybody',
      provider: 'University of Michigan · Coursera',
      link: 'https://www.coursera.org/specializations/python',
      description: 'Programming foundations in Python including data structures and files.',
    },
    {
      type: 'PROJECT',
      title: 'Automate a real workflow with a Python script',
      provider: 'Build lab',
      link: 'https://github.com',
      description: 'Web-scrape, clean and email a daily report — automation that saves hours.',
    },
  ],
  SQL: [
    {
      type: 'COURSE',
      title: 'SQL for Data Analysis: joins, window functions, CTEs',
      provider: 'Mode Analytics',
      link: 'https://mode.com/sql-tutorial',
      description: 'Practical SQL used daily by analysts, from SELECT to window functions.',
    },
    {
      type: 'PROJECT',
      title: 'Analyse a public dataset with 10 SQL questions',
      provider: 'Build lab',
      link: 'https://github.com',
      description: 'Load a CSV into SQLite and answer business questions with well-commented queries.',
    },
  ],
  'Data Analysis': [
    {
      type: 'COURSE',
      title: 'Google Data Analytics Professional Certificate',
      provider: 'Google · Coursera',
      link: 'https://www.coursera.org/professional-certificates/google-data-analytics',
      description: 'End-to-end analysis process: ask, prepare, process, analyse, share, act.',
    },
    {
      type: 'PROJECT',
      title: 'Full analysis notebook: ask → clean → analyse → present',
      provider: 'Build lab',
      link: 'https://github.com',
      description: 'A reproducible notebook that answers a concrete business question with charts.',
    },
  ],
  'Data Visualization': [
    {
      type: 'COURSE',
      title: 'Storytelling with Data (charts that communicate)',
      provider: 'Cole Nussbaumer Knaflic',
      link: 'https://www.storytellingwithdata.com',
      description: 'Principles of clear, honest, decision-ready charts.',
    },
    {
      type: 'CERTIFICATION',
      title: 'Data Visualisation with Python (Matplotlib & Seaborn)',
      provider: 'freeCodeCamp',
      link: 'https://www.freecodecamp.org',
      description: 'Earn a verified certificate by building visualisation projects.',
    },
  ],
  Excel: [
    {
      type: 'COURSE',
      title: 'Excel Skills for Business: Advanced',
      provider: 'Macquarie University · Coursera',
      link: 'https://www.coursera.org/specializations/excel',
      description: 'Pivot tables, XLOOKUP, Power Query and dashboard spreadsheets.',
    },
  ],
  Statistics: [
    {
      type: 'COURSE',
      title: 'Statistics & Probability foundations for data work',
      provider: 'Khan Academy',
      link: 'https://www.khanacademy.org',
      description: 'Distributions, hypothesis testing and confidence intervals with intuition first.',
    },
  ],
  'Machine Learning': [
    {
      type: 'COURSE',
      title: 'Machine Learning Specialisation',
      provider: 'Andrew Ng · Coursera',
      link: 'https://www.coursera.org/specializations/machine-learning-introduction',
      description: 'Supervised & unsupervised learning with scikit-learn practice.',
    },
    {
      type: 'PROJECT',
      title: 'Predict & explain: one full ML mini-project',
      provider: 'Build lab',
      link: 'https://github.com',
      description: 'Train a small model, evaluate honestly and explain results to non-experts.',
    },
  ],
  Git: [
    {
      type: 'COURSE',
      title: 'Git & GitHub: branching, PRs and code review',
      provider: 'GitHub Skills',
      link: 'https://skills.github.com',
      description: 'Practice feature branches, pull requests and resolving merge conflicts.',
    },
    {
      type: 'CERTIFICATION',
      title: 'Version control with Git (verified)',
      provider: 'freeCodeCamp',
      link: 'https://www.freecodecamp.org',
      description: 'A certificate proving hands-on command-line Git fluency.',
    },
  ],
  'Cloud Basics': [
    {
      type: 'COURSE',
      title: 'Cloud Foundations: IaaS/PaaS/SaaS & deployment',
      provider: 'AWS Educate / Azure Learn',
      link: 'https://aws.amazon.com/education/awseducate',
      description: 'Deploy one app to the cloud and understand core services.',
    },
    {
      type: 'PROJECT',
      title: 'Deploy a small app + database to a free cloud tier',
      provider: 'Build lab',
      link: 'https://render.com',
      description: 'Ship something real end-to-end and document the architecture.',
    },
  ],
  Docker: [
    {
      type: 'COURSE',
      title: 'Docker for Developers (images, containers, compose)',
      provider: 'Docker Curriculum',
      link: 'https://docker-curriculum.com',
      description: 'Containerise a small app and run a multi-service stack with Compose.',
    },
  ],
  'Tailwind CSS': [
    {
      type: 'COURSE',
      title: 'Tailwind CSS: utility-first UI patterns',
      provider: 'Tailwind UI docs',
      link: 'https://tailwindcss.com/docs',
      description: 'Build responsive, accessible layouts with the utility API.',
    },
    {
      type: 'PROJECT',
      title: 'Re-skin an existing page with a design system',
      provider: 'Build lab',
      link: 'https://github.com',
      description: 'Apply consistent spacing, colour tokens and components to a real page.',
    },
  ],
  'HTML/CSS': [
    {
      type: 'COURSE',
      title: 'Responsive Web Design Certification',
      provider: 'freeCodeCamp',
      link: 'https://www.freecodecamp.org',
      description: 'Semantic HTML, flexbox, grid and accessibility fundamentals.',
    },
  ],
  Communication: [
    {
      type: 'COURSE',
      title: 'Technical Communication for Engineers',
      provider: 'edX',
      link: 'https://www.edx.org',
      description: 'Write clear docs, present technical work and run effective stand-ups.',
    },
    {
      type: 'PROJECT',
      title: 'Present your capstone as a 5-minute demo + write-up',
      provider: 'Build lab',
      link: 'https://github.com',
      description: 'Practise turning technical work into a story non-experts can follow.',
    },
  ],
  Teamwork: [
    {
      type: 'PROJECT',
      title: 'Join a cross-functional open-source or college project',
      provider: 'Build lab',
      link: 'https://github.com',
      description: 'Contribute to a team codebase with reviews, issues and pair work.',
    },
  ],
  'Problem Solving': [
    {
      type: 'CERTIFICATION',
      title: 'Data Structures & Algorithms practice track',
      provider: 'LeetCode / HackerRank',
      link: 'https://leetcode.com',
      description: 'Consistent daily problems build the analytical habits recruiters screen for.',
    },
  ],
};

// Keywords recruiters mention in feedback that should surface as curriculum themes.
export const FEEDBACK_THEMES = [
  { keyword: 'communicat', label: 'Technical communication', note: 'recruiter feedback repeatedly mentions communication gaps' },
  { keyword: 'collaborat', label: 'Collaboration & teamwork', note: 'recruiters flag teamwork in project hand-offs' },
  { keyword: 'git', label: 'Version control (Git)', note: 'recruiters want Git baked into coursework' },
  { keyword: 'sql', label: 'SQL & database fluency', note: 'feedback calls for stronger database work' },
  { keyword: 'python', label: 'Python proficiency', note: 'feedback points at Python for analysis work' },
  { keyword: 'cloud', label: 'Cloud fundamentals', note: 'recruiters expect basic cloud deployment exposure' },
  { keyword: 'testing', label: 'Testing & code quality', note: 'feedback asks for unit-testing habits' },
  { keyword: 'writing', label: 'Documentation & writing', note: 'feedback notes weak technical writing' },
];
