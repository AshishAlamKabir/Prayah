import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadResult {
  message: string;
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  errors: string[];
}

interface ExcelUploaderProps {
  schoolId: number;
  classHierarchy?: {
    classOrder: Record<string, number>;
    classList: string[];
  };
}

export default function ExcelUploader({ schoolId, classHierarchy }: ExcelUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const supportedFormats = [
    "ankur.xlsx", "Kuhi.xlsx", "SOPAN.xlsx",
    "I.xlsx", "II.xlsx", "...", "X.xlsx",
    "XI_arts.xlsx", "XI_commerce.xlsx", "XI_science.xlsx",
    "XII_arts.xlsx", "XII_commerce.xlsx", "XII_science.xlsx"
  ];

  const expectedColumns = [
    "Name / Student Name",
    "RollNumber / Roll Number / Roll",
    "Class (optional if filename contains class)",
    "Stream (optional if filename contains stream)",
    "ParentName / Parent Name",
    "ContactNumber / Contact Number",
    "Address"
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.match(/\\.(xlsx|xls)$/)) {
      toast({
        title: "Invalid file type",
        description: "Please select an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const response = await fetch(`/api/schools/${schoolId}/students/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result: UploadResult = await response.json();
      setUploadResult(result);
      setUploadProgress(100);

      // Invalidate students query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/schools", schoolId, "students"] });

      toast({
        title: "Upload completed!",
        description: `Successfully imported ${result.successfulImports} students`,
      });

      // Clear file selection
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to process Excel file. Please check the format and try again.",
        variant: "destructive",
      });
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
      clearInterval(progressInterval);
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Excel Upload Instructions</AlertTitle>
        <AlertDescription>
          Upload Excel files containing student data. The system automatically extracts class and stream information from the filename.
        </AlertDescription>
      </Alert>

      {/* File Format Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Supported File Formats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {supportedFormats.map((format, index) => (
                <Badge key={index} variant="outline" className="justify-center">
                  {format}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Class and stream information will be automatically extracted from the filename.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expected Excel Columns</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {expectedColumns.map((column, index) => (
                <li key={index} className="text-sm flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  {column}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Upload Student Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 
                           file:mr-4 file:py-2 file:px-4
                           file:rounded-md file:border-0
                           file:text-sm file:font-medium
                           file:bg-blue-50 file:text-blue-700
                           hover:file:bg-blue-100"
              />
              <Button 
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="min-w-[120px]"
              >
                {isUploading ? "Uploading..." : "Upload File"}
              </Button>
            </div>

            {selectedFile && (
              <div className="flex items-center p-3 bg-blue-50 rounded-md">
                <FileSpreadsheet className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <Badge variant="secondary" className="ml-auto">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </Badge>
              </div>
            )}

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing file...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Results */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {uploadResult.failedImports === 0 ? (
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
              )}
              Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{uploadResult.totalRows}</div>
                <div className="text-sm text-gray-600">Total Rows</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{uploadResult.successfulImports}</div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{uploadResult.failedImports}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>

            {uploadResult.errors.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Import Errors:</h4>
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <ul className="space-y-1">
                    {uploadResult.errors.slice(0, 10).map((error, index) => (
                      <li key={index} className="text-sm text-red-700 flex items-start">
                        <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                        {error}
                      </li>
                    ))}
                    {uploadResult.errors.length > 10 && (
                      <li className="text-sm text-red-600 italic">
                        ... and {uploadResult.errors.length - 10} more errors
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}