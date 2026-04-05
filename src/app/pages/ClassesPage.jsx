import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useData } from '../contexts/DataContext.jsx';
import { Navigate } from 'react-router';
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
  name: '',
  grade: '',
  section: '',
  academicYearId: '',
  homeroomTeacherId: '',
  maxStudents: '40',
};

export function ClassesPage() {
  const { user } = useAuth();
  const { classes, teachers, academicYears, addClass, updateClass, deleteClass } = useData();

  if (user?.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const resetForm = () => setFormData(initialFormData);

  const validateForm = () => {
    if (!formData.name || !formData.grade || !formData.academicYearId) {
      toast.error('Class name, grade, and academic year are required');
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;

    try {
      await addClass({
        name: formData.name,
        grade: formData.grade,
        section: formData.section,
        academicYearId: formData.academicYearId,
        homeroomTeacherId: formData.homeroomTeacherId || undefined,
        maxStudents: parseInt(formData.maxStudents, 10) || 40,
      });
      toast.success('Class created successfully');
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error.message || 'Failed to create class');
    }
  };

  const handleEdit = (classItem) => {
    setSelectedClass(classItem);
    setFormData({
      name: classItem.name,
      grade: classItem.grade,
      section: classItem.section || '',
      academicYearId: classItem.academicYearId || '',
      homeroomTeacherId: classItem.homeroomTeacherId || '',
      maxStudents: String(classItem.maxStudents || 40),
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedClass || !validateForm()) return;

    try {
      await updateClass(selectedClass.id, {
        name: formData.name,
        grade: formData.grade,
        section: formData.section,
        academicYearId: formData.academicYearId,
        homeroomTeacherId: formData.homeroomTeacherId || null,
        maxStudents: parseInt(formData.maxStudents, 10) || 40,
      });
      toast.success('Class updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      setSelectedClass(null);
    } catch (error) {
      toast.error(error.message || 'Failed to update class');
    }
  };

  const handleDelete = async () => {
    if (!selectedClass) return;

    try {
      await deleteClass(selectedClass.id);
      toast.success('Class deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedClass(null);
    } catch (error) {
      toast.error(error.message || 'Failed to delete class');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Management</h2>
          <p className="text-gray-600 mt-1">Create classes and assign homeroom teachers.</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Class
        </Button>
      </div>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">All Classes ({classes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Homeroom Teacher</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.length > 0 ? (
                  classes.map((classItem) => (
                    <TableRow key={classItem.id}>
                      <TableCell className="font-medium">{classItem.name}</TableCell>
                      <TableCell>{classItem.grade}{classItem.section ? ` (${classItem.section})` : ''}</TableCell>
                      <TableCell>{classItem.academicYear} {classItem.semester ? `- ${classItem.semester}` : ''}</TableCell>
                      <TableCell>{classItem.homeroomTeacherName || '-'}</TableCell>
                      <TableCell>{classItem.studentCount || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(classItem)} className="hover:bg-blue-50 hover:text-blue-600">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => { setSelectedClass(classItem); setDeleteDialogOpen(true); }}
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
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No classes created yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Class</DialogTitle>
            <DialogDescription>Create a class and assign a homeroom teacher.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Class Name *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Grade *</Label>
                <Input id="grade" value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Input id="section" value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxStudents">Max Students</Label>
                <Input id="maxStudents" type="number" value={formData.maxStudents} onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Academic Year *</Label>
              <Select value={formData.academicYearId} onValueChange={(value) => setFormData({ ...formData, academicYearId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.year} - {year.semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Homeroom Teacher</Label>
              <Select value={formData.homeroomTeacherId} onValueChange={(value) => setFormData({ ...formData, homeroomTeacherId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">Create Class</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>Update class details and homeroom assignment.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Class Name *</Label>
                <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-grade">Grade *</Label>
                <Input id="edit-grade" value={formData.grade} onChange={(e) => setFormData({ ...formData, grade: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-section">Section</Label>
                <Input id="edit-section" value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-maxStudents">Max Students</Label>
                <Input id="edit-maxStudents" type="number" value={formData.maxStudents} onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Academic Year *</Label>
              <Select value={formData.academicYearId} onValueChange={(value) => setFormData({ ...formData, academicYearId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.year} - {year.semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Homeroom Teacher</Label>
              <Select value={formData.homeroomTeacherId} onValueChange={(value) => setFormData({ ...formData, homeroomTeacherId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700">Update Class</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the class and any dependent class-subject assignments.
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
