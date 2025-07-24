import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCommunityPostSchema, insertSchoolSchema, insertCultureCategorySchema, insertBookSchema, insertPublishedWorkSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Statistics endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Community posts endpoints
  app.get("/api/community-posts", async (req, res) => {
    try {
      const status = req.query.status as string;
      const posts = await storage.getCommunityPosts(status);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching community posts:", error);
      res.status(500).json({ message: "Failed to fetch community posts" });
    }
  });

  app.get("/api/community-posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const post = await storage.getCommunityPost(id);
      if (!post) {
        return res.status(404).json({ message: "Community post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching community post:", error);
      res.status(500).json({ message: "Failed to fetch community post" });
    }
  });

  app.post("/api/community-posts", async (req, res) => {
    try {
      const validatedData = insertCommunityPostSchema.parse(req.body);
      const post = await storage.createCommunityPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating community post:", error);
      res.status(500).json({ message: "Failed to create community post" });
    }
  });

  app.patch("/api/community-posts/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      
      const post = await storage.updateCommunityPostStatus(id, status);
      if (!post) {
        return res.status(404).json({ message: "Community post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error updating community post status:", error);
      res.status(500).json({ message: "Failed to update community post status" });
    }
  });

  app.delete("/api/community-posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCommunityPost(id);
      if (!success) {
        return res.status(404).json({ message: "Community post not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting community post:", error);
      res.status(500).json({ message: "Failed to delete community post" });
    }
  });

  // Schools endpoints
  app.get("/api/schools", async (req, res) => {
    try {
      const schools = await storage.getSchools();
      res.json(schools);
    } catch (error) {
      console.error("Error fetching schools:", error);
      res.status(500).json({ message: "Failed to fetch schools" });
    }
  });

  app.get("/api/schools/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const school = await storage.getSchool(id);
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      res.json(school);
    } catch (error) {
      console.error("Error fetching school:", error);
      res.status(500).json({ message: "Failed to fetch school" });
    }
  });

  app.post("/api/schools", async (req, res) => {
    try {
      const validatedData = insertSchoolSchema.parse(req.body);
      const school = await storage.createSchool(validatedData);
      res.status(201).json(school);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating school:", error);
      res.status(500).json({ message: "Failed to create school" });
    }
  });

  // Culture categories endpoints
  app.get("/api/culture-categories", async (req, res) => {
    try {
      const categories = await storage.getCultureCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching culture categories:", error);
      res.status(500).json({ message: "Failed to fetch culture categories" });
    }
  });

  app.post("/api/culture-categories", async (req, res) => {
    try {
      const validatedData = insertCultureCategorySchema.parse(req.body);
      const category = await storage.createCultureCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating culture category:", error);
      res.status(500).json({ message: "Failed to create culture category" });
    }
  });

  // Books endpoints
  app.get("/api/books", async (req, res) => {
    try {
      const category = req.query.category as string;
      const books = category 
        ? await storage.getBooksByCategory(category)
        : await storage.getBooks();
      res.json(books);
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  app.get("/api/books/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const book = await storage.getBook(id);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      res.json(book);
    } catch (error) {
      console.error("Error fetching book:", error);
      res.status(500).json({ message: "Failed to fetch book" });
    }
  });

  app.post("/api/books", async (req, res) => {
    try {
      const validatedData = insertBookSchema.parse(req.body);
      const book = await storage.createBook(validatedData);
      res.status(201).json(book);
    } catch (error) {
      if (error instanceof Error && error.name === "ZodError") {
        const validationError = fromZodError(error as any);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating book:", error);
      res.status(500).json({ message: "Failed to create book" });
    }
  });

  // Published works endpoints
  app.get("/api/published-works", async (req, res) => {
    try {
      const featured = req.query.featured === "true";
      const works = featured 
        ? await storage.getFeaturedPublishedWorks()
        : await storage.getPublishedWorks();
      res.json(works);
    } catch (error) {
      console.error("Error fetching published works:", error);
      res.status(500).json({ message: "Failed to fetch published works" });
    }
  });

  app.post("/api/published-works/:id/download", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.incrementDownloadCount(id);
      res.status(200).json({ message: "Download count incremented" });
    } catch (error) {
      console.error("Error incrementing download count:", error);
      res.status(500).json({ message: "Failed to increment download count" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
