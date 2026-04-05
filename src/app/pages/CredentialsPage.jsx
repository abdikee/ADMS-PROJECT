import React, { useState } from 'react';
import { Key, RefreshCw, Copy, Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useData } from '../contexts/DataContext.jsx';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '../components/ui/table.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { toast } from '../components/ui/sonner.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs.jsx';

export function CredentialsPage() {
  const { students, teachers, generateCredentials, regenerateCredentials } = useData();
  const [copiedId, setCopiedId] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState(new Set());
  const [generatingIds, setGeneratingIds] = useState(new Set());
  const [regeneratingIds, setRegeneratingIds] = useState(new Set());
  const [generatingAllStudents, setGeneratingAllStudents] = useState(false);
  const [generatingAllTeachers, setGeneratingAllTeachers] = useState(false);

  const handleGenerateCredentials = async (type, id, name) => {
    setGeneratingIds((prev) => new Set(prev).add(id));
    try {
      const { username, password } = await generateCredentials(type, id);
      toast.success(`Credentials generated for ${name}`, {
        description: `Username: ${username}\nPassword: ${password}`,
        duration: 5000,
      });
    } catch (error) {
      toast.error(`Failed to generate credentials for ${name}`, {
        description: error.message || 'An error occurred',
      });
    } finally {
      setGeneratingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleRegenerateCredentials = async (type, id, name) => {
    setRegeneratingIds((prev) => new Set(prev).add(id));
    try {
      const { username, password } = await regenerateCredentials(type, id);
      toast.success(`Credentials regenerated for ${name}`, {
        description: `New Username: ${username}\nNew Password: ${password}`,
        duration: 5000,
      });
    } catch (error) {
      toast.error(`Failed to regenerate credentials for ${name}`, {
        description: error.message || 'An error occurred',
      });
    } finally {
      setRegeneratingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleCopyCredentials = (username, password, id) => {
    const text = `Username: ${username}\nPassword: ${password}`;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Credentials copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePasswordVisibility = (id) => {
    setVisiblePasswords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) { newSet.delete(id); } else { newSet.add(id); }
      return newSet;
    });
  };

  const handleGenerateAllStudents = async () => {
    const studentsWithoutCredentials = students.filter((student) => !student.hasCredentials);
    if (studentsWithoutCredentials.length === 0) {
      toast.info('All students already have credentials');
      return;
    }
    setGeneratingAllStudents(true);
    let successCount = 0;
    let failCount = 0;
    for (const student of studentsWithoutCredentials) {
      try { await generateCredentials('student', student.id); successCount++; }
      catch (error) { failCount++; }
    }
    setGeneratingAllStudents(false);
    if (successCount > 0) toast.success(`Generated credentials for ${successCount} students`);
    if (failCount > 0) toast.error(`Failed to generate credentials for ${failCount} students`);
  };

  const handleGenerateAllTeachers = async () => {
    const teachersWithoutCredentials = teachers.filter((teacher) => !teacher.hasCredentials);
    if (teachersWithoutCredentials.length === 0) {
      toast.info('All teachers already have credentials');
      return;
    }
    setGeneratingAllTeachers(true);
    let successCount = 0;
    let failCount = 0;
    for (const teacher of teachersWithoutCredentials) {
      try { await generateCredentials('teacher', teacher.id); successCount++; }
      catch (error) { failCount++; }
    }
    setGeneratingAllTeachers(false);
    if (successCount > 0) toast.success(`Generated credentials for ${successCount} teachers`);
    if (failCount > 0) toast.error(`Failed to generate credentials for ${failCount} teachers`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Credentials Management</h2>
          <p className="text-gray-600 mt-1">Generate and manage login credentials for students and teachers</p>
        </div>
      </div>

      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Student Credentials</CardTitle>
                <Button onClick={handleGenerateAllStudents} className="bg-blue-600 hover:bg-blue-700" disabled={generatingAllStudents}>
                  {generatingAllStudents ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                  Generate All Missing
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                        <TableCell>{student.grade}</TableCell>
                        <TableCell>
                          {student.username ? (
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">{student.username}</code>
                          ) : <span className="text-gray-400">Not generated</span>}
                        </TableCell>
                        <TableCell>
                          {student.password ? (
                            <div className="flex items-center gap-2">
                              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                {visiblePasswords.has(student.id) ? student.password : '••••••••'}
                              </code>
                              <button onClick={() => togglePasswordVisibility(student.id)} className="text-gray-500 hover:text-gray-700">
                                {visiblePasswords.has(student.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          ) : <span className="text-gray-400">Not generated</span>}
                        </TableCell>
                        <TableCell>
                          {student.hasCredentials ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-600">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {student.hasCredentials ? (
                              <>
                                <Button variant="outline" size="sm" onClick={() => handleCopyCredentials(student.username, student.password, student.id)}>
                                  {copiedId === student.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleRegenerateCredentials('student', student.id, `${student.firstName} ${student.lastName}`)} disabled={regeneratingIds.has(student.id)}>
                                  {regeneratingIds.has(student.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                </Button>
                              </>
                            ) : (
                              <Button size="sm" onClick={() => handleGenerateCredentials('student', student.id, `${student.firstName} ${student.lastName}`)} className="bg-blue-600 hover:bg-blue-700" disabled={generatingIds.has(student.id)}>
                                {generatingIds.has(student.id) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                                Generate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Teacher Credentials</CardTitle>
                <Button onClick={handleGenerateAllTeachers} className="bg-blue-600 hover:bg-blue-700" disabled={generatingAllTeachers}>
                  {generatingAllTeachers ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                  Generate All Missing
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell className="font-medium">{teacher.firstName} {teacher.lastName}</TableCell>
                        <TableCell>{teacher.departmentName}</TableCell>
                        <TableCell>
                          {teacher.username ? (
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">{teacher.username}</code>
                          ) : <span className="text-gray-400">Not generated</span>}
                        </TableCell>
                        <TableCell>
                          {teacher.password ? (
                            <div className="flex items-center gap-2">
                              <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                                {visiblePasswords.has(teacher.id) ? teacher.password : '••••••••'}
                              </code>
                              <button onClick={() => togglePasswordVisibility(teacher.id)} className="text-gray-500 hover:text-gray-700">
                                {visiblePasswords.has(teacher.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          ) : <span className="text-gray-400">Not generated</span>}
                        </TableCell>
                        <TableCell>
                          {teacher.hasCredentials ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-600">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {teacher.hasCredentials ? (
                              <>
                                <Button variant="outline" size="sm" onClick={() => handleCopyCredentials(teacher.username, teacher.password, teacher.id)}>
                                  {copiedId === teacher.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleRegenerateCredentials('teacher', teacher.id, `${teacher.firstName} ${teacher.lastName}`)} disabled={regeneratingIds.has(teacher.id)}>
                                  {regeneratingIds.has(teacher.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                </Button>
                              </>
                            ) : (
                              <Button size="sm" onClick={() => handleGenerateCredentials('teacher', teacher.id, `${teacher.firstName} ${teacher.lastName}`)} className="bg-blue-600 hover:bg-blue-700" disabled={generatingIds.has(teacher.id)}>
                                {generatingIds.has(teacher.id) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                                Generate
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Key className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">About Credentials</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Usernames are automatically generated based on names</li>
                <li>• Passwords are randomly generated 8-character strings</li>
                <li>• Students and teachers use these credentials to login</li>
                <li>• You can regenerate credentials at any time</li>
                <li>• Copy credentials to share with students/teachers</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
