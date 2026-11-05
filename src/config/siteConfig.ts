export const siteConfig = {
  name: 'My Personal Hub',
  tagline: 'Ideas, projects, and writing in one creative home.',
  intro:
    'This is my corner of the internet for sharing projects, writing, and things I am exploring.',
  email: 'colinmccu@outlook.com',
  socials: {
    github: 'https://github.com/example',
    linkedin: 'https://linkedin.com/in/example',
    instagram: 'https://instagram.com/example',
  },
  resumePdfUrl: '/resume.pdf',
  minecraftArchiveUrl: 'https://minecraft.example.com',
  resume: {
    summary:
      'IT Field Service Technician providing enterprise desktop support and endpoint lifecycle management across clinical and administrative environments in the UK HealthCare system.',
    experience: [
      {
        company: 'UK Healthcare',
        title: 'IT Field Service Technician',
        location: 'Lexington, KY',
        dates: 'December 2023 – Current',
        bullets: [
          {
            text: 'Provide enterprise desktop support and endpoint lifecycle management across multiple clinical and administrative environments within the UK HealthCare system.',
          },
          {
            text: 'Led endpoint deployments for a large-scale Windows 11 enterprise refresh project involving over 4,000 devices, ensuring seamless transition for clinical and administrative staff.',
          },
          {
            text: 'Perform enterprise device imaging and operating system deployment using PXE boot environments, including BIOS configuration, driver management, and automated deployment scripts.',
          },
          {
            text: 'Manage Active Directory device placement and organizational unit assignments to ensure correct Group Policy application and network resource access.',
          },
          {
            text: 'Utilize SCCM and Intune to monitor device connectivity, verify system compliance, and troubleshoot software deployments and update failures.',
          },
          {
            text: 'Administer Mac device management through JAMF, supporting configuration, troubleshooting, and system updates for enterprise macOS environments.',
          },
          {
            text: 'Use Dell Command Update daily to maintain hardware driver and firmware compliance across deployed systems.',
          },
          {
            text: 'Support enterprise infrastructure, including Active Directory, Group Policy, DNS, DHCP, network authentication, and enterprise file shares.',
          },
          {
            text: 'Troubleshot and resolved complex hardware and endpoint issues, including:',
            subItems: [
              'Docking station and multi-monitor display failures',
              'USB-C controller and hardware interface issues',
              'Driver conflicts and OS-level device failures',
              'VPN connectivity problems',
              'User profile corruption',
              'Network authentication and connectivity issues',
            ],
          },
          {
            text: 'Support enterprise clinical systems, including EPIC, Citrix environments, VMware Horizon, and thin client endpoints.',
          },
          {
            text: 'Participated in multi-site IT deployments across the Lexington region, supporting multiple clinics and hospital facilities.',
          },
          {
            text: 'Utilized PowerShell, batch scripting, and CLI tools to automate device configuration tasks, install software packages, and perform system diagnostics.',
          },
          {
            text: 'Assisted with software deployment validation and troubleshooting through System Center tools to ensure successful enterprise patching and application updates.',
          },
          {
            text: 'Collaborated daily with physicians, nurses, clinical administrators, and hospital leadership to resolve technical issues with minimal disruption to patient care.',
          },
        ],
      },
    ],
    education: [
      {
        school: 'University of Kentucky',
        degree: 'Bachelor of Science in Computer Science',
        location: 'Lexington, KY',
        dates: '2014 – 2016',
        note: 'Completed programming, electrical engineering, literature, and mathematics coursework.',
      },
    ],
    certifications: [
      'Google IT Support Professional Certificate (October 2023)',
      'CompTIA A+ Certification (Jan 2026)',
    ],
    skills: [
      'Windows OS',
      'OS X Support',
      'Enterprise Desktop Support',
      'ServiceUKnow',
      'Active Directory',
      'Network & Technical Troubleshooting',
      'Computer Hardware Support',
      'Mobile Device Management',
      'PowerShell',
      'Python',
      'CLI',
      'Customer Service',
      'Problem-Solving',
      'Communication & Collaboration',
      'Critical Thinking',
    ],
  },
  projects: [
    {
      title: 'Personal Analytics Dashboard',
      summary: 'A private dashboard that tracks habits and writing progress.',
      stack: ['React', 'TypeScript', 'SQLite'],
      href: '#',
    },
    {
      title: 'Community Event Planner',
      summary: 'A lightweight event planner for friends and local community meetups.',
      stack: ['Node.js', 'Express', 'PostgreSQL'],
      href: '#',
    },
    {
      title: 'CLI Notes Sync Tool',
      summary: 'A terminal-first sync utility for markdown notes and snippets.',
      stack: ['TypeScript', 'Node.js'],
      href: '#',
    },
  ],
};

export type SiteConfig = typeof siteConfig;
