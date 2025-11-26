// Friends From The City GSA MAS Schedule Data
// Contract Number: 47QTCA23D0076
// Period of Performance: 4/17/2023 - 4/16/2028

export interface GSALaborCategory {
  id: string;
  title: string;
  minExperience: number;
  minEducation: string;
  description: string;
  rates: {
    year1: number | null;
    year2: number | null;
    year3: number | null;
    year4: number | null;
    year5: number | null;
  };
}

export interface GSASin {
  sin: string;
  name: string;
  laborCategories: GSALaborCategory[];
}

export interface GSAScheduleData {
  contractNumber: string;
  contractorName: string;
  samUei: string;
  periodOfPerformance: {
    start: string;
    end: string;
  };
  currentYear: number; // 1-5 based on current date
  maxOrder: number;
  minOrder: number;
  sins: GSASin[];
}

// Calculate current contract year based on date
export function getCurrentGSAYear(startDate: string = '2023-04-17'): number {
  const start = new Date(startDate);
  const now = new Date();
  const diffYears = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
  const year = Math.floor(diffYears) + 1;
  return Math.min(Math.max(year, 1), 5);
}

// Get rate for a specific year
export function getGSARate(category: GSALaborCategory, year: number): number | null {
  const rates = category.rates;
  switch (year) {
    case 1: return rates.year1;
    case 2: return rates.year2;
    case 3: return rates.year3;
    case 4: return rates.year4;
    case 5: return rates.year5;
    default: return null;
  }
}

export const FFTC_GSA_SCHEDULE: GSAScheduleData = {
  contractNumber: '47QTCA23D0076',
  contractorName: 'Friends From The City, LLC',
  samUei: 'RA62AG44CFZ8',
  periodOfPerformance: {
    start: '2023-04-17',
    end: '2028-04-16',
  },
  currentYear: getCurrentGSAYear(),
  maxOrder: 500000,
  minOrder: 100,
  sins: [
    {
      sin: '54151S',
      name: 'IT Professional Services',
      laborCategories: [
        {
          id: 'gsa-54151s-1',
          title: 'Product/Program Manager',
          minExperience: 2,
          minEducation: 'Bachelors',
          description: 'Support operations involving multiple projects/task orders. Maintains product roadmap, leads technical development team processes, manages product backlog.',
          rates: {
            year1: 151.47,
            year2: 159.35,
            year3: 167.63,
            year4: 176.34,
            year5: 185.51,
          },
        },
        {
          id: 'gsa-54151s-2',
          title: 'Project Manager',
          minExperience: 2,
          minEducation: 'Bachelors',
          description: 'Responsible for all contract activities. Sets policies, technical standards, and priorities. Coordinates management of all work performed on tasks.',
          rates: {
            year1: 167.51,
            year2: 176.22,
            year3: 185.38,
            year4: 195.02,
            year5: 205.17,
          },
        },
        {
          id: 'gsa-54151s-3',
          title: 'Subject Matter Expert',
          minExperience: 3,
          minEducation: 'Bachelors',
          description: 'Industry experience in relevant subject matter. Advises on cloud, cybersecurity, database, software development. Provides technical direction for complex systems.',
          rates: {
            year1: 167.51,
            year2: 176.22,
            year3: 185.38,
            year4: 195.02,
            year5: 205.17,
          },
        },
        {
          id: 'gsa-54151s-4',
          title: 'Consultant',
          minExperience: 2,
          minEducation: 'Bachelors',
          description: 'Solves various problems applying standard professional concepts. Advises on cloud, cybersecurity, database, and software/applications development.',
          rates: {
            year1: 167.51,
            year2: 176.22,
            year3: 185.38,
            year4: 195.02,
            year5: 205.17,
          },
        },
        {
          id: 'gsa-54151s-5',
          title: 'Developer',
          minExperience: 2,
          minEducation: 'Bachelors',
          description: 'Advises and implements development services including cloud, cybersecurity, database, and software/applications. Delivers technical components.',
          rates: {
            year1: 191.44,
            year2: 201.39,
            year3: 211.86,
            year4: 222.87,
            year5: 234.46,
          },
        },
        {
          id: 'gsa-54151s-6',
          title: 'UX/UI Designer',
          minExperience: 1,
          minEducation: 'Bachelors',
          description: 'Develops user interface design based on studying users. Conducts usability tests, expert reviews, and works with users to understand desired features.',
          rates: {
            year1: 129.22,
            year2: 135.94,
            year3: 143.01,
            year4: 150.45,
            year5: 158.27,
          },
        },
        {
          id: 'gsa-54151s-7',
          title: 'IT Content Strategy',
          minExperience: 1,
          minEducation: 'Bachelors',
          description: 'Research and develop migration plans for CMS. Plans content creation, publishing, governance. Specializes in messaging, CMS implementation, information architecture.',
          rates: {
            year1: 114.86,
            year2: 120.84,
            year3: 127.12,
            year4: 133.73,
            year5: 140.69,
          },
        },
        {
          id: 'gsa-54151s-8',
          title: 'IT Training',
          minExperience: 2,
          minEducation: 'Bachelors',
          description: 'Conducts IT training courses with focus on IT systems, Human Centered Design, and business systems. Training via classroom, presentations, demonstrations.',
          rates: {
            year1: 143.58,
            year2: 151.04,
            year3: 158.90,
            year4: 167.16,
            year5: 175.86,
          },
        },
        {
          id: 'gsa-54151s-9',
          title: 'Digital Transformer',
          minExperience: 1,
          minEducation: 'Bachelors',
          description: 'Analyzes organization digital maturity. Recommends strategies for modern digital management and delivery practices. Can serve as Agile Coach.',
          rates: {
            year1: 143.58,
            year2: 151.04,
            year3: 158.90,
            year4: 167.16,
            year5: 175.86,
          },
        },
      ],
    },
    {
      sin: '541611',
      name: 'Management and Financial Consulting, Acquisition and Grants Management Support, and Business Programs and Project Management Services',
      laborCategories: [
        {
          id: 'gsa-541611-1',
          title: 'Project Manager',
          minExperience: 3,
          minEducation: 'Bachelors',
          description: 'Day-to-day management of contract support operations. Responsible for staffing, project planning, financials, and staff direction.',
          rates: {
            year1: 167.51,
            year2: 176.22,
            year3: 185.99,
            year4: 195.02,
            year5: 205.17,
          },
        },
        {
          id: 'gsa-541611-2',
          title: 'Subject Matter Expert',
          minExperience: 1,
          minEducation: 'Bachelors',
          description: 'Highly technical expert for business analysis and management techniques. Provides leadership for technical delivery teams.',
          rates: {
            year1: 191.44,
            year2: 201.39,
            year3: 211.86,
            year4: 222.87,
            year5: 234.46,
          },
        },
        {
          id: 'gsa-541611-3',
          title: 'Consultant',
          minExperience: 1,
          minEducation: 'Bachelors',
          description: 'Applies process improvement and reengineering methodologies. Performs enterprise strategic planning and business area analysis.',
          rates: {
            year1: 167.51,
            year2: 176.22,
            year3: 185.99,
            year4: 195.02,
            year5: 205.17,
          },
        },
        {
          id: 'gsa-541611-4',
          title: 'Associate',
          minExperience: 3,
          minEducation: 'Bachelors',
          description: 'Implements courses of action applying developed skills. Can perform programming, product design, configuration, application development.',
          rates: {
            year1: 143.58,
            year2: 151.04,
            year3: 158.90,
            year4: 167.16,
            year5: 175.86,
          },
        },
        {
          id: 'gsa-541611-5',
          title: 'Manager',
          minExperience: 2,
          minEducation: 'Bachelors',
          description: 'Uses complex professional concepts and methodologies. Provides broad technical leadership and oversees technical direction.',
          rates: {
            year1: 167.51,
            year2: 176.22,
            year3: 185.99,
            year4: 195.02,
            year5: 205.17,
          },
        },
      ],
    },
    {
      sin: '541910',
      name: 'Marketing Research and Analysis Services',
      laborCategories: [
        {
          id: 'gsa-541910-1',
          title: 'Subject Matter Expert I',
          minExperience: 1,
          minEducation: 'Bachelors',
          description: 'Industry experience in relevant subject matter. Advises on UX/UI, web design, software development. Customizes strategic marketing plans.',
          rates: {
            year1: 143.58,
            year2: 151.04,
            year3: 158.90,
            year4: 167.16,
            year5: 175.86,
          },
        },
        {
          id: 'gsa-541910-2',
          title: 'Subject Matter Expert II',
          minExperience: 4,
          minEducation: 'Bachelors',
          description: 'Senior industry experience. Advises on UX/UI, web design, software development. Leads strategic marketing and branding initiatives.',
          rates: {
            year1: 191.44,
            year2: 201.39,
            year3: 211.86,
            year4: 222.87,
            year5: 234.46,
          },
        },
      ],
    },
    {
      sin: '518210C',
      name: 'Cloud Computing and Cloud Related IT Professional Services',
      laborCategories: [
        {
          id: 'gsa-518210c-1',
          title: 'Cloud Senior Product Manager',
          minExperience: 6,
          minEducation: 'Bachelors',
          description: 'Oversees full lifecycle of cloud-based product development. Leads teams in defining product roadmaps for IaaS, PaaS, and SaaS solutions.',
          rates: {
            year1: null,
            year2: null,
            year3: null,
            year4: 165.52,
            year5: 174.13,
          },
        },
        {
          id: 'gsa-518210c-2',
          title: 'Cloud Digital Transformer',
          minExperience: 6,
          minEducation: 'Bachelors',
          description: 'Drives modernization of user experiences and digital content strategies for cloud-enabled systems. Ensures Section 508 compliance.',
          rates: {
            year1: null,
            year2: null,
            year3: null,
            year4: 156.90,
            year5: 165.06,
          },
        },
        {
          id: 'gsa-518210c-3',
          title: 'Cloud AI/ML Engineer',
          minExperience: 6,
          minEducation: 'Bachelors',
          description: 'Develops, trains, and deploys AI and ML models within cloud environments. Designs scalable AI pipelines leveraging IaaS, PaaS, and SaaS.',
          rates: {
            year1: null,
            year2: null,
            year3: null,
            year4: 148.11,
            year5: 155.81,
          },
        },
        {
          id: 'gsa-518210c-4',
          title: 'Cloud Solutions Architect',
          minExperience: 8,
          minEducation: 'Bachelors',
          description: 'Designs secure, scalable cloud architectures for IaaS, PaaS, and SaaS. Leads legacy assessments and defines target architectures.',
          rates: {
            year1: null,
            year2: null,
            year3: null,
            year4: 172.80,
            year5: 181.78,
          },
        },
        {
          id: 'gsa-518210c-5',
          title: 'Cloud Engineer',
          minExperience: 6,
          minEducation: 'Bachelors',
          description: 'Builds, configures, and maintains cloud infrastructure. Provisions compute, storage, networking resources and implements automation.',
          rates: {
            year1: null,
            year2: null,
            year3: null,
            year4: 139.04,
            year5: 146.28,
          },
        },
        {
          id: 'gsa-518210c-6',
          title: 'Cloud DevSecOps Engineer',
          minExperience: 6,
          minEducation: 'Bachelors',
          description: 'Integrates development, security, and operations. Designs CI/CD pipelines with automated security testing and vulnerability scanning.',
          rates: {
            year1: null,
            year2: null,
            year3: null,
            year4: 143.68,
            year5: 151.15,
          },
        },
        {
          id: 'gsa-518210c-7',
          title: 'Cloud Data Engineer',
          minExperience: 4,
          minEducation: 'Bachelors',
          description: 'Designs and optimizes data pipelines in cloud environments. Builds ETL/ELT pipelines and enables real-time streaming data flows.',
          rates: {
            year1: null,
            year2: null,
            year3: null,
            year4: 133.30,
            year5: 140.23,
          },
        },
        {
          id: 'gsa-518210c-8',
          title: 'Cloud Software Developer',
          minExperience: 3,
          minEducation: 'Bachelors',
          description: 'Designs, codes, tests, and maintains cloud applications. Develops software using cloud APIs, microservices, and containerized deployments.',
          rates: {
            year1: null,
            year2: null,
            year3: null,
            year4: 123.43,
            year5: 129.84,
          },
        },
        {
          id: 'gsa-518210c-9',
          title: 'Cloud Consultant I',
          minExperience: 2,
          minEducation: 'Bachelors',
          description: 'Foundational consulting support on cloud adoption. Assists with migration assessments, documentation, and basic analyses.',
          rates: {
            year1: null,
            year2: null,
            year3: null,
            year4: 98.74,
            year5: 103.88,
          },
        },
        {
          id: 'gsa-518210c-10',
          title: 'Cloud Consultant II',
          minExperience: 6,
          minEducation: 'Bachelors',
          description: 'Advanced consulting services for cloud adoption. Evaluates legacy environments, designs migration strategies, advises on governance.',
          rates: {
            year1: null,
            year2: null,
            year3: null,
            year4: 148.11,
            year5: 155.81,
          },
        },
        {
          id: 'gsa-518210c-11',
          title: 'Cloud Subject Matter Expert',
          minExperience: 10,
          minEducation: 'Bachelors',
          description: 'Specialized knowledge across all cloud computing phases. Advises on hybrid cloud, multi-cloud governance, AI/ML integration, cybersecurity.',
          rates: {
            year1: null,
            year2: null,
            year3: null,
            year4: 222.17,
            year5: 233.72,
          },
        },
        {
          id: 'gsa-518210c-12',
          title: 'Cloud Task Manager',
          minExperience: 6,
          minEducation: 'Bachelors',
          description: 'Oversees specific task orders within cloud modernization projects. Manages daily activities, coordinates resources, monitors progress.',
          rates: {
            year1: null,
            year2: null,
            year3: null,
            year4: 139.04,
            year5: 146.28,
          },
        },
      ],
    },
  ],
};

// Helper to get all labor categories flattened
export function getAllGSALaborCategories(): (GSALaborCategory & { sin: string; sinName: string })[] {
  const result: (GSALaborCategory & { sin: string; sinName: string })[] = [];
  
  for (const sin of FFTC_GSA_SCHEDULE.sins) {
    for (const cat of sin.laborCategories) {
      result.push({
        ...cat,
        sin: sin.sin,
        sinName: sin.name,
      });
    }
  }
  
  return result;
}

// Helper to check if a rate is available for a given year
export function isRateAvailable(category: GSALaborCategory, year: number): boolean {
  const rate = getGSARate(category, year);
  return rate !== null;
}