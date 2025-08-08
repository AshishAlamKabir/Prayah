import { useQuery, useMutation } from "@tanstack/react-query";
import { SchoolService, School, PaymentSettings } from "@/services/schoolService";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useSchools() {
  return useQuery<School[]>({
    queryKey: ["/api/schools"],
    queryFn: SchoolService.getAllSchools,
  });
}

export function useSchool(schoolId: number) {
  return useQuery<School>({
    queryKey: ["/api/schools", schoolId],
    queryFn: () => SchoolService.getSchool(schoolId),
    enabled: !!schoolId,
  });
}

export function useUpdatePaymentSettings() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ schoolId, settings }: { schoolId: number; settings: PaymentSettings }) =>
      SchoolService.updatePaymentSettings(schoolId, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools"] });
      queryClient.refetchQueries({ queryKey: ["/api/schools"] });
      toast({
        title: "Settings Updated",
        description: "Fee payment settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update payment settings. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useCreateSchool() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: SchoolService.createSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools"] });
      toast({
        title: "Success",
        description: "School created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create school. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateSchool() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ schoolId, data }: { schoolId: number; data: Partial<School> }) =>
      SchoolService.updateSchool(schoolId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools"] });
      toast({
        title: "Success",
        description: "School updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update school. Please try again.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteSchool() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: SchoolService.deleteSchool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools"] });
      toast({
        title: "Success",
        description: "School deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete school. Please try again.",
        variant: "destructive",
      });
    },
  });
}