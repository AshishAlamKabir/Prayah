import bcrypt from "bcrypt";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function createAdminAccount() {
  try {
    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.username, "Prayasadmin"))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("Admin account 'Prayasadmin' already exists!");
      return;
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash("Prayas2025!", saltRounds);

    // Create admin account
    const [adminUser] = await db
      .insert(users)
      .values({
        username: "Prayasadmin",
        email: "admin@prayas.org",
        password: hashedPassword,
        firstName: "Prayas",
        lastName: "Administrator",
        role: "admin",
        isSubscribed: true, // Admin has full access
        subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      })
      .returning();

    console.log("✅ Admin account created successfully!");
    console.log("Username: Prayasadmin");
    console.log("Email: admin@prayas.org");
    console.log("Password: Prayas2025!");
    console.log("Role: admin");
    console.log("Subscription: Active (1 year)");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin account:", error);
    process.exit(1);
  }
}

createAdminAccount();