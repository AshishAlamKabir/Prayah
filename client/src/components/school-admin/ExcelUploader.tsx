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
  fileName: string;
  detectedClass: string;
  detectedStream: string;
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  errors: string[];
}

interface PreviewResult {
  fileName: string;
  detectedClass: string;
  detectedStream: string;
  totalRows: number;
  preview: PreviewRow[];
  validationErrors: string[];
  columnMapping: Record<string, string[]>;
  estimatedValidRows: number;
}

interface PreviewRow {
  rowNumber: number;
  original: any;
  mapped: any;
  isValid: boolean;
  error?: string;
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
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const supportedFormats = [
    "ankur.xlsx", "Kuhi.xlsx", "SOPAN.xlsx",
    "I.xlsx", "II.xlsx", "III.xlsx", "IV.xlsx", "V.xlsx",
    "VI.xlsx", "VII.xlsx", "VIII.xlsx", "IX.xlsx", "X.xlsx",
    "XI Arts.xlsx", "XI Commerce.xlsx", "XI Science.xlsx",
    "XII Arts.xlsx", "XII Commerce.xlsx", "XII Science.xlsx",
    "Class IV.xlsx", "Class V.xlsx", "..."
  ];

  const expectedColumns = [
    "Name / first_name, middlename, last_name",
    "roll_no / RollNumber / Roll Number / Roll",
    "Class (auto-detected from filename)",
    "Stream (auto-detected from filename for XI/XII)",
    "father_name / mother_name / Parent Name",
    "mobile_no / ContactNumber / Contact Number",
    "current_address / permanent_address / Address",
    "date_of_birth / Date of Birth (optional)",
    "gender / Gender (optional)",
    "blood_group / Blood Group (optional)"
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

  const generatePreview = async () => {
    if (!selectedFile) return;

    setIsGeneratingPreview(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`/api/schools/${schoolId}/students/upload/preview`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Preview generation failed');
      }

      const result: PreviewResult = await response.json();
      setPreviewResult(result);
      setShowPreview(true);

      toast({
        title: "Preview generated!",
        description: `Found ${result.totalRows} rows. ${result.estimatedValidRows} appear valid.`,
      });
    } catch (error) {
      toast({
        title: "Preview failed",
        description: "Failed to preview Excel file. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPreview(false);
    }
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
        description: `Successfully imported ${result.successfulImports} of ${result.totalRows} students`,
      });

      // Clear file selection and preview
      setSelectedFile(null);
      setPreviewResult(null);
      setShowPreview(false);
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
            <div className="space-y-4">
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
              
              <div className="flex items-center gap-4">
                <Button 
                  onClick={generatePreview}
                  disabled={!selectedFile || isGeneratingPreview || isUploading}
                  variant="outline"
                >
                  {isGeneratingPreview ? "Generating Preview..." : "Preview Data"}
                </Button>
                <Button 
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading || isGeneratingPreview}
                  className="min-w-[120px]"
                >
                  {isUploading ? "Uploading..." : "Upload File"}
                </Button>
              </div>
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

      {/* Data Preview */}
      {showPreview && previewResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <FileSpreadsheet className="w-5 h-5 text-blue-500 mr-2" />
                Data Preview - {previewResult.fileName}
              </div>
              <Button 
                variant="ghost" 
                onClick={() => setShowPreview(false)}
                className="h-8 w-8 p-0"
              >
                ×
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Detection Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{previewResult.totalRows}</div>
                  <div className="text-sm text-gray-600">Total Rows</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{previewResult.estimatedValidRows}</div>
                  <div className="text-sm text-gray-600">Valid Rows</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">{previewResult.detectedClass || 'Not Detected'}</div>
                  <div className="text-sm text-gray-600">Detected Class</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">{previewResult.detectedStream || 'None'}</div>
                  <div className="text-sm text-gray-600">Detected Stream</div>
                </div>
              </div>

              {/* Validation Errors */}
              {previewResult.validationErrors.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Validation Issues Found:</h4>
                  <ul className="space-y-1 max-h-32 overflow-y-auto">
                    {previewResult.validationErrors.slice(0, 10).map((error, index) => (
                      <li key={index} className="text-sm text-yellow-700 flex items-start">
                        <AlertCircle className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                        {error}
                      </li>
                    ))}
                    {previewResult.validationErrors.length > 10 && (
                      <li className="text-sm text-yellow-600 italic">
                        ... and {previewResult.validationErrors.length - 10} more issues
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Sample Data Preview */}
              <div>
                <h4 className="font-medium mb-3">Sample Data (First 10 rows):</h4>
                <div className="border rounded-lg overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Row</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Roll No.</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Parent</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead className="w-20">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewResult.preview.map((row) => (
                        <TableRow key={row.rowNumber} className={!row.isValid ? 'bg-red-50' : ''}>
                          <TableCell className="font-mono text-sm">{row.rowNumber}</TableCell>
                          <TableCell className="font-medium">
                            {row.mapped?.name || 'N/A'}
                          </TableCell>
                          <TableCell>{row.mapped?.rollNumber || 'N/A'}</TableCell>
                          <TableCell>{row.mapped?.className || 'N/A'}</TableCell>
                          <TableCell>{row.mapped?.parentName || 'N/A'}</TableCell>
                          <TableCell>{row.mapped?.contactNumber || 'N/A'}</TableCell>
                          <TableCell>
                            {row.isValid ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500" title={row.error} />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              Upload Results - {uploadResult.fileName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{uploadResult.detectedClass || 'Auto'}</div>
                <div className="text-sm text-gray-600">Class Used</div>
              </div>
            </div>

            {uploadResult.errors.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Import Errors:</h4>
                <div className="bg-red-50 border border-red-200 rounded-md p-4 max-h-64 overflow-y-auto">
                  <ul className="space-y-1">
                    {uploadResult.errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-700 flex items-start">
                        <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                        {error}
                      </li>
                    ))}
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