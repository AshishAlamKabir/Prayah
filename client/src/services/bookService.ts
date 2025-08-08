import { apiRequest } from "@/lib/queryClient";

export interface Book {
  id: number;
  title: string;
  author: string;
  price: number;
  description: string;
  coverImage?: string;
  category: string;
  stock: number;
  published: boolean;
}

export interface BookFilters {
  category?: string;
  author?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}

export interface CartItem {
  id: number;
  bookId: number;
  quantity: number;
  book: Book;
}

export class BookService {
  static async getAllBooks(filters?: BookFilters): Promise<Book[]> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const url = `/api/books${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiRequest("GET", url);
    return await response.json();
  }

  static async getBook(bookId: number): Promise<Book> {
    const response = await apiRequest("GET", `/api/books/${bookId}`);
    return await response.json();
  }

  static async createBook(bookData: Partial<Book>): Promise<Book> {
    const response = await apiRequest("POST", "/api/books", bookData);
    return await response.json();
  }

  static async updateBook(bookId: number, bookData: Partial<Book>): Promise<Book> {
    const response = await apiRequest("PUT", `/api/books/${bookId}`, bookData);
    return await response.json();
  }

  static async deleteBook(bookId: number): Promise<void> {
    await apiRequest("DELETE", `/api/books/${bookId}`);
  }

  static async searchBooks(query: string): Promise<Book[]> {
    const response = await apiRequest("GET", `/api/books/search?q=${encodeURIComponent(query)}`);
    return await response.json();
  }

  static async getBooksByCategory(category: string): Promise<Book[]> {
    const response = await apiRequest("GET", `/api/books/category/${encodeURIComponent(category)}`);
    return await response.json();
  }

  static async updateStock(bookId: number, stock: number): Promise<void> {
    await apiRequest("PUT", `/api/books/${bookId}/stock`, { stock });
  }
}