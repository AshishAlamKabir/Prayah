import { useEffect } from 'react';

interface StructuredDataProps {
  data: object;
}

export function StructuredData({ data }: StructuredDataProps) {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [data]);

  return null;
}

// Organization Schema
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "PrayasAdhayanChakra",
  "description": "Comprehensive educational management platform serving schools in Bokakhat, Brahmaputra, and Mohuramukh. Features cultural programs, book publications, and community engagement in Assam.",
  "url": "https://prayasadhayanchakra.com",
  "logo": "https://prayasadhayanchakra.com/logo.png",
  "address": {
    "@type": "PostalAddress",
    "addressRegion": "Assam",
    "addressCountry": "IN"
  },
  "sameAs": [
    "https://facebook.com/prayasadhayanchakra",
    "https://twitter.com/prayasadhayan"
  ],
  "member": [
    {
      "@type": "EducationalOrganization",
      "name": "বোকাখাত জাতীয় বিদ্যালয়",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Bokakhat",
        "addressRegion": "Assam",
        "addressCountry": "IN"
      }
    },
    {
      "@type": "EducationalOrganization",
      "name": "ব্ৰহ্মপুত্ৰ জাতীয় বিদ্যালয়",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Brahmaputra",
        "addressRegion": "Assam",
        "addressCountry": "IN"
      }
    },
    {
      "@type": "EducationalOrganization",
      "name": "মহুৰামুখ জাতীয় বিদ্যালয়",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Mohuramukh",
        "addressRegion": "Assam",
        "addressCountry": "IN"
      }
    }
  ]
};

// Website Schema
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "PrayasAdhayanChakra",
  "url": "https://prayasadhayanchakra.com",
  "description": "Educational and cultural platform for Northeast India",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://prayasadhayanchakra.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

// Breadcrumb Schema Generator
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}
