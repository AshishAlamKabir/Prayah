import { db } from "./db";
import { books } from "@shared/schema";

async function seedBooks() {
  const booksData = [
    {
      title: "Revolutionary Thoughts of Assam",
      author: "Dr. Hiren Gohain",
      description: "A comprehensive analysis of revolutionary movements in Assam and their impact on social transformation.",
      category: "Political Theory",
      price: 299.00,
      isbn: "978-81-123-4567-8",
      inStock: true,
      featured: true,
      subscriptionOnly: false,
      pdfUrl: "/pdfs/revolutionary-thoughts-assam.pdf",
      tags: ["revolution", "assam", "political-theory", "social-change"]
    },
    {
      title: "Songs of Freedom: Assamese Folk Heritage",
      author: "Bhupen Hazarika",
      description: "Collection of traditional and revolutionary folk songs that inspired generations of freedom fighters.",
      category: "Music & Culture",
      price: 199.00,
      isbn: "978-81-234-5678-9",
      inStock: true,
      featured: true,
      subscriptionOnly: false,
      pdfUrl: "/pdfs/songs-of-freedom.pdf",
      tags: ["folk-music", "culture", "freedom", "heritage"]
    },
    {
      title: "The Art of Social Change",
      author: "Mamoni Raisom Goswami",
      description: "How literature and arts can be powerful tools for creating social awareness and change.",
      category: "Literature",
      price: 249.00,
      isbn: "978-81-345-6789-0",
      inStock: true,
      featured: false,
      subscriptionOnly: true,
      pdfUrl: "/pdfs/art-of-social-change.pdf",
      tags: ["literature", "social-change", "art", "activism"]
    },
    {
      title: "Education for Liberation",
      author: "Paulo Freire (Assamese Translation)",
      description: "The classic work on critical pedagogy translated for Assamese readers, focusing on education as practice of freedom.",
      category: "Education",
      price: 349.00,
      isbn: "978-81-456-7890-1",
      inStock: true,
      featured: true,
      subscriptionOnly: false,
      pdfUrl: "/pdfs/education-for-liberation.pdf",
      tags: ["education", "pedagogy", "liberation", "consciousness"]
    },
    {
      title: "Voices from the Margins",
      author: "Collective Authors",
      description: "Stories and experiences from marginalized communities in rural Assam, highlighting their struggles and resilience.",
      category: "Social Studies",
      price: 179.00,
      isbn: "978-81-567-8901-2",
      inStock: true,
      featured: false,
      subscriptionOnly: false,
      pdfUrl: "/pdfs/voices-from-margins.pdf",
      tags: ["community", "marginalized", "stories", "resilience"]
    },
    {
      title: "Revolutionary Women of Northeast India",
      author: "Dr. Indira Goswami",
      description: "Biographical accounts of women revolutionaries who fought for independence and social justice.",
      category: "Biography",
      price: 399.00,
      isbn: "978-81-678-9012-3",
      inStock: true,
      featured: true,
      subscriptionOnly: true,
      pdfUrl: "/pdfs/revolutionary-women.pdf",
      tags: ["women", "revolution", "biography", "northeast", "independence"]
    },
    {
      title: "Sustainable Agriculture Practices",
      author: "Dr. Akhil Gogoi",
      description: "Traditional and modern sustainable farming methods for small-scale farmers in Assam.",
      category: "Agriculture",
      price: 299.00,
      isbn: "978-81-789-0123-4",
      inStock: true,
      featured: false,
      subscriptionOnly: false,
      pdfUrl: "/pdfs/sustainable-agriculture.pdf",
      tags: ["agriculture", "sustainability", "farming", "traditional-knowledge"]
    },
    {
      title: "Community Organizing Handbook",
      author: "Prayas Community Team",
      description: "Practical guide for organizing communities around social issues and creating effective grassroots movements.",
      category: "Activism",
      price: 149.00,
      isbn: "978-81-890-1234-5",
      inStock: true,
      featured: true,
      subscriptionOnly: false,
      pdfUrl: "/pdfs/community-organizing.pdf",
      tags: ["organizing", "community", "activism", "grassroots"]
    }
  ];

  try {
    console.log("Seeding books data...");
    
    for (const bookData of booksData) {
      const [book] = await db
        .insert(books)
        .values(bookData)
        .returning();
      
      console.log(`✓ Added book: ${book.title}`);
    }
    
    console.log("Books seeding completed successfully!");
    process.exit(0);
    
  } catch (error) {
    console.error("Error seeding books:", error);
    process.exit(1);
  }
}

seedBooks();