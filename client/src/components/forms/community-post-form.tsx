import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertCommunityPostSchema } from "@shared/schema";
import { z } from "zod";

const formSchema = insertCommunityPostSchema.extend({
  agreeToGuidelines: z.boolean().refine(val => val === true, {
    message: "You must agree to the community guidelines"
  })
});

type FormData = z.infer<typeof formSchema>;

const categories = [
  "Education Initiative",
  "Cultural Program", 
  "Community Organizing",
  "Social Justice",
  "Revolutionary Literature"
];

export default function CommunityPostForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "",
      authorName: "",
      authorEmail: "",
      agreeToGuidelines: false,
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { agreeToGuidelines, ...postData } = data;
      await apiRequest("POST", "/api/community-posts", postData);
    },
    onSuccess: () => {
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/community-posts"] });
      toast({
        title: "Success!",
        description: "Your post has been submitted for review and will be published once approved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to submit post: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    submitMutation.mutate(data);
  };

  return (
    <Card className="bg-white text-gray-900">
      <CardContent className="p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="authorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Full Name *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="Enter your full name"
                        className="focus:ring-2 focus:ring-red-800 focus:border-red-800"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="authorEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">Email Address *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        type="email"
                        placeholder="your.email@example.com"
                        className="focus:ring-2 focus:ring-red-800 focus:border-red-800"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Post Category *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="focus:ring-2 focus:ring-red-800 focus:border-red-800">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Post Title *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      placeholder="Give your post a compelling title"
                      className="focus:ring-2 focus:ring-red-800 focus:border-red-800"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Content *</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field}
                      rows={6}
                      placeholder="Share your revolutionary ideas and community initiatives..."
                      className="focus:ring-2 focus:ring-red-800 focus:border-red-800"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="agreeToGuidelines"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="focus:ring-red-800 border-gray-300"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm text-gray-600">
                      I agree to the community guidelines and understand this post will be reviewed before publication
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              disabled={submitMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit for Review"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
