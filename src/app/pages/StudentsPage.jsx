import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Eye } from 'lucide-react';
import { useData } from '../contexts/DataContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Navigate } from 'react-router';
import { getTeacherAssignedClassIds } from '../utils/teacherAssignments.js';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.jsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog.jsx';
import { toast } from '../components/ui/sonner.jsx';

const initialFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  classId: '',
  dateOfBirth: '',
  gender: 'Male',
  username: '',
  password: '',
};

export function StudentsPage() {
  const { user } = useAuth();
  const { students, classes, teachers, addStudent, updateStudent, deleteStudent } = useData();
  const isAdmin = user?.role === 'Admin';
  const isTeacher = user?.role === 'Teacher';

  if (!isAdmin && !isTeacher) {
    return <Navigate to="/" replace />;
  }

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(initialFormData);

  const resetForm = () => setFormData(initialFormData);

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error('First name and last name are required');
      return false;
    }
    if (!formData.email) {
      toast.error('Email is required');
      return false;
    }
    if (!formData.classId) {
      toast.error('Class is required');
      return false;
    }
    if (!formData.dateOfBirth) {
      toast.error('Date of birth is required');
      return false;
    }
    if (!formData.username) {
      toast.error('Username is required');
      return false;
    }
    if (!formData.password) {
      toast.error('Password is required');
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;

    try {
      await addStudent({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        classId: formData.classId ? parseInt(formData.classId, 10) : undefined,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        username: formData.username,
        password: formData.password,
      });
      toast.success('Student added successfully');
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error.message || 'Failed to add student');
    }
  };

  const handleEdit = (student) => {
    if (!isAdmin) return;
    setSelectedStudent(student);
    setFormData({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
      phone: student.phone || '',
      classId: student.classId?.toString() || '',
      dateOfBirth: student.dateOfBirth || '',
      gender: student.gender || 'Male',
      username: '',
      password: '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!isAdmin || !selectedStudent) return;

    if (!formData.firstName || !formData.lastName) {
      toast.error('First name and last name are required');
      return;
    }

    try {
      await updateStudent(selectedStudent.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        classId: parseInt(formData.classId, 10),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
      });
      toast.success('Student updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      setSelectedStudent(null);
    } catch (error) {
      toast.error(error.message || 'Failed to update student');
    }
  };

  const handleDeleteClick = (student) => {
    if (!isAdmin) return;
    setSelectedStudent(student);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!isAdmin || !selectedStudent) return;

    try {
      await deleteStudent(selectedStudent.id);
      toast.success('Student deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedStudent(null);
    } catch (error) {
      toast.error(error.message || 'Failed to delete student');
    }
  };

  const currentTeacher = isTeacher ? teachers.find((teacher) => teacher.id === user?.id) : null;
  const teacherClassIds = getTeacherAssignedClassIds(currentTeacher, classes);

  const visibleStudents = isTeacher
    ? students.filter((student) => teacherClassIds.includes(String(student.classId)))
    : students;

  const filteredStudents = visibleStudents.filter((student) =>
    (student.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (student.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (student.rollNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (student.className?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Information</h2>
          <p className="text-gray-600 mt-1">
            {isAdmin
              ? 'Manage student records and class assignments.'
              : 'Read-only access to the students in your assigned classes.'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        )}
      </div>

      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by name, roll number, or class..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {isTeacher ? 'Assigned Students' : 'All Students'} ({filteredStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Roll Number</TableHead>
                  <TableHead>Admission #</TableHead>
                  <TableHead>Email</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-sm">{student.id}</TableCell>
                      <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                      <TableCell>{student.className || '-'}</TableCell>
                      <TableCell>{student.gender}</TableCell>
                      <TableCell>{student.rollNumber}</TableCell>
                      <TableCell>{student.admissionNumber}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(student)}
                              className="hover:bg-blue-50 hover:text-blue-600"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(student)}
                              className="hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 8 : 7} className="text-center py-8 text-gray-500">
                      {searchTerm ? 'No students found matching your search' : 'No students available'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {isTeacher && (
        <Card className="border-gray-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 text-blue-900">
              <Eye className="w-5 h-5 mt-0.5" />
              <div>
                <p className="font-medium">Teacher access is read-only.</p>
                <p className="text-sm mt-1">Only administrators can add, edit, or remove students. You can review student information for your assigned classes here.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="sm:max-w-[600px] mx-2 sm:mx-auto">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>Enter the student's information below to add them to the system.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" placeholder="Sara" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" placeholder="Ali" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" placeholder="student1@marvelschool.edu" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" placeholder="+251900000002" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="classId">Class *</Label>
                    <Select value={formData.classId || ""} onValueChange={(value) => setFormData({ ...formData, classId: value })}>
                      <SelectTrigger id="classId">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} - Grade {cls.grade}{cls.section ? ` (${cls.section})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={formData.gender || ""} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                  One student can belong to only one class. Roll number and admission number are generated automatically after registration.
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                </div>
                <div className="border-t pt-4 mt-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Account Credentials</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username *</Label>
                      <Input id="username" placeholder="student1" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                      <Input id="password" type="password" placeholder="Student@123" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
                  Add Student
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[600px] mx-2 sm:mx-auto">
              <DialogHeader>
                <DialogTitle>Edit Student</DialogTitle>
                <DialogDescription>Update the student's information below.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-firstName">First Name</Label>
                    <Input id="edit-firstName" placeholder="Sara" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-lastName">Last Name</Label>
                    <Input id="edit-lastName" placeholder="Ali" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-email">Email</Label>
                    <Input id="edit-email" type="email" placeholder="student1@marvelschool.edu" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input id="edit-phone" placeholder="+251900000002" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-classId">Class</Label>
                    <Select value={formData.classId || ""} onValueChange={(value) => setFormData({ ...formData, classId: value })}>
                      <SelectTrigger id="edit-classId">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} - Grade {cls.grade}{cls.section ? ` (${cls.section})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-gender">Gender</Label>
                    <Select value={formData.gender || ""} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-dateOfBirth">Date of Birth</Label>
                  <Input id="edit-dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700">
                  Update Student
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the student
                  "{selectedStudent?.firstName} {selectedStudent?.lastName}" and all associated records.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
