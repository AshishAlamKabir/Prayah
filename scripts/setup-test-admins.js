// Script to set up test admin users with role-based permissions
import { db } from "../server/db.js";
import { users } from "../shared/schema.js";
import bcrypt from "bcrypt";

async function setupTestAdmins() {
  console.log("Setting up test admin users...");

  try {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // 1. Create Bokaghat Jatiya Vidyalaya admin
    const bokaghatAdmin = await db.insert(users).values({
      username: "bokaghat_admin",
      email: "bokaghat.admin@prayas.org",
      password: hashedPassword,
      firstName: "Bokaghat",
      lastName: "Administrator",
      role: "school_admin",
      schoolPermissions: [1], // Assuming Bokaghat Jatiya Vidyalaya has ID 1
      culturePermissions: [],
      permissions: []
    }).returning();

    console.log("✅ Created Bokaghat Admin:", bokaghatAdmin[0].username);

    // 2. Create Mahuramukh Jatiya Vidyalay admin
    const mahurumukhAdmin = await db.insert(users).values({
      username: "mahuramukh_admin",
      email: "mahuramukh.admin@prayas.org",
      password: hashedPassword,
      firstName: "Mahuramukh",
      lastName: "Administrator",
      role: "school_admin",
      schoolPermissions: [3], // Assuming Mahuramukh Jatiya Vidyalay has ID 3
      culturePermissions: [],
      permissions: []
    }).returning();

    console.log("✅ Created Mahuramukh Admin:", mahurumukhAdmin[0].username);

    // 3. Create Culture admin for Prayas Kabya Kanan
    const cultureAdmin = await db.insert(users).values({
      username: "culture_admin",
      email: "culture.admin@prayas.org",
      password: hashedPassword,
      firstName: "Culture",
      lastName: "Administrator",
      role: "culture_admin",
      schoolPermissions: [],
      culturePermissions: [5], // Assuming Prayas Kabya Kanan has ID 5
      permissions: []
    }).returning();

    console.log("✅ Created Culture Admin:", cultureAdmin[0].username);

    console.log("\n🎉 Test admin users created successfully!");
    console.log("\nLogin credentials:");
    console.log("- Bokaghat Admin: bokaghat_admin / admin123");
    console.log("- Mahuramukh Admin: mahuramukh_admin / admin123");
    console.log("- Culture Admin: culture_admin / admin123");
    console.log("- Super Admin: Prayasadmin / [existing password]");

  } catch (error) {
    console.error("❌ Error setting up test admins:", error);
  }
}

setupTestAdmins();