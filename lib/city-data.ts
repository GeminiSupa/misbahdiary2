export interface LawyerListing {
  name: string;
  specialization: string;
  description: string;
  contact?: string;
  website?: string;
}

export interface CityData {
  city: string;
  intro: string;
  lawyers: LawyerListing[];
  faqs: { question: string; answer: string }[];
  practiceAreas: string[];
}

export const CITY_DATA: Record<string, CityData> = {
  islamabad: {
    city: "Islamabad",
    intro: "Find the best lawyers and law firms in Islamabad. Whether you need help with constitutional litigation, corporate regulatory matters, or family law, our directory features top-rated legal professionals in the capital city.",
    lawyers: [
      {
        name: "Misbah Akram",
        specialization: "Criminal, Family & Civil Law",
        description: "Advocate High Court specializing in family disputes, criminal defense, and civil litigation. Known for active legal writing and professional guidance for advocates.",
        website: "https://vakeeldiary.com",
      },
      {
        name: "ABS & Co",
        specialization: "Corporate, Constitutional, Arbitration",
        description: "One of Pakistan's largest law firms with a strong presence in Islamabad, specializing in complex litigation and corporate advisory.",
        website: "https://absco.pk",
      },
      {
        name: "Axis Law Chambers",
        specialization: "Commercial, Banking, Litigation",
        description: "A premium law firm providing high-end legal services in commercial and constitutional matters.",
        website: "https://axislaw.pk",
      },
      {
        name: "Cornelius, Lane & Mufti (CLM)",
        specialization: "Corporate, Regulatory, Banking",
        description: "One of the largest and most reputed law firms in Pakistan, specializing in high-stakes corporate and regulatory matters.",
        website: "https://clm.com.pk",
      },
      {
        name: "Kakakhel Law Associates (KLA)",
        specialization: "Constitutional, Banking, Service Law",
        description: "A prominent firm with decades of experience in constitutional law and complex litigation.",
        contact: "+92 334 4440844",
      },
      {
        name: "Osmani Legal Firms",
        specialization: "Civil & Criminal Litigation, Family Law",
        description: "Known for handling a large volume of cases across all judicial levels, including the Supreme Court.",
        website: "https://osmanilegal.com",
      },
      {
        name: "Waqar & Waqar Law Associates",
        specialization: "Corporate, Finance, Arbitration",
        description: "A trusted firm focused on results-driven legal solutions for corporate and commercial clients.",
        website: "https://waqarandwaqar.com",
      },
      {
        name: "Pk-Legal & Associates",
        specialization: "Family Law, Company Registration",
        description: "Well-regarded for family law matters including divorce, custody, and cyber crimes.",
        contact: "+92 321 5256 865",
      },
    ],
    faqs: [
      {
        question: "How do I choose the right lawyer in Islamabad?",
        answer: "Determine your specific legal need (e.g., family, corporate, criminal) and look for a firm with a proven track record in that area. Check if the advocate is registered with the Islamabad High Court or Supreme Court.",
      },
      {
        question: "What are the typical fee structures for lawyers in Islamabad?",
        answer: "Fees vary widely based on the complexity of the case and the lawyer's experience. Some charge a flat fee per hearing, while others may work on a retainer or a total case fee.",
      },
    ],
    practiceAreas: [
      "Constitutional Law",
      "Corporate & Regulatory",
      "Civil Litigation",
      "Criminal Defense",
      "Family & Divorce",
      "Banking & Finance",
    ],
  },
  lahore: {
    city: "Lahore",
    intro: "Connecting you with top-tier law firms in Lahore. From high-stakes corporate disputes to property and family matters, find experienced advocates in the cultural and legal heart of Pakistan.",
    lawyers: [
      {
        name: "Jillani & Co.",
        specialization: "Corporate, Financial, Property",
        description: "Provides high-level legal advisory on corporate, financial, property, and civil litigation matters in Lahore.",
        website: "https://vakeeldiary.com",
      },
      {
        name: "AMLAW Associates",
        specialization: "Corporate, SME Law, Litigation",
        description: "A full-service corporate and SME law firm specializing in company law, litigation, and consultancy.",
        website: "https://amlaw.pk",
      },
      {
        name: "RIAA Barker Gillette",
        specialization: "Corporate, M&A, Projects",
        description: "A leading full-service law firm with an international presence, frequently ranked top in Pakistan.",
        website: "https://riaabarkergillette.com",
      },
      {
        name: "Cornelius, Lane & Mufti (CLM)",
        specialization: "Banking, Projects, Tax",
        description: "A well-established firm in Lahore with extensive experience in banking and infrastructure projects.",
        website: "https://clm.com.pk",
      },
      {
        name: "Hassan & Hassan (Advocates)",
        specialization: "Constitutional, Civil, Corporate",
        description: "One of the oldest and most prestigious law firms in Pakistan, based in Lahore.",
        website: "https://hassanandhassan.com",
      },
      {
        name: "SNS Law Firm",
        specialization: "Corporate, Civil, Family Matters",
        description: "A full-spectrum firm handling a mix of corporate, property, and individual legal matters.",
        website: "https://sohaibnsultan.pk",
      },
      {
        name: "Hassan Law Chambers (HLC)",
        specialization: "Corporate Litigation & Advisory",
        description: "Focused on corporate litigation and providing legal advice to multinational corporations.",
        website: "https://hlcpak.com",
      },
      {
        name: "Walker Martineau Saleem (WMS)",
        specialization: "Corporate, Commercial, Litigation",
        description: "A well-regarded firm providing a broad range of legal services to domestic and international clients.",
        website: "https://wmslaw.com.pk",
      },
      {
        name: "Kilam Law",
        specialization: "Intellectual Property, Cyber Law",
        description: "Specializes in modern legal challenges including IP protection, data privacy, and cyber law.",
      },
    ],
    faqs: [
      {
        question: "Where are the major courts located in Lahore?",
        answer: "The Lahore High Court and Civil Courts are centrally located. Most prominent law firms have offices in areas like Gulberg, Mall Road, and DHA.",
      },
      {
        question: "Can I find specialized property lawyers in Lahore?",
        answer: "Yes, Lahore has many specialized property lawyers due to the high volume of real estate transactions and related disputes in the city.",
      },
    ],
    practiceAreas: [
      "Property & Real Estate",
      "Corporate Litigation",
      "Intellectual Property",
      "Civil Law",
      "Criminal Law",
      "Taxation",
    ],
  },
  karachi: {
    city: "Karachi",
    intro: "Your guide to leading lawyers in Karachi. As Pakistan's financial hub, Karachi offers specialized legal expertise in admiralty, corporate finance, and commercial litigation.",
    lawyers: [
      {
        name: "Haidermota & Co.",
        specialization: "Corporate, M&A, Energy",
        description: "A top-tier firm in Karachi specializing in corporate law, mergers and acquisitions, and energy projects.",
        website: "https://hmco.com.pk",
      },
      {
        name: "Mohsin Tayebaly & Co. (MTC)",
        specialization: "Banking, Finance, Capital Markets",
        description: "One of Pakistan's leading law firms for banking, finance, and capital markets transactions.",
        website: "https://mtclaw.com.pk",
      },
      {
        name: "RIAA Barker Gillette",
        specialization: "Corporate, M&A, Banking",
        description: "Renowned for its strength in corporate finance and large-scale commercial transactions in Karachi.",
        website: "https://riaabarkergillette.com",
      },
      {
        name: "Ali & Associates",
        specialization: "Intellectual Property, Corporate",
        description: "One of the top firms for trademarks, patents, and copyright protection in Pakistan.",
        website: "https://aliassociates.com.pk",
      },
      {
        name: "Irfan Mir Halepota & Associates",
        specialization: "Litigation, Tax, Employment",
        description: "A comprehensive firm providing services in civil litigation, tax management, and business registration.",
        website: "https://irfanlaw.com",
      },
      {
        name: "Abraham & Sarwana",
        specialization: "Admiralty, Banking, Corporate",
        description: "A leading firm in Karachi known for its expertise in shipping, banking, and commercial law.",
        website: "https://abraham-sarwana.com",
      },
      {
        name: "Vellani & Vellani",
        specialization: "IP, Corporate, Commercial",
        description: "A highly respected firm specializing in intellectual property and corporate advisory.",
        website: "https://vellani.com",
      },
      {
        name: "Mumtaz & Associates",
        specialization: "Company Registration, M&A",
        description: "Experts in corporate law, mergers, acquisitions, and commercial dispute resolution.",
        website: "https://ma-law.org.pk",
      },
      {
        name: "Lexway",
        specialization: "Cross-border Transactions, Litigation",
        description: "Specializes in international legal matters and complex commercial litigation.",
        website: "https://lexway.pk",
      },
    ],
    faqs: [
      {
        question: "Do Karachi law firms handle maritime and shipping cases?",
        answer: "Yes, as a major port city, Karachi has several firms specializing in Admiralty and Maritime law.",
      },
      {
        question: "How do I verify a lawyer's credentials in Karachi?",
        answer: "You can check their registration with the Sindh Bar Council or verify their standing with the High Court of Sindh.",
      },
    ],
    practiceAreas: [
      "Admiralty & Maritime",
      "Corporate Finance",
      "Commercial Litigation",
      "Intellectual Property",
      "Tax & Customs",
      "Labor Law",
    ],
  },
};

export const COMMON_FAQS = [
  {
    question: "What should I bring to my first meeting with a lawyer?",
    answer: "Bring all relevant documents, including IDs, contracts, court orders, or correspondence related to your case. A written timeline of events is also very helpful.",
  },
  {
    question: "Are initial consultations free?",
    answer: "Some firms offer a free brief initial consultation, while others charge a fee. It's best to ask about this when booking your appointment.",
  },
  {
    question: "How long do legal cases usually take in Pakistan?",
    answer: "The duration varies significantly depending on the nature of the case and the court's backlog. Civil cases can take years, while some family or criminal matters may be resolved faster.",
  },
];
