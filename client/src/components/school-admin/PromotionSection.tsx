import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  TrendingUp, 
  Users, 
  Search, 
  GraduationCap,
  ArrowRight,
  BookOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: number;
  name: string;
  rollNumber: string;
  className: string;
  status: string;
  stream?: string;
}

interface PromotionSectionProps {
  schoolId: number;
}

export default function PromotionSection({ schoolId }: PromotionSectionProps) {
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [reason, setReason] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [isPromoting, setIsPromoting] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch active students eligible for promotion
  const { data: students = [], isLoading } = useQuery({
    queryKey: ["/api/schools", schoolId, "students", "status", "active"],
    queryFn: () => apiRequest("GET", `/api/schools/${schoolId}/students/status/active`).then(res => res.json()),
  });

  // Fetch class hierarchy for next class calculation
  const { data: classHierarchy } = useQuery({
    queryKey: ["/api/class-hierarchy"],
    queryFn: () => apiRequest("GET", `/api/class-hierarchy`).then(res => res.json()),
  });

  const getNextClass = (currentClass: string): string | null => {
    if (!classHierarchy?.classList) return null;
    const currentIndex = classHierarchy.classList.indexOf(currentClass);
    if (currentIndex === -1 || currentIndex === classHierarchy.classList.length - 1) return null;
    return classHierarchy.classList[currentIndex + 1];
  };

  // Filter and search students
  const filteredStudents = useMemo(() => {
    return students?.filter((student: Student) => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = classFilter === "all" || student.className === classFilter;
      
      return matchesSearch && matchesClass && student.status === 'active';
    }) || [];
  }, [students, searchTerm, classFilter]);

  // Get unique classes for filter
  const uniqueClasses = useMemo(() => {
    const classes = students?.map((s: Student) => s.className) || [];
    return Array.from(new Set(classes)).sort();
  }, [students]);

  // Group students by class for promotion preview
  const studentsByClass = useMemo(() => {
    return filteredStudents.reduce((acc: Record<string, Student[]>, student: Student) => {
      if (!acc[student.className]) {
        acc[student.className] = [];
      }
      acc[student.className].push(student);
      return acc;
    }, {});
  }, [filteredStudents]);

  const handleStudentSelection = (studentId: number, checked: boolean) => {
    if (checked) {
      setSelectedStudents([...selectedStudents, studentId]);
    } else {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(filteredStudents.map((s: Student) => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectClass = (className: string, checked: boolean) => {
    const classStudents = studentsByClass[className] || [];
    const classStudentIds = classStudents.map(s => s.id);
    
    if (checked) {
      setSelectedStudents([...new Set([...selectedStudents, ...classStudentIds])]);
    } else {
      setSelectedStudents(selectedStudents.filter(id => !classStudentIds.includes(id)));
    }
  };

  const handleBulkPromotion = async () => {
    if (selectedStudents.length === 0) return;

    setIsPromoting(true);
    try {
      // Promote all selected students
      await Promise.all(
        selectedStudents.map(studentId =>
          apiRequest("PUT", `/api/students/${studentId}/status`, {
            newStatus: "promoted",
            reason: reason || "Academic year promotion",
          })
        )
      );

      queryClient.invalidateQueries({ queryKey: ["/api/schools", schoolId, "students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schools", schoolId, "students", "status"] });
      
      toast({
        title: "Success!",
        description: `Promoted ${selectedStudents.length} student(s) to their next classes`,
      });
      
      setSelectedStudents([]);
      setReason("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to promote students",
        variant: "destructive",
      });
    } finally {
      setIsPromoting(false);
    }
  };

  const getSelectedStudentsByClass = () => {
    return Object.entries(studentsByClass).reduce((acc, [className, classStudents]) => {
      const selectedInClass = classStudents.filter(s => selectedStudents.includes(s.id));
      if (selectedInClass.length > 0) {
        acc[className] = selectedInClass;
      }
      return acc;
    }, {} as Record<string, Student[]>);
  };

  const selectedByClass = getSelectedStudentsByClass();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-2 text-sm text-muted-foreground">Loading students...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 mx-auto text-blue-500" />
            <div className="text-2xl font-bold mt-2">{filteredStudents.length}</div>
            <p className="text-sm text-muted-foreground">Eligible for Promotion</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto text-green-500" />
            <div className="text-2xl font-bold mt-2">{selectedStudents.length}</div>
            <p className="text-sm text-muted-foreground">Selected</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="w-8 h-8 mx-auto text-purple-500" />
            <div className="text-2xl font-bold mt-2">{Object.keys(studentsByClass).length}</div>
            <p className="text-sm text-muted-foreground">Classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <GraduationCap className="w-8 h-8 mx-auto text-orange-500" />
            <div className="text-2xl font-bold mt-2">{Object.keys(selectedByClass).length}</div>
            <p className="text-sm text-muted-foreground">Classes Selected</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
            Student Promotion Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search by name or roll number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {uniqueClasses.map((className) => (
                  <SelectItem key={className} value={className}>
                    Class {className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Promotion Reason */}
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">
              Promotion Reason (Optional)
            </label>
            <Textarea
              placeholder="Enter reason for promotion (e.g., Academic year 2024-25 completion)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          {/* Promotion Preview */}
          {selectedStudents.length > 0 && (
            <Card className="mb-6 border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-800 text-sm">
                  Promotion Preview - {selectedStudents.length} Students Selected
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2">
                  {Object.entries(selectedByClass).map(([className, classStudents]) => {
                    const nextClass = getNextClass(className);
                    return (
                      <div key={className} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex items-center">
                          <Badge variant="secondary">{className}</Badge>
                          <ArrowRight className="w-4 h-4 mx-2 text-green-600" />
                          <Badge variant="default" className="bg-green-600">
                            {nextClass || "Cannot promote further"}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {classStudents.length} student(s)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium">
                Select All ({filteredStudents.length})
              </label>
            </div>
            
            {selectedStudents.length > 0 && (
              <Button 
                onClick={handleBulkPromotion} 
                disabled={isPromoting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isPromoting ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Promoting...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Promote Selected ({selectedStudents.length})
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Students by Class */}
          {Object.keys(studentsByClass).length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No eligible students found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(studentsByClass).map(([className, classStudents]) => {
                const nextClass = getNextClass(className);
                const allClassSelected = classStudents.every(s => selectedStudents.includes(s.id));
                
                return (
                  <Card key={className}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={allClassSelected}
                            onCheckedChange={(checked) => handleSelectClass(className, !!checked)}
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary">Class {className}</Badge>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                              <Badge variant={nextClass ? "default" : "destructive"}>
                                {nextClass || "Final Class"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {classStudents.length} students
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {classStudents.map((student: Student) => (
                          <div
                            key={student.id}
                            className={`flex items-center space-x-2 p-2 rounded border ${
                              selectedStudents.includes(student.id) 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-gray-50'
                            }`}
                          >
                            <Checkbox
                              checked={selectedStudents.includes(student.id)}
                              onCheckedChange={(checked) => handleStudentSelection(student.id, !!checked)}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{student.name}</p>
                              <p className="text-xs text-muted-foreground">Roll: {student.rollNumber}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}