import { db } from "./db";
import { schools } from "@shared/schema";

async function seedSchools() {
  const schoolsData = [
    {
      name: "ব্ৰহ্মপুত্ৰ জাতীয় বিদ্যালয়।",
      location: "Brahmaputra Valley, Assam",
      location_native: "ব্ৰহ্মপুত্ৰ উপত্যকা",
      description: "An innovative educational institution named after the mighty Brahmaputra River, dedicated to nurturing young minds with progressive ideals and academic excellence.",
      detailedDescription: "Brahmaputra Jatiya Vidyalai draws its inspiration from the mighty Brahmaputra River that flows through our region, symbolizing the continuous flow of knowledge and progressive ideas. The school has been at the forefront of educational innovation, integrating traditional wisdom with modern pedagogical approaches. Our focus on environmental education, social justice, and cultural preservation makes us unique in the region. We believe in education as a tool for social transformation and prepare our students to become responsible citizens who can contribute meaningfully to society.",
      programs: ["Pre-Primary Education", "Primary Education", "Secondary Education", "Higher Secondary", "Vocational Courses", "Adult Education", "Community Outreach"],
      facilities: ["Modern Classrooms", "Digital Learning Center", "Science & Mathematics Lab", "Arts & Crafts Workshop", "Playground", "Auditorium", "Canteen", "Transport"],
      achievements: [
        "State Level Excellence Award 2024",
        "Best Innovation in Education Prize",
        "Inter-School Science Fair Champions",
        "Community Development Project Award",
        "Green School Certification",
        "Outstanding Teacher Recognition Program"
      ],
      studentCount: 680,
      contactEmail: "contact@brahmaputrajatiyavidyalai.org",
      contactPhone: "+91-9876543211", 
      website: "https://brahmaputrajatiyavidyalai.org",
      isActive: true,
      mediaFiles: [
        {
          type: "image",
          url: "/images/brahmaputra-campus.jpg",
          caption: "School Campus Overview",
          description: "Panoramic view of the sprawling Brahmaputra Jatiya Vidyalai campus"
        },
        {
          type: "image",
          url: "/images/brahmaputra-lab.jpg",
          caption: "Science Laboratory",
          description: "State-of-the-art science laboratory for hands-on learning"
        },
        {
          type: "video",
          url: "/videos/brahmaputra-annual-function.mp4",
          caption: "Annual Cultural Function",
          description: "Highlights from our annual cultural celebration"
        }
      ]
    },
    {
      name: "মহুৰামুখ জাতীয় বিদ্যালয়।",
      location: "Mohuramukh, Assam",
      location_native: "মহুৰামুখ",
      description: "A community-centered educational institution committed to holistic development of students through progressive pedagogy and cultural preservation.",
      detailedDescription: "Mohuramukh Jatiya Vidyalai represents the collective aspirations of the Mohuramukh community for quality education rooted in social consciousness. The school emphasizes the development of critical thinking skills while preserving our rich cultural heritage. Our unique approach combines academic rigor with practical life skills, ensuring students are well-prepared for both higher education and community leadership roles. The institution serves as a hub for community activities and adult education programs, making it a true center of learning for all ages.",
      programs: ["Elementary Education", "Middle School", "High School", "Computer Education", "Life Skills Training", "Community Education", "Women's Literacy"],
      facilities: ["Smart Classrooms", "Library & Reading Room", "Computer Center", "Handicrafts Workshop", "Kitchen Garden", "Health Center", "Community Hall"],
      achievements: [
        "Community Education Excellence Award",
        "Best Rural Innovation School 2023", 
        "Perfect Attendance Recognition",
        "Traditional Arts Preservation Award",
        "Organic Farming Initiative Success",
        "Literacy Campaign Outstanding Contribution"
      ],
      studentCount: 320,
      contactEmail: "admin@mohuramukhjatiyavidyalai.ac.in",
      contactPhone: "+91-9876543212",
      website: "https://mohuramukhjatiyavidyalai.ac.in", 
      isActive: true,
      mediaFiles: [
        {
          type: "image",
          url: "/images/mohuramukh-entrance.jpg",
          caption: "School Entrance Gate", 
          description: "Traditional entrance gate with progressive slogans"
        },
        {
          type: "image",
          url: "/images/mohuramukh-garden.jpg",
          caption: "Organic Kitchen Garden",
          description: "Students working in the school's organic vegetable garden"
        },
        {
          type: "image",
          url: "/images/mohuramukh-workshop.jpg",
          caption: "Handicrafts Workshop",
          description: "Traditional handicrafts training session for students"
        }
      ]
    }
  ];

  try {
    console.log("Seeding schools data...");
    
    for (const schoolData of schoolsData) {
      const [school] = await db
        .insert(schools)
        .values(schoolData)
        .returning();
      
      console.log(`✓ Added school: ${school.name}`);
    }
    
    console.log("Schools seeding completed successfully!");
    process.exit(0);
    
  } catch (error) {
    console.error("Error seeding schools:", error);
    process.exit(1);
  }
}

seedSchools();