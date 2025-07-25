import { storage } from "./storage";
import bcrypt from "bcrypt";

async function createTestUser() {
  try {
    const hashedPassword = await bcrypt.hash("testuser123", 10);
    
    const testUser = await storage.createUser({
      username: "testuser",
      email: "testuser@example.com", 
      password: hashedPassword,
      firstName: "Test",
      lastName: "User",
      role: "user"
    });
    
    console.log("Test user created successfully:", {
      id: testUser.id,
      username: testUser.username,
      email: testUser.email,
      role: testUser.role
    });
    
    console.log("\nLogin credentials:");
    console.log("Username: testuser");
    console.log("Password: testuser123");
    
  } catch (error) {
    console.error("Error creating test user:", error);
  }
}

createTestUser();