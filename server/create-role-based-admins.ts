import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function createRoleBasedAdmins() {
  try {
    console.log("Creating role-based admin accounts...");

    // Hash password for all accounts
    const passwordHash = await bcrypt.hash("Admin2025!", 10);

    // School admin accounts
    const schoolAdmins = [
      {
        username: "BokaghatAdmin",
        email: "admin@bokaghatjatiyavidyalai.edu.in",
        password: passwordHash,
        firstName: "Bokaghat",
        lastName: "Administrator", 
        role: "school_admin",
        schoolPermissions: [1], // Bokaghat school ID
        culturePermissions: [],
        permissions: ["manage_school_content", "school_notifications", "school_activities"]
      },
      {
        username: "BrahmaputraAdmin", 
        email: "admin@brahmaputrajatiyavidyalai.org",
        password: passwordHash,
        firstName: "Brahmaputra",
        lastName: "Administrator",
        role: "school_admin", 
        schoolPermissions: [2], // Brahmaputra school ID
        culturePermissions: [],
        permissions: ["manage_school_content", "school_notifications", "school_activities"]
      },
      {
        username: "MohuramukhaAdmin",
        email: "admin@mohuramukhjatiyavidyalai.ac.in", 
        password: passwordHash,
        firstName: "Mohuramukha",
        lastName: "Administrator",
        role: "school_admin",
        schoolPermissions: [3], // Mohuramukha school ID
        culturePermissions: [],
        permissions: ["manage_school_content", "school_notifications", "school_activities"]
      }
    ];

    // Culture section admin accounts  
    const cultureAdmins = [
      {
        username: "MusicAdmin",
        email: "music@prayasculture.org",
        password: passwordHash,
        firstName: "Music",
        lastName: "Administrator",
        role: "culture_admin",
        schoolPermissions: [],
        culturePermissions: [1], // Music category ID
        permissions: ["manage_culture_content", "culture_programs", "culture_activities"]
      },
      {
        username: "FineArtsAdmin",
        email: "finearts@prayasculture.org", 
        password: passwordHash,
        firstName: "Fine Arts",
        lastName: "Administrator",
        role: "culture_admin",
        schoolPermissions: [],
        culturePermissions: [2], // Fine Arts category ID
        permissions: ["manage_culture_content", "culture_programs", "culture_activities"]
      },
      {
        username: "DanceAdmin",
        email: "dance@prayasculture.org",
        password: passwordHash,
        firstName: "Dance",
        lastName: "Administrator", 
        role: "culture_admin",
        schoolPermissions: [],
        culturePermissions: [3], // Dance category ID
        permissions: ["manage_culture_content", "culture_programs", "culture_activities"]
      },
      {
        username: "PoetryAdmin",
        email: "poetry@prayasculture.org",
        password: passwordHash,
        firstName: "Poetry", 
        lastName: "Administrator",
        role: "culture_admin",
        schoolPermissions: [],
        culturePermissions: [4], // Poetry category ID  
        permissions: ["manage_culture_content", "culture_programs", "culture_activities"]
      },
      {
        username: "DramaAdmin",
        email: "drama@prayasculture.org",
        password: passwordHash,
        firstName: "Drama",
        lastName: "Administrator",
        role: "culture_admin", 
        schoolPermissions: [],
        culturePermissions: [5], // Drama category ID
        permissions: ["manage_culture_content", "culture_programs", "culture_activities"]
      }
    ];

    // Insert all admin accounts
    const allAdmins = [...schoolAdmins, ...cultureAdmins];
    
    for (const admin of allAdmins) {
      try {
        const [existingUser] = await db.select().from(users).where(eq(users.username, admin.username));
        
        if (!existingUser) {
          await db.insert(users).values(admin);
          console.log(`✓ Created ${admin.role} account: ${admin.username}`);
        } else {
          console.log(`- Account already exists: ${admin.username}`);
        }
      } catch (error) {
        console.error(`Error creating ${admin.username}:`, error);
      }
    }

    console.log("\n=== Role-Based Admin Accounts Created ===");
    console.log("\nSchool Admins:");
    console.log("- BokaghatAdmin / Admin2025! (Bokaghat School)");
    console.log("- BrahmaputraAdmin / Admin2025! (Brahmaputra School)"); 
    console.log("- MohuramukhaAdmin / Admin2025! (Mohuramukha School)");
    
    console.log("\nCulture Admins:");
    console.log("- MusicAdmin / Admin2025! (Music Section)");
    console.log("- FineArtsAdmin / Admin2025! (Fine Arts Section)");
    console.log("- DanceAdmin / Admin2025! (Dance Section)");
    console.log("- PoetryAdmin / Admin2025! (Poetry Section)");
    console.log("- DramaAdmin / Admin2025! (Drama Section)");
    
    console.log("\nEach admin has access only to their specific section.");
    
  } catch (error) {
    console.error("Error creating role-based admins:", error);
  }
}

// Run the script
createRoleBasedAdmins().then(() => {
  console.log("Role-based admin creation completed!");
  process.exit(0);
}).catch(error => {
  console.error("Failed to create role-based admins:", error);
  process.exit(1);
});