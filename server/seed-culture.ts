import { db } from "./db";
import { cultureCategories } from "@shared/schema";

async function seedCultureCategories() {
  const cultureData = [
    {
      name: "music",
      displayName: "Music Programs",
      icon: "🎵",
      description: "Creative music programs that blend traditional folk music with modern expression",
      detailedDescription: "Our music programs celebrate the rich musical heritage of Assam while incorporating contemporary educational themes. Students learn traditional instruments like dhol, pepa, and taal, alongside modern instruments. We organize regular concerts, folk music festivals, and community singing sessions that bring together people from all walks of life. The programs emphasize music as a tool for cultural preservation and community building.",
      youtubeChannelUrl: "https://www.youtube.com/channel/UCPrayasMusicRevolution",
      programs: [
        {
          name: "Traditional Folk Music",
          description: "Learn authentic Assamese folk songs and traditional instruments",
          instructor: "Rupali Sharma",
          schedule: "Mondays & Wednesdays 4-6 PM"
        },
        {
          name: "Creative Songs Workshop",
          description: "Compose and perform songs that inspire community building",
          instructor: "Bhupen Hazarika Jr.",
          schedule: "Fridays 5-7 PM"
        },
        {
          name: "Community Choir",
          description: "Inclusive singing group for all ages and skill levels",
          instructor: "Mamoni Baruah",
          schedule: "Sundays 3-5 PM"
        }
      ],
      mediaFiles: [
        {
          type: "video",
          url: "/videos/folk-music-performance.mp4",
          caption: "Traditional Folk Music Performance",
          description: "Students performing authentic Assamese folk songs",
          tags: ["folk", "traditional", "performance"]
        },
        {
          type: "audio",
          url: "/audio/unity-song.mp3", 
          caption: "Unity Song - Harmony in Diversity",
          description: "Original composition about social harmony",
          tags: ["unity", "original", "social-harmony"]
        },
        {
          type: "image",
          url: "/images/music-workshop.jpg",
          caption: "Music Workshop Session",
          description: "Students learning traditional instruments",
          tags: ["workshop", "learning", "instruments"]
        }
      ]
    },
    {
      name: "fine-arts",
      displayName: "Fine Arts Programs",
      icon: "🎨", 
      description: "Visual arts programs where creativity meets activism",
      detailedDescription: "Our fine arts programs encourage students to express revolutionary ideas through various visual mediums. From traditional Assamese art forms like manuscript painting to modern digital art, we provide comprehensive training in multiple artistic disciplines. Students learn to create powerful visual narratives that communicate messages of social justice, environmental conservation, and cultural pride. Regular exhibitions showcase student work and engage the broader community in artistic dialogue about important social issues.",
      programs: [
        {
          name: "Traditional Manuscript Painting",
          description: "Learn the ancient art of Assamese manuscript illustration",
          instructor: "Dr. Kamal Das",
          schedule: "Tuesdays & Thursdays 3-5 PM",
          materials: "Natural pigments, traditional brushes, handmade paper"
        },
        {
          name: "Social Justice Murals",
          description: "Create large-scale murals addressing community issues",
          instructor: "Priya Kalita", 
          schedule: "Saturdays 10 AM-2 PM",
          materials: "Acrylic paints, brushes, wall surfaces"
        },
        {
          name: "Digital Art for Change",
          description: "Use modern tools to create impactful digital artwork",
          instructor: "Rahul Borah",
          schedule: "Wednesdays & Fridays 6-8 PM",
          materials: "Graphics tablets, design software"
        }
      ],
      mediaFiles: [
        {
          type: "image",
          url: "/images/manuscript-painting.jpg",
          caption: "Traditional Manuscript Art",
          artist: "Student: Meera Devi",
          description: "Beautiful traditional Assamese manuscript painting depicting local folklore",
          medium: "Natural pigments on handmade paper",
          tags: ["traditional", "manuscript", "folklore"]
        },
        {
          type: "image", 
          url: "/images/social-justice-mural.jpg",
          caption: "Unity in Diversity Mural",
          artist: "Community Art Group",
          description: "Collaborative mural celebrating cultural diversity and social harmony",
          medium: "Acrylic on wall",
          tags: ["mural", "social-justice", "community"]
        },
        {
          type: "image",
          url: "/images/digital-art-exhibition.jpg",
          caption: "Digital Art Exhibition",
          artist: "Various Students",
          description: "Annual exhibition showcasing digital artwork on environmental themes",
          medium: "Digital prints",
          tags: ["digital", "exhibition", "environmental"]
        }
      ]
    },
    {
      name: "dance-drama-poems",
      displayName: "Dance, Drama & Poetry",
      icon: "🎭",
      description: "Performing arts that tell stories of revolution and hope",
      detailedDescription: "Our performing arts programs combine dance, drama, and poetry to create powerful theatrical experiences that address social issues and celebrate cultural heritage. Students learn traditional Assamese dance forms like Bihu and Sattriya, participate in socially conscious drama productions, and develop their skills in spoken word poetry. These programs provide platforms for artistic expression while building confidence, community connections, and cultural awareness.",
      youtubeChannelUrl: "https://www.youtube.com/channel/UCPrayasDramaRevolution",
      programs: [
        {
          name: "Traditional Dance Forms",
          type: "dance",
          description: "Master classical Assamese dance including Bihu and Sattriya",
          instructor: "Gitashree Gogoi",
          schedule: "Daily 5-7 PM",
          nextShow: "Bihu Festival 2025"
        },
        {
          name: "Revolutionary Theater",
          type: "drama", 
          description: "Perform plays that address contemporary social issues",
          instructor: "Dipankar Sharma",
          schedule: "Rehearsals: Mon, Wed, Fri 6-9 PM",
          nextShow: "Freedom Fighters - March 2025"
        },
        {
          name: "Spoken Word Poetry",
          type: "poetry",
          description: "Develop skills in writing and performing impactful poetry",
          instructor: "Nilakshi Medhi",
          schedule: "Thursdays 7-9 PM",
          nextShow: "Monthly Open Mic Night"
        }
      ],
      mediaFiles: [
        {
          type: "video",
          url: "/videos/bihu-dance-performance.mp4",
          caption: "Traditional Bihu Dance",
          performer: "Cultural Dance Group",
          description: "Energetic Bihu dance performance celebrating Assamese New Year",
          date: "2024-04-15",
          tags: ["bihu", "traditional", "celebration"]
        },
        {
          type: "video", 
          url: "/videos/revolutionary-drama.mp4",
          caption: "Social Justice Drama - Voices of Change",
          performer: "Drama Society",
          description: "Powerful drama addressing inequality and social justice",
          date: "2024-03-10",
          tags: ["drama", "social-justice", "revolution"]
        },
        {
          type: "image",
          url: "/images/poetry-reading.jpg",
          caption: "Poetry Reading Session",
          performer: "Poetry Circle",
          description: "Monthly community poetry reading focusing on themes of hope and change",
          date: "2024-05-20",
          tags: ["poetry", "community", "reading"]
        }
      ]
    }
  ];

  try {
    console.log("Seeding culture categories...");
    
    for (const categoryData of cultureData) {
      const [category] = await db
        .insert(cultureCategories)
        .values(categoryData)
        .returning();
      
      console.log(`✓ Added culture category: ${category.displayName}`);
    }
    
    console.log("Culture categories seeding completed!");
    process.exit(0);
    
  } catch (error) {
    console.error("Error seeding culture categories:", error);
    process.exit(1);
  }
}

seedCultureCategories();