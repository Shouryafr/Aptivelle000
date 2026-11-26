import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { SKILLS, ROLES, RECOMMENDATIONS } from '../src/data/catalog.js';

const prisma = new PrismaClient();

const INST_A = 'Indus Institute of Technology';
const INST_B = 'Pacific Institute of Engineering';

async function main() {
  console.log('Seeding Aptivelle demo database…');

  // ---- wipe (demo DB, idempotent seed) ----
  await prisma.recruiterFeedback.deleteMany();
  await prisma.application.deleteMany();
  await prisma.course.deleteMany();
  await prisma.project.deleteMany();
  await prisma.studentSkill.deleteMany();
  await prisma.internship.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.facultyProfile.deleteMany();
  await prisma.recruiterProfile.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.roleSkillRequirement.deleteMany();
  await prisma.role.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('demo1234', 10);
  const normalHash = await bcrypt.hash('password123', 10);

  // ---- skills ----
  const skillIdByName = {};
  for (const s of SKILLS) {
    const row = await prisma.skill.create({ data: { name: s.name, category: s.category } });
    skillIdByName[s.name] = row.id;
  }

  // ---- roles + requirements ----
  const roleIdByName = {};
  for (const r of ROLES) {
    const role = await prisma.role.create({
      data: {
        name: r.name,
        description: r.description,
        requirements: {
          create: r.requirements.map((req) => ({
            skillId: skillIdByName[req.skill],
            requiredProficiency: req.requiredProficiency,
          })),
        },
      },
    });
    roleIdByName[r.name] = role.id;
  }

  // ---- recommendations ----
  for (const [skillName, list] of Object.entries(RECOMMENDATIONS)) {
    for (const rec of list) {
      await prisma.recommendation.create({
        data: {
          skillId: skillIdByName[skillName],
          type: rec.type,
          title: rec.title,
          provider: rec.provider,
          link: rec.link || null,
          description: rec.description,
        },
      });
    }
  }

  // ---- users helper ----
  const users = {};
  async function makeUser(name, email, role, hash) {
    const user = await prisma.user.create({
      data: { name, email, passwordHash: hash, role },
    });
    users[email] = user;
    return user;
  }

  // ---- faculty ----
  const demoFaculty = await makeUser('Dr. Meera Nair', 'faculty@aptivelle.in', 'FACULTY', passwordHash);
  await prisma.facultyProfile.create({
    data: {
      userId: demoFaculty.id,
      institute: INST_A,
      department: 'Computer Science',
      designation: 'Professor & TPO Coordinator',
    },
  });

  const vikram = await makeUser('Vikram Joshi', 'vikram.joshi@aptivelle.in', 'FACULTY', normalHash);
  await prisma.facultyProfile.create({
    data: {
      userId: vikram.id,
      institute: INST_A,
      department: 'Information Technology',
      designation: 'Training & Placement Officer',
    },
  });

  const sunita = await makeUser('Dr. Sunita Deshmukh', 'sunita.deshmukh@aptivelle.in', 'FACULTY', normalHash);
  await prisma.facultyProfile.create({
    data: {
      userId: sunita.id,
      institute: INST_B,
      department: 'Computer Science',
      designation: 'Associate Professor',
    },
  });

  // ---- recruiters ----
  const demoRecruiter = await makeUser('Neha Kapoor', 'recruiter@aptivelle.in', 'RECRUITER', passwordHash);
  const zephyr = await prisma.recruiterProfile.create({
    data: {
      userId: demoRecruiter.id,
      company: 'Zephyr Technologies',
      designation: 'Talent Acquisition Lead',
      companyWebsite: 'https://zephyrtech.example',
    },
  });

  const arjun = await makeUser('Arjun Malhotra', 'arjun.malhotra@aptivelle.in', 'RECRUITER', normalHash);
  const nimbus = await prisma.recruiterProfile.create({
    data: {
      userId: arjun.id,
      company: 'Nimbus Analytics',
      designation: 'Engineering Manager',
      companyWebsite: 'https://nimbus.example',
    },
  });

  const farah = await makeUser('Farah Khan', 'farah.khan@aptivelle.in', 'RECRUITER', normalHash);
  const codecraft = await prisma.recruiterProfile.create({
    data: {
      userId: farah.id,
      company: 'CodeCraft Labs',
      designation: 'Hiring Manager',
      companyWebsite: 'https://codecraft.example',
    },
  });

  // ---- students ----
  // skill entries: [name, proficiency, source]
  // courses: { title, provider, link, certificateLink, skillNames, status }
  // projects: { title, description, link, skillsUsed }
  const students = [
    {
      name: 'Aarav Sharma',
      email: 'student@aptivelle.in',
      hash: passwordHash,
      institute: INST_A,
      branch: 'CSE',
      year: '4th',
      targetRoles: ['Frontend Developer L1', 'Backend Developer L1'],
      resumeText:
        'Final-year CSE student. Built an LMS dashboard with React, TypeScript and Tailwind. Wrote REST APIs in Node.js and practised Git on every project. Exploring Docker for local dev environments.',
      skills: [
        ['JavaScript', 'INTERMEDIATE', 'RESUME'],
        ['React', 'INTERMEDIATE', 'MANUAL'],
        ['HTML/CSS', 'ADVANCED', 'RESUME'],
        ['Tailwind CSS', 'INTERMEDIATE', 'MANUAL'],
        ['Git', 'INTERMEDIATE', 'RESUME'],
        ['REST APIs', 'BEGINNER', 'MANUAL'],
        ['Node.js', 'BEGINNER', 'PROJECT'],
        ['Communication', 'INTERMEDIATE', 'MANUAL'],
      ],
      projects: [
        { title: 'EdVault — LMS analytics dashboard', description: 'Role-based student dashboard with charts, search and dark mode, fetching live data from a REST API.', link: 'https://github.com', skillsUsed: ['React', 'Tailwind CSS', 'REST APIs'] },
        { title: 'Personal portfolio with theme toggle', description: 'Static site generator-free portfolio, fully responsive, Lighthouse 95+.', link: 'https://github.com', skillsUsed: ['JavaScript', 'HTML/CSS'] },
      ],
      courses: [
        { title: 'Meta Front-End Developer Certificate', provider: 'Coursera', link: 'https://www.coursera.org', certificateLink: 'https://coursera.org/verify/ABC123', skillNames: ['React', 'JavaScript', 'HTML/CSS'], status: 'VERIFIED' },
        { title: 'The Complete React Developer (Hooks + Redux)', provider: 'Udemy', link: 'https://www.udemy.com', certificateLink: 'https://udemy.com/certificate/UC-X9', skillNames: ['React', 'TypeScript'], status: 'PENDING' },
        { title: 'Build Responsive Real-World Websites', provider: 'Udemy', link: 'https://www.udemy.com', skillNames: ['HTML/CSS', 'Tailwind CSS'], status: 'PENDING' },
      ],
    },
    {
      name: 'Ananya Iyer',
      email: 'ananya.iyer@aptivelle.in',
      hash: normalHash,
      institute: INST_A,
      branch: 'CSE',
      year: '3rd',
      targetRoles: ['Backend Developer L1', 'Frontend Developer L1'],
      resumeText:
        'Built REST APIs with Node.js and Express, designed SQL schemas, and consumed APIs in small React apps. Comfortable with Git branching and code reviews.',
      skills: [
        ['JavaScript', 'INTERMEDIATE', 'RESUME'],
        ['Node.js', 'INTERMEDIATE', 'RESUME'],
        ['Express', 'BEGINNER', 'COURSE'],
        ['SQL', 'BEGINNER', 'COURSE'],
        ['REST APIs', 'INTERMEDIATE', 'MANUAL'],
        ['Git', 'INTERMEDIATE', 'MANUAL'],
        ['React', 'BEGINNER', 'PROJECT'],
        ['TypeScript', 'BEGINNER', 'MANUAL'],
        ['Python', 'BEGINNER', 'MANUAL'],
        ['Communication', 'INTERMEDIATE', 'MANUAL'],
      ],
      projects: [
        { title: 'College events ticketing API', description: 'Express + SQLite backend with JWT auth, role guards and rate limiting; OpenAPI documented.', link: 'https://github.com', skillsUsed: ['Node.js', 'Express', 'SQL'] },
        { title: 'Weather dashboard', description: 'React SPA consuming a public weather API with search and unit tests.', link: 'https://github.com', skillsUsed: ['React', 'JavaScript', 'REST APIs'] },
      ],
      courses: [
        { title: 'Backend Specialization — Node.js APIs', provider: 'Coursera', link: 'https://www.coursera.org', certificateLink: 'https://coursera.org/verify/DEF456', skillNames: ['Node.js', 'Express', 'REST APIs'], status: 'VERIFIED' },
        { title: 'SQL for Data Science', provider: 'Coursera', link: 'https://www.coursera.org', certificateLink: 'https://coursera.org/verify/GHI789', skillNames: ['SQL'], status: 'PENDING' },
        { title: 'System Design for Beginners', provider: 'Udemy', link: 'https://www.udemy.com', skillNames: ['Cloud Basics'], status: 'PENDING' },
      ],
    },
    {
      name: 'Rohan Mehta',
      email: 'rohan.mehta@aptivelle.in',
      hash: normalHash,
      institute: INST_A,
      branch: 'IT',
      year: '3rd',
      targetRoles: ['Frontend Developer L1'],
      resumeText:
        'UI-focused developer. Shipped a music player UI and a vanilla JS expense splitter. Learning advanced React patterns and writing clean, accessible markup.',
      skills: [
        ['JavaScript', 'INTERMEDIATE', 'MANUAL'],
        ['React', 'INTERMEDIATE', 'COURSE'],
        ['HTML/CSS', 'INTERMEDIATE', 'RESUME'],
        ['Git', 'BEGINNER', 'RESUME'],
        ['Tailwind CSS', 'BEGINNER', 'PROJECT'],
        ['REST APIs', 'BEGINNER', 'MANUAL'],
        ['TypeScript', 'BEGINNER', 'COURSE'],
        ['Communication', 'BEGINNER', 'MANUAL'],
      ],
      projects: [
        { title: 'Music streaming UI clone', description: 'Pixel-faithful clone of a streaming interface with virtualised lists and keyboard navigation.', link: 'https://github.com', skillsUsed: ['React', 'Tailwind CSS'] },
        { title: 'Expense splitter (vanilla JS)', description: 'Local-first app that splits bills, with CSV export and print views.', link: 'https://github.com', skillsUsed: ['JavaScript', 'HTML/CSS'] },
      ],
      courses: [
        { title: 'React & Redux Masterclass', provider: 'Udemy', link: 'https://www.udemy.com', certificateLink: 'https://udemy.com/certificate/UC-RM22', skillNames: ['React', 'JavaScript', 'TypeScript'], status: 'VERIFIED' },
        { title: 'Frontend Interview Preparation', provider: 'InterviewReady', link: 'https://www.interviewready.example', skillNames: ['Communication', 'Problem Solving'], status: 'PENDING' },
      ],
    },
    {
      name: 'Priya Kulkarni',
      email: 'priya.kulkarni@aptivelle.in',
      hash: normalHash,
      institute: INST_A,
      branch: 'Data Science',
      year: '4th',
      targetRoles: ['Data Analyst L1'],
      resumeText:
        'Analytics intern experience. Cleaned 2 years of retail sales data in Python and SQL, built dashboards in Excel and Power BI, and presented findings to non-technical stakeholders.',
      skills: [
        ['Python', 'ADVANCED', 'MANUAL'],
        ['SQL', 'INTERMEDIATE', 'COURSE'],
        ['Excel', 'ADVANCED', 'RESUME'],
        ['Data Analysis', 'INTERMEDIATE', 'COURSE'],
        ['Data Visualization', 'INTERMEDIATE', 'RESUME'],
        ['Statistics', 'BEGINNER', 'MANUAL'],
        ['Machine Learning', 'BEGINNER', 'COURSE'],
        ['Communication', 'INTERMEDIATE', 'MANUAL'],
        ['Teamwork', 'INTERMEDIATE', 'MANUAL'],
      ],
      projects: [
        { title: 'Retail sales analysis dashboard', description: 'End-to-end analysis answering churn and seasonality questions; Jupyter notebook + Excel dashboard.', link: 'https://github.com', skillsUsed: ['Python', 'Data Analysis', 'Data Visualization', 'Excel'] },
        { title: 'Churn prediction notebook', description: 'Trained and honestly evaluated a small ML model; wrote an explainer for non-experts.', link: 'https://github.com', skillsUsed: ['Python', 'Machine Learning', 'Statistics'] },
      ],
      courses: [
        { title: 'Google Data Analytics Professional Certificate', provider: 'Coursera', link: 'https://www.coursera.org', certificateLink: 'https://coursera.org/verify/JKL012', skillNames: ['SQL', 'Data Analysis', 'Data Visualization', 'Excel'], status: 'VERIFIED' },
        { title: 'Python for Data Science and ML', provider: 'Coursera', link: 'https://www.coursera.org', certificateLink: 'https://coursera.org/verify/MNO345', skillNames: ['Python', 'Machine Learning', 'Statistics'], status: 'PENDING' },
        { title: 'Storytelling with Data', provider: 'Cole Nussbaumer Knaflic', link: 'https://www.storytellingwithdata.com', skillNames: ['Communication', 'Data Visualization'], status: 'PENDING' },
      ],
    },
    {
      name: 'Kabir Singh',
      email: 'kabir.singh@aptivelle.in',
      hash: normalHash,
      institute: INST_A,
      branch: 'ECE',
      year: '4th',
      targetRoles: ['Backend Developer L1'],
      resumeText:
        'ECE graduate-to-be who pivoted to software. Built IoT logging services in Python and Node.js, wired sensors to REST endpoints, and containerised a demo with Docker.',
      skills: [
        ['Python', 'INTERMEDIATE', 'MANUAL'],
        ['SQL', 'BEGINNER', 'COURSE'],
        ['JavaScript', 'BEGINNER', 'MANUAL'],
        ['Node.js', 'BEGINNER', 'PROJECT'],
        ['REST APIs', 'BEGINNER', 'MANUAL'],
        ['Git', 'BEGINNER', 'MANUAL'],
        ['Docker', 'BEGINNER', 'COURSE'],
        ['Problem Solving', 'ADVANCED', 'MANUAL'],
        ['Communication', 'INTERMEDIATE', 'MANUAL'],
      ],
      projects: [
        { title: 'IoT sensor logging service', description: 'Ingests sensor telemetry into SQLite, exposes a query API, alerts on thresholds.', link: 'https://github.com', skillsUsed: ['Python', 'Node.js', 'SQL'] },
        { title: 'Home automation controller', description: 'REST API controlling smart plugs with schedules and voice-assistant integration.', link: 'https://github.com', skillsUsed: ['Python', 'REST APIs'] },
      ],
      courses: [
        { title: 'SQL & Database Fundamentals', provider: 'Coursera', link: 'https://www.coursera.org', certificateLink: 'https://coursera.org/verify/PQR678', skillNames: ['SQL'], status: 'VERIFIED' },
        { title: 'Docker Essentials for Developers', provider: 'Udemy', link: 'https://www.udemy.com', skillNames: ['Docker'], status: 'PENDING' },
      ],
    },
    {
      name: 'Sneha Patil',
      email: 'sneha.patil@aptivelle.in',
      hash: normalHash,
      institute: INST_A,
      branch: 'CSE',
      year: '2nd',
      targetRoles: ['Frontend Developer L1'],
      resumeText:
        'Second-year student learning the web. Comfortable with semantic HTML and responsive CSS, currently taking a React beginner track.',
      skills: [
        ['JavaScript', 'BEGINNER', 'RESUME'],
        ['HTML/CSS', 'INTERMEDIATE', 'RESUME'],
        ['React', 'BEGINNER', 'COURSE'],
        ['Git', 'BEGINNER', 'MANUAL'],
        ['Python', 'BEGINNER', 'MANUAL'],
        ['Communication', 'INTERMEDIATE', 'MANUAL'],
      ],
      projects: [
        { title: 'Personal blog on GitHub Pages', description: 'Markdown-driven blog with responsive layouts and an accessible nav.', link: 'https://github.com', skillsUsed: ['HTML/CSS', 'JavaScript'] },
      ],
      courses: [
        { title: 'Introduction to Web Development', provider: 'freeCodeCamp', link: 'https://www.freecodecamp.org', skillNames: ['JavaScript', 'HTML/CSS'], status: 'PENDING' },
        { title: 'React for Beginners', provider: 'Scrimba', link: 'https://scrimba.com', skillNames: ['React'], status: 'PENDING' },
      ],
    },
    {
      name: 'Aditya Rao',
      email: 'aditya.rao@aptivelle.in',
      hash: normalHash,
      institute: INST_B,
      branch: 'Mechanical',
      year: '3rd',
      targetRoles: ['Data Analyst L1'],
      resumeText:
        'Mechanical engineering student with operations experience. Analysed production downtime with Excel and SQL; now learning Python for deeper analysis.',
      skills: [
        ['Excel', 'ADVANCED', 'RESUME'],
        ['SQL', 'BEGINNER', 'COURSE'],
        ['Python', 'BEGINNER', 'MANUAL'],
        ['Data Analysis', 'BEGINNER', 'PROJECT'],
        ['Communication', 'ADVANCED', 'MANUAL'],
        ['Teamwork', 'INTERMEDIATE', 'MANUAL'],
        ['Problem Solving', 'INTERMEDIATE', 'MANUAL'],
      ],
      projects: [
        { title: 'Production downtime analysis', description: 'Root-caused 3 months of line downtime using pivot tables and SQL extracts; saved an estimated 8 hrs/week of manual reporting.', link: 'https://github.com', skillsUsed: ['Excel', 'Data Analysis'] },
      ],
      courses: [
        { title: 'SQL for Business Analysts', provider: 'Coursera', link: 'https://www.coursera.org', certificateLink: 'https://coursera.org/verify/STU901', skillNames: ['SQL'], status: 'VERIFIED' },
        { title: 'Excel & Power BI Dashboards', provider: 'Udemy', link: 'https://www.udemy.com', skillNames: ['Excel', 'Data Visualization'], status: 'PENDING' },
      ],
    },
    {
      name: 'Ishaan Verma',
      email: 'ishaan.verma@aptivelle.in',
      hash: normalHash,
      institute: INST_B,
      branch: 'IT',
      year: '2nd',
      targetRoles: ['Backend Developer L1', 'Data Analyst L1'],
      resumeText:
        'Second-year IT student building a foundation: JavaScript logic, SQL queries and spreadsheet modelling. Starting an open-source contribution journey.',
      skills: [
        ['JavaScript', 'INTERMEDIATE', 'COURSE'],
        ['Python', 'BEGINNER', 'MANUAL'],
        ['SQL', 'BEGINNER', 'MANUAL'],
        ['Excel', 'INTERMEDIATE', 'MANUAL'],
        ['Git', 'BEGINNER', 'MANUAL'],
        ['Communication', 'BEGINNER', 'MANUAL'],
        ['Problem Solving', 'BEGINNER', 'COURSE'],
      ],
      projects: [
        { title: 'Library management CLI', description: 'Command-line tool in JavaScript backed by a SQLite DB with fine-grained queries.', link: 'https://github.com', skillsUsed: ['JavaScript', 'SQL'] },
      ],
      courses: [
        { title: 'JavaScript Essentials', provider: 'Coursera', link: 'https://www.coursera.org', certificateLink: 'https://coursera.org/verify/VWX234', skillNames: ['JavaScript', 'Problem Solving'], status: 'VERIFIED' },
        { title: 'First Steps in Data Analytics', provider: 'edX', link: 'https://www.edx.org', skillNames: ['Data Analysis', 'Excel'], status: 'PENDING' },
      ],
    },
  ];

  const studentProfileIdByName = {};
  for (const def of students) {
    const user = await makeUser(def.name, def.email, 'STUDENT', def.hash);
    const profile = await prisma.studentProfile.create({
      data: {
        userId: user.id,
        institute: def.institute,
        branch: def.branch,
        year: def.year,
        targetRoles: JSON.stringify(def.targetRoles),
        resumeText: def.resumeText,
      },
    });
    studentProfileIdByName[def.name] = profile.id;

    // Skills declared explicitly on the profile.
    const skillEntries = new Map();
    for (const [name, proficiency, source] of def.skills) {
      skillEntries.set(name, { name, proficiency, source });
    }
    // Skills that come from tagged courses (source COURSE).
    for (const course of def.courses) {
      for (const name of course.skillNames) {
        if (!skillEntries.has(name)) {
          skillEntries.set(name, { name, proficiency: 'BEGINNER', source: 'COURSE' });
        }
      }
    }

    // Insert skill rows.
    for (const entry of skillEntries.values()) {
      await prisma.studentSkill.create({
        data: {
          studentProfileId: profile.id,
          skillId: skillIdByName[entry.name],
          proficiency: entry.proficiency,
          source: entry.source,
        },
      });
    }

    // Projects.
    for (const p of def.projects) {
      await prisma.project.create({
        data: {
          studentProfileId: profile.id,
          title: p.title,
          description: p.description,
          link: p.link,
          skillsUsed: JSON.stringify(p.skillsUsed),
        },
      });
    }

    // Courses (PENDING by default; VERIFIED for a marked subset).
    for (const c of def.courses) {
      await prisma.course.create({
        data: {
          studentProfileId: profile.id,
          title: c.title,
          provider: c.provider,
          link: c.link || null,
          certificateLink: c.certificateLink || null,
          skillNames: JSON.stringify(c.skillNames),
          verificationStatus: c.status || 'PENDING',
          verifiedAt: c.status === 'VERIFIED' ? new Date() : null,
        },
      });
    }

    // Verification: any skill tagged by at least one VERIFIED course is verified.
    const verifiedSkills = new Set(
      def.courses
        .filter((c) => c.status === 'VERIFIED')
        .flatMap((c) => c.skillNames)
    );
    if (verifiedSkills.size) {
      const rows = await prisma.skill.findMany({
        where: { name: { in: [...verifiedSkills] } },
        select: { id: true },
      });
      await prisma.studentSkill.updateMany({
        where: { studentProfileId: profile.id, skillId: { in: rows.map((r) => r.id) } },
        data: { isVerified: true },
      });
    }
  }

  // ---- internships ----
  const internships = [
    { recruiter: 'zephyr', title: 'Frontend Developer Intern (React.js)', description: 'Build and refine core product UI with the design team — components, dashboards and delightful micro-interactions.', location: 'Remote', stipend: 15000, duration: '6 months', requiredSkills: ['React', 'JavaScript', 'HTML/CSS', 'Git'], targetRoles: ['Frontend Developer L1'] },
    { recruiter: 'zephyr', title: 'Full-Stack Developer Intern', description: 'Own small end-to-end features across a React SPA and a Node.js API, from schema to shipped UI.', location: 'Bengaluru', stipend: 20000, duration: '6 months', requiredSkills: ['JavaScript', 'React', 'Node.js', 'REST APIs', 'Git'], targetRoles: ['Frontend Developer L1', 'Backend Developer L1'] },
    { recruiter: 'zephyr', title: 'Product Support Analyst Intern', description: 'Investigate customer-reported issues, reproduce bugs and translate feedback into clear engineering tickets.', location: 'Remote', stipend: 9000, duration: '3 months', requiredSkills: ['Communication', 'SQL', 'Excel', 'Problem Solving'], targetRoles: ['Data Analyst L1'] },
    { recruiter: 'nimbus', title: 'Data Analyst Intern', description: 'Work with analytics leads on client dashboards: wrangle data in SQL/Python, visualise insights and present findings.', location: 'Bengaluru', stipend: 18000, duration: '6 months', requiredSkills: ['Python', 'SQL', 'Data Analysis', 'Data Visualization', 'Excel'], targetRoles: ['Data Analyst L1'] },
    { recruiter: 'nimbus', title: 'Data Engineering Intern', description: 'Help build reliable data pipelines on cloud infrastructure. Python and SQL fluency expected; curiosity rewarded.', location: 'Hyderabad', stipend: 25000, duration: '6 months', requiredSkills: ['Python', 'SQL', 'Cloud Basics', 'Git'], targetRoles: ['Backend Developer L1', 'Data Analyst L1'] },
    { recruiter: 'nimbus', title: 'Business Analytics Intern', description: 'Turn messy spreadsheets into structured analyses that shape client go-to-market decisions.', location: 'Remote', stipend: 10000, duration: '3 months', requiredSkills: ['Excel', 'SQL', 'Data Analysis', 'Communication'], targetRoles: ['Data Analyst L1'] },
    { recruiter: 'codecraft', title: 'Backend Developer Intern (Node.js)', description: 'Design REST endpoints, model data and write tests for client-facing APIs on Express.', location: 'Remote', stipend: 16000, duration: '6 months', requiredSkills: ['Node.js', 'Express', 'JavaScript', 'REST APIs', 'Git'], targetRoles: ['Backend Developer L1'] },
    { recruiter: 'codecraft', title: 'Frontend Developer Intern (Design Systems)', description: 'Extend an internal component library and apply design tokens across marketing sites.', location: 'Pune', stipend: 12000, duration: '6 months', requiredSkills: ['React', 'JavaScript', 'HTML/CSS', 'Tailwind CSS'], targetRoles: ['Frontend Developer L1'] },
    { recruiter: 'codecraft', title: 'Data Visualization Intern', description: 'Design and build charts and interactive reports that make dense data easy to read.', location: 'Remote', stipend: 8000, duration: '3 months', requiredSkills: ['Data Visualization', 'Excel', 'Python', 'Communication'], targetRoles: ['Data Analyst L1'] },
    { recruiter: 'codecraft', title: 'DevOps Intern (CI/CD Focus)', description: 'Containerise services, script pipelines and improve developer tooling. Stipend is stipend-free — you leave with deep CI/CD reps.', location: 'Mumbai', stipend: 0, duration: '3 months', requiredSkills: ['Git', 'Docker', 'Cloud Basics'], targetRoles: ['Backend Developer L1'] },
  ];

  const internshipIdByTitle = {};
  const recruiterProfileByKey = { zephyr, nimbus, codecraft };
  for (const i of internships) {
    const row = await prisma.internship.create({
      data: {
        recruiterProfileId: recruiterProfileByKey[i.recruiter].id,
        title: i.title,
        description: i.description,
        location: i.location,
        stipend: i.stipend,
        duration: i.duration,
        requiredSkills: JSON.stringify(i.requiredSkills),
        targetRoles: JSON.stringify(i.targetRoles),
      },
    });
    internshipIdByTitle[i.title] = row.id;
  }

  // ---- applications ----
  const byName = (name) => ({ studentProfileId: studentProfileIdByName[name] });
  const applications = [
    // Zephyr pool (the demo recruiter sees a rich funnel).
    ['Frontend Developer Intern (React.js)', 'Aarav Sharma', 'SHORTLISTED'],
    ['Frontend Developer Intern (React.js)', 'Rohan Mehta', 'APPLIED'],
    ['Frontend Developer Intern (React.js)', 'Sneha Patil', 'APPLIED'],
    ['Frontend Developer Intern (React.js)', 'Ishaan Verma', 'REJECTED'],
    ['Full-Stack Developer Intern', 'Aarav Sharma', 'APPLIED'],
    ['Full-Stack Developer Intern', 'Ananya Iyer', 'SHORTLISTED'],
    ['Full-Stack Developer Intern', 'Rohan Mehta', 'APPLIED'],
    ['Product Support Analyst Intern', 'Priya Kulkarni', 'APPLIED'],
    ['Product Support Analyst Intern', 'Aditya Rao', 'APPLIED'],
    // Nimbus pool.
    ['Data Analyst Intern', 'Priya Kulkarni', 'COMPLETED'],
    ['Data Analyst Intern', 'Ananya Iyer', 'APPLIED'],
    ['Data Engineering Intern', 'Priya Kulkarni', 'APPLIED'],
    ['Data Engineering Intern', 'Kabir Singh', 'APPLIED'],
    ['Data Engineering Intern', 'Aditya Rao', 'REJECTED'],
    ['Business Analytics Intern', 'Aditya Rao', 'APPLIED'],
    // CodeCraft pool.
    ['Backend Developer Intern (Node.js)', 'Ananya Iyer', 'SHORTLISTED'],
    ['Backend Developer Intern (Node.js)', 'Kabir Singh', 'APPLIED'],
    ['Backend Developer Intern (Node.js)', 'Sneha Patil', 'REJECTED'],
    ['Frontend Developer Intern (Design Systems)', 'Aarav Sharma', 'APPLIED'],
    ['Frontend Developer Intern (Design Systems)', 'Rohan Mehta', 'SHORTLISTED'],
    ['Data Visualization Intern', 'Priya Kulkarni', 'COMPLETED'],
    ['DevOps Intern (CI/CD Focus)', 'Kabir Singh', 'APPLIED'],
    ['DevOps Intern (CI/CD Focus)', 'Ishaan Verma', 'APPLIED'],
  ];

  let idx = 0;
  for (const [title, student, status] of applications) {
    idx += 1;
    await prisma.application.create({
      data: {
        internshipId: internshipIdByTitle[title],
        studentProfileId: studentProfileIdByName[student],
        status,
        appliedAt: new Date(Date.now() - idx * 16 * 3600 * 1000),
      },
    });
  }

  // ---- recruiter feedback ----
  const feedback = [
    ['Frontend Developer Intern (React.js)', 'zephyr', 5, 'Aarav showed strong React fundamentals and shipped tasks quickly. Please push students to practise cleaner Git workflows (branching + PRs).'],
    ['Full-Stack Developer Intern', 'zephyr', 4, 'Ananya and Rohan ramped fast. More exposure to writing tests and reviewing code would help.',],
    ['Product Support Analyst Intern', 'zephyr', 4, 'Good writing and patience with customers. Deeper SQL practice recommended before placement.'],
    ['Data Analyst Intern', 'nimbus', 4, 'Analysis quality was high. Students should improve data storytelling and communication of findings to non-technical stakeholders.'],
    ['Data Engineering Intern', 'nimbus', 2, 'Python basics were fine, but cloud fundamentals and SQL under time pressure were weak. Stand-up communication needs work.'],
    ['Backend Developer Intern (Node.js)', 'codecraft', 3, 'Solid API fundamentals. Collaboration across teams and version control hygiene need improvement.'],
    ['Data Visualization Intern', 'codecraft', 4, 'Charts looked professional. Encourage clearer documentation and more rigorous testing habits.'],
  ];

  for (const [title, recruiter, rating, comments] of feedback) {
    await prisma.recruiterFeedback.create({
      data: {
        internshipId: internshipIdByTitle[title],
        recruiterProfileId: recruiterProfileByKey[recruiter].id,
        readinessRating: rating,
        comments,
      },
    });
  }

  const counts = {
    users: await prisma.user.count(),
    skills: await prisma.skill.count(),
    roles: await prisma.role.count(),
    internships: await prisma.internship.count(),
    applications: await prisma.application.count(),
    feedback: await prisma.recruiterFeedback.count(),
    courses: await prisma.course.count(),
  };
  console.log('Seed complete:', counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
