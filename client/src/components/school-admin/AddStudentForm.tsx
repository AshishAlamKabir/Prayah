import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Save } from "lucide-react";

const studentFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  rollNumber: z.string().min(1, "Roll number is required"),
  className: z.string().min(1, "Class is required"),
  stream: z.string().optional(),
  parentName: z.string().optional(),
  contactNumber: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  previousSchool: z.string().optional(),
  remarks: z.string().optional(),
});

type StudentFormData = z.infer<typeof studentFormSchema>;

interface AddStudentFormProps {
  schoolId: number;
  classHierarchy?: {
    classOrder: Record<string, number>;
    classList: string[];
  };
}

export default function AddStudentForm({ schoolId, classHierarchy }: AddStudentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: "",
      rollNumber: "",
      className: "",
      stream: "",
      parentName: "",
      contactNumber: "",
      address: "",
      dateOfBirth: "",
      gender: "",
      previousSchool: "",
      remarks: "",
    },
  });

  const watchedClass = form.watch("className");
  const isStreamClass = watchedClass && (watchedClass.includes("XI") || watchedClass.includes("XII"));

  const onSubmit = async (data: StudentFormData) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", `/api/schools/${schoolId}/students`, {
        body: JSON.stringify({
          ...data,
          admissionDate: new Date().toISOString(),
          status: "active",
        }),
      });

      queryClient.invalidateQueries({ queryKey: ["/api/schools", schoolId, "students"] });
      
      toast({
        title: "Success!",
        description: "Student added successfully",
      });

      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add student. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const classList = classHierarchy?.classList || [
    "Ankur", "Kuhi", "Sopan", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
    "XI Arts", "XI Commerce", "XI Science", "XII Arts", "XII Commerce", "XII Science"
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserPlus className="w-5 h-5 mr-2" />
          Add New Student
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rollNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roll Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter roll number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Academic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="className"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classList.map((className) => (
                          <SelectItem key={className} value={className}>
                            {className}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isStreamClass && (
                <FormField
                  control={form.control}
                  name="stream"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stream</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stream" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Arts">Arts</SelectItem>
                          <SelectItem value="Commerce">Commerce</SelectItem>
                          <SelectItem value="Science">Science</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Guardian Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="parentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent/Guardian Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter parent/guardian name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address and Additional Info */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter complete address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="previousSchool"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous School</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter previous school name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Input placeholder="Any additional notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding Student...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Add Student
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}