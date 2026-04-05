import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useData } from '../contexts/DataContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Navigate } from 'react-router';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { Checkbox } from '../components/ui/checkbox.jsx';
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
import { Badge } from '../components/ui/badge.jsx';

const initialFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  departmentId: '',
  qualification: '',
  hireDate: '',
  username: '',
  password: '',
  subjectId: '',
  assignedClassIds: [],
  homeroomClassId: '',
};

const NO_HOMEROOM_VALUE = '__none__';

export function TeachersPage() {
  const { user } = useAuth();
  const { teachers, classes, subjects, departments, addTeacher, updateTeacher, deleteTeacher } = useData();

  if (user?.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(initialFormData);

  const resetForm = () => setFormData(initialFormData);

  const toggleAssignedClass = (classId, checked) => {
    setFormData((prev) => {
      const assignedClassIds = checked
        ? [...new Set([...prev.assignedClassIds, classId])]
        : prev.assignedClassIds.filter((value) => value !== classId);

      const homeroomClassId = assignedClassIds.includes(prev.homeroomClassId)
        ? prev.homeroomClassId
        : '';

      return { ...prev, assignedClassIds, homeroomClassId };
    });
  };

  const validateForm = (isEdit = false) => {
    if (!formData.firstName || !formData.lastName) {
      toast.error('First name and last name are required');
      return false;
    }
    if (!formData.email) {
      toast.error('Email is required');
      return false;
    }
    if (!formData.departmentId) {
      toast.error('Department is required');
      return false;
    }
    if (!formData.subjectId) {
      toast.error('Each teacher must be assigned exactly one subject');
      return false;
    }
    if (!isEdit && !formData.username) {
      toast.error('Username is required');
      return false;
    }
    if (!isEdit && !formData.password) {
      toast.error('Password is required');
      return false;
    }
    if (formData.homeroomClassId && !formData.assignedClassIds.includes(formData.homeroomClassId)) {
      toast.error('Homeroom class must also be one of the teacher teaching classes');
      return false;
    }
    return true;
  };

  const buildTeacherPayload = () => ({
    firstName: formData.firstName,
    lastName: formData.lastName,
    email: formData.email,
    phone: formData.phone,
    departmentId: parseInt(formData.departmentId, 10),
    qualification: formData.qualification,
    hireDate: formData.hireDate || undefined,
    subjectId: parseInt(formData.subjectId, 10),
    assignedClassIds: formData.assignedClassIds.map((classId) => parseInt(classId, 10)),
    homeroomClassId: formData.homeroomClassId ? parseInt(formData.homeroomClassId, 10) : null,
  });

  const handleAdd = async () => {
    if (!validateForm()) return;

    try {
      await addTeacher({
        ...buildTeacherPayload(),
        username: formData.username,
        password: formData.password,
      });
      toast.success('Teacher added successfully');
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error.message || 'Failed to add teacher');
    }
  };

  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      firstName: teacher.firstName || '',
      lastName: teacher.lastName || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      departmentId: teacher.departmentId?.toString() || '',
      qualification: teacher.qualification || '',
      hireDate: teacher.hireDate || '',
      username: '',
      password: '',
      subjectId: teacher.subjectId || '',
      assignedClassIds: teacher.assignedClassIds || (teacher.assignedClassId ? [teacher.assignedClassId] : []),
      homeroomClassId: teacher.homeroomClassId || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedTeacher || !validateForm(true)) return;

    try {
      await updateTeacher(selectedTeacher.id, buildTeacherPayload());
      toast.success('Teacher updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      setSelectedTeacher(null);
    } catch (error) {
      toast.error(error.message || 'Failed to update teacher');
    }
  };

  const handleDeleteClick = (teacher) => {
    setSelectedTeacher(teacher);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedTeacher) return;

    try {
      await deleteTeacher(selectedTeacher.id);
      toast.success('Teacher deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedTeacher(null);
    } catch (error) {
      toast.error(error.message || 'Failed to delete teacher');
    }
  };

  const filteredTeachers = teachers.filter((teacher) =>
    (teacher.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (teacher.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (teacher.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const renderClassSelection = () => (
    <div className="space-y-3">
      <Label>Teaching Classes</Label>
      <div className="grid gap-3 rounded-lg border border-gray-200 p-4 max-h-56 overflow-y-auto">
        {classes.length > 0 ? classes.map((cls) => {
          const checked = formData.assignedClassIds.includes(cls.id);
          return (
            <label key={cls.id} className="flex items-start gap-3 rounded-md border border-gray-100 px-3 py-2 hover:bg-gray-50">
              <Checkbox checked={checked} onCheckedChange={(value) => toggleAssignedClass(cls.id, value === true)} />
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">{cls.name}</p>
                <p className="text-xs text-gray-500">
                  Grade {cls.grade}{cls.section ? ` (${cls.section})` : ''}
                </p>
              </div>
            </label>
          );
        }) : (
          <p className="text-sm text-gray-500">No classes yet. You can create the teacher now and assign classes later.</p>
        )}
      </div>
    </div>
  );

  const homeroomOptions = classes.filter((cls) => formData.assignedClassIds.includes(cls.id));

  const renderSubjectSelect = () => (
    <div className="space-y-2">
      <Label>Subject * <span className="text-gray-400 text-xs font-normal">— one subject per teacher</span></Label>
      <Select value={formData.subjectId} onValueChange={(value) => setFormData((prev) => ({ ...prev, subjectId: value === '__none__' ? '' : value }))}>
        <SelectTrigger>
          <SelectValue placeholder="Select subject" />
        </SelectTrigger>
        <SelectContent className="max-h-48 overflow-y-auto">
          {subjects.map((subject) => (
            <SelectItem key={subject.id} value={subject.id}>
              {subject.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Teacher Management</h2>
          <p className="text-gray-600 mt-1">Assign one subject per teacher. Teaching classes and homeroom can be added later.</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Teacher
        </Button>
      </div>

      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">All Teachers ({filteredTeachers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Teaching Classes</TableHead>
                  <TableHead>Homeroom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.length > 0 ? (
                  filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-mono text-sm">{teacher.id}</TableCell>
                      <TableCell className="font-medium">{teacher.firstName} {teacher.lastName}</TableCell>
                      <TableCell>{teacher.subjectName || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {(teacher.assignedClassNames || (teacher.assignedClassName ? [teacher.assignedClassName] : [])).map((className) => (
                            <Badge key={`${teacher.id}-${className}`} variant="outline" className="bg-gray-50">
                              {className}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {teacher.homeroomClassName ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {teacher.homeroomClassName}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(teacher)}
                            className="hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(teacher)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      {searchTerm ? 'No teachers found matching your search' : 'No teachers added yet'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[760px] mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
            <DialogDescription>Create the teacher first. Class and homeroom assignments are optional and can be added later.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" placeholder="Abel" value={formData.firstName} onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" placeholder="Tesfaye" value={formData.lastName} onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="teacher1@marvelschool.edu" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="+251900000001" value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departmentId">Department *</Label>
                <Select value={formData.departmentId || ""} onValueChange={(value) => setFormData((prev) => ({ ...prev, departmentId: value }))}>
                  <SelectTrigger id="departmentId">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}{department.code ? ` (${department.code})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualification">Qualification</Label>
                <Input id="qualification" placeholder="B.Ed Mathematics" value={formData.qualification} onChange={(e) => setFormData((prev) => ({ ...prev, qualification: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="hireDate">Hire Date</Label>
              <Input id="hireDate" type="date" value={formData.hireDate} onChange={(e) => setFormData((prev) => ({ ...prev, hireDate: e.target.value }))} />
            </div>
            {renderSubjectSelect()}
            {renderClassSelection()}
            <div className="space-y-2">
              <Label>Homeroom Class</Label>
              <Select
                value={formData.homeroomClassId || NO_HOMEROOM_VALUE}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, homeroomClassId: value === NO_HOMEROOM_VALUE ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No homeroom class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_HOMEROOM_VALUE}>
                    No homeroom assignment
                  </SelectItem>
                  {homeroomOptions.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} - Grade {cls.grade}{cls.section ? ` (${cls.section})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="border-t pt-4 mt-2">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Account Credentials</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input id="username" placeholder="teacher1" value={formData.username} onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input id="password" type="password" placeholder="Teacher@123" value={formData.password} onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">Add Teacher</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[760px] mx-2 sm:mx-auto">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>Update the teacher details, subject, and teaching classes.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input id="edit-firstName" placeholder="Abel" value={formData.firstName} onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input id="edit-lastName" placeholder="Tesfaye" value={formData.lastName} onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" placeholder="teacher1@marvelschool.edu" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input id="edit-phone" placeholder="+251900000001" value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-departmentId">Department</Label>
                <Select value={formData.departmentId || ""} onValueChange={(value) => setFormData((prev) => ({ ...prev, departmentId: value }))}>
                  <SelectTrigger id="edit-departmentId">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}{department.code ? ` (${department.code})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-qualification">Qualification</Label>
                <Input id="edit-qualification" placeholder="B.Ed Mathematics" value={formData.qualification} onChange={(e) => setFormData((prev) => ({ ...prev, qualification: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-hireDate">Hire Date</Label>
              <Input id="edit-hireDate" type="date" value={formData.hireDate} onChange={(e) => setFormData((prev) => ({ ...prev, hireDate: e.target.value }))} />
            </div>
            {renderSubjectSelect()}
            {renderClassSelection()}
            <div className="space-y-2">
              <Label>Homeroom Class</Label>
              <Select
                value={formData.homeroomClassId || NO_HOMEROOM_VALUE}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, homeroomClassId: value === NO_HOMEROOM_VALUE ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No homeroom class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_HOMEROOM_VALUE}>
                    No homeroom assignment
                  </SelectItem>
                  {homeroomOptions.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} - Grade {cls.grade}{cls.section ? ` (${cls.section})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700">Update Teacher</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the teacher
              " {selectedTeacher?.firstName} {selectedTeacher?.lastName}".
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
    </div>
  );
}
