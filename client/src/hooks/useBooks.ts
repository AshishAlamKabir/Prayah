import { useQuery, useMutation } from "@tanstack/react-query";
import { BookService, Book, BookFilters } from "@/services/bookService";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useBooks(filters?: BookFilters) {
  return useQuery<Book[]>({
    queryKey: ["/api/books", filters],
    queryFn: () => BookService.getAllBooks(filters),
  });
}

export function useBook(bookId: number) {
  return useQuery<Book>({
    queryKey: ["/api/books", bookId],
    queryFn: () => BookService.getBook(bookId),
    enabled: !!bookId,
  });
}

export function useSearchBooks(query: string) {
  return useQuery<Book[]>({
    queryKey: ["/api/books/search", query],
    queryFn: () => BookService.searchBooks(query),
    enabled: !!query && query.length > 2,
  });
}

export function useBooksByCategory(category: string) {
  return useQuery<Book[]>({
    queryKey: ["/api/books/category", category],
    queryFn: () => BookService.getBooksByCategory(category),
    enabled: !!category,
  });
}

export function useCreateBook() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: BookService.createBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({
        title: "Success",
        description: "Book created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create book. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBook() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ bookId, data }: { bookId: number; data: Partial<Book> }) =>
      BookService.updateBook(bookId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({
        title: "Success",
        description: "Book updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update book. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteBook() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: BookService.deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({
        title: "Success",
        description: "Book deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete book. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateBookStock() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ bookId, stock }: { bookId: number; stock: number }) =>
      BookService.updateStock(bookId, stock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({
        title: "Success",
        description: "Stock updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update stock. Please try again.",
        variant: "destructive",
      });
    },
  });
}