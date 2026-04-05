import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useData } from '../contexts/DataContext.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { Textarea } from '../components/ui/textarea.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog.jsx';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select.jsx';

const initialFormData = {
  name: '',
  code: '',
  description: '',
  maxMarks: 100,
  passingMarks: 40,
  departmentId: '',
  creditHours: 3,
};

export function SubjectsPage() {
  const { subjects, departments, addSubject, updateSubject, deleteSubject } = useData();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const resetForm = () => setFormData(initialFormData);

  const validateForm = () => {
    if (!formData.name) {
      toast.error('Subject name is required');
      return false;
    }
    if (!formData.code) {
      toast.error('Subject code is required');
      return false;
    }
    if (formData.maxMarks <= 0) {
      toast.error('Max marks must be greater than 0');
      return false;
    }
    if (formData.passingMarks < 0 || formData.passingMarks > formData.maxMarks) {
      toast.error('Passing marks must be between 0 and max marks');
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (!validateForm()) return;

    const subjectData = {
      name: formData.name,
      code: formData.code,
      description: formData.description,
      maxMarks: formData.maxMarks,
      passingMarks: formData.passingMarks,
      departmentId: formData.departmentId ? parseInt(formData.departmentId) : undefined,
      creditHours: formData.creditHours,
    };

    try {
      await addSubject(subjectData);
      toast.success('Subject added successfully');
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error.message || 'Failed to add subject');
    }
  };

  const handleEdit = (subject) => {
    setSelectedSubject(subject);
    setFormData({
      name: subject.name || '',
      code: subject.code || '',
      description: subject.description || '',
      maxMarks: subject.maxMarks || 100,
      passingMarks: subject.passingMarks || 40,
      departmentId: subject.departmentId?.toString() || '',
      creditHours: subject.creditHours || 3,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedSubject) return;

    if (!formData.name) {
      toast.error('Subject name is required');
      return;
    }

    const updateData = {
      name: formData.name,
      code: formData.code,
      description: formData.description,
      maxMarks: formData.maxMarks,
      passingMarks: formData.passingMarks,
      creditHours: formData.creditHours,
      departmentId: formData.departmentId || '',
    };

    try {
      await updateSubject(selectedSubject.id, updateData);
      toast.success('Subject updated successfully');
      setIsEditDialogOpen(false);
      resetForm();
      setSelectedSubject(null);
    } catch (error) {
      toast.error(error.message || 'Failed to update subject');
    }
  };

  const handleDeleteClick = (subject) => {
    setSelectedSubject(subject);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedSubject) return;

    try {
      await deleteSubject(selectedSubject.id);
      toast.success('Subject deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedSubject(null);
    } catch (error) {
      toast.error(error.message || 'Failed to delete subject');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Subject Management</h2>
          <p className="text-gray-600 mt-1">Manage subjects and course information</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Subject
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject) => (
          <Card key={subject.id} className="border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle className="text-lg">{subject.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {subject.code}
                  </Badge>
                  <span className="text-sm text-gray-500">Max: {subject.maxMarks}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(subject)}
                  className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteClick(subject)}
                  className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {subject.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{subject.description}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Passing Marks:</span>
                  <span className="font-medium">{subject.passingMarks}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Credit Hours:</span>
                  <span className="font-medium">{subject.creditHours}</span>
                </div>
                {subject.departmentId && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Department:</span>
                    <span className="font-medium">{subject.departmentName || subject.departmentId}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="text-gray-600">Subject ID:</span>
                  <span className="font-mono text-gray-900">{subject.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {subjects.length === 0 && (
          <div className="col-span-full">
            <Card className="border-gray-200 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500 mb-4">No subjects added yet</p>
                <Button onClick={() => setIsAddDialogOpen(true)} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Subject
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
            <DialogDescription>Enter the subject information below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Subject Name *</Label>
              <Input id="name" placeholder="e.g., Mathematics" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Subject Code *</Label>
              <Input id="code" placeholder="e.g., MATH101" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Enter subject description..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxMarks">Maximum Marks</Label>
                <Input id="maxMarks" type="number" min="1" value={formData.maxMarks} onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value) || 100 })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passingMarks">Passing Marks</Label>
                <Input id="passingMarks" type="number" min="0" value={formData.passingMarks} onChange={(e) => setFormData({ ...formData, passingMarks: parseInt(e.target.value) || 40 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departmentId">Department</Label>
                <Select value={formData.departmentId || 'none'} onValueChange={(value) => setFormData({ ...formData, departmentId: value === 'none' ? '' : value })}>
                  <SelectTrigger id="departmentId">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No department</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}{department.code ? ` (${department.code})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditHours">Credit Hours</Label>
                <Input id="creditHours" type="number" min="1" value={formData.creditHours} onChange={(e) => setFormData({ ...formData, creditHours: parseInt(e.target.value) || 3 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">Add Subject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>Update the subject information below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Subject Name</Label>
              <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code">Subject Code</Label>
              <Input id="edit-code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-maxMarks">Maximum Marks</Label>
                <Input id="edit-maxMarks" type="number" min="1" value={formData.maxMarks} onChange={(e) => setFormData({ ...formData, maxMarks: parseInt(e.target.value) || 100 })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-passingMarks">Passing Marks</Label>
                <Input id="edit-passingMarks" type="number" min="0" value={formData.passingMarks} onChange={(e) => setFormData({ ...formData, passingMarks: parseInt(e.target.value) || 40 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-departmentId">Department</Label>
                <Select value={formData.departmentId || 'none'} onValueChange={(value) => setFormData({ ...formData, departmentId: value === 'none' ? '' : value })}>
                  <SelectTrigger id="edit-departmentId">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No department</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}{department.code ? ` (${department.code})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-creditHours">Credit Hours</Label>
                <Input id="edit-creditHours" type="number" min="1" value={formData.creditHours} onChange={(e) => setFormData({ ...formData, creditHours: parseInt(e.target.value) || 3 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700">Update Subject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the subject
              "{selectedSubject?.name}" and all associated marks.
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
