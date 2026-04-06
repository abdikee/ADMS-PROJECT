import React, { useEffect, useMemo, useState } from 'react';
import { Camera, KeyRound, Mail, Phone, Save, Shield, UserCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../services/api.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { Textarea } from '../components/ui/textarea.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Separator } from '../components/ui/separator.jsx';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select.jsx';
import { toast } from '../components/ui/sonner.jsx';

const emptyProfileForm = {
  name: '', email: '', phone: '', profilePhoto: '',
  firstName: '', lastName: '', dateOfBirth: '', qualification: '',
  address: '', emergencyContact: '', emergencyPhone: '',
  gender: '', bloodGroup: '', parentGuardianName: '',
  parentGuardianPhone: '', parentGuardianEmail: '',
};

const emptyPasswordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState(emptyProfileForm);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await api.getMyProfile();
        setProfile(data);
        setFormData({
          name: data.name || '', email: data.email || '', phone: data.phone || '',
          profilePhoto: data.profilePhoto || '', firstName: data.firstName || '',
          lastName: data.lastName || '',
          dateOfBirth: data.dateOfBirth ? String(data.dateOfBirth).slice(0, 10) : '',
          qualification: data.qualification || '', address: data.address || '',
          emergencyContact: data.emergencyContact || '', emergencyPhone: data.emergencyPhone || '',
          gender: data.gender || '', bloodGroup: data.bloodGroup || '',
          parentGuardianName: data.parentGuardianName || '',
          parentGuardianPhone: data.parentGuardianPhone || '',
          parentGuardianEmail: data.parentGuardianEmail || '',
        });
      } catch (error) {
        toast.error(error.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    void loadProfile();
  }, []);

  const initials = useMemo(() => {
    const source = profile?.name || user?.name || 'User';
    return source.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  }, [profile?.name, user?.name]);

  const handleProfileSave = async () => {
    if (!profile) return;

    const payload = profile.profileType === 'admin'
      ? { name: formData.name, email: formData.email, phone: formData.phone, profilePhoto: formData.profilePhoto }
      : profile.profileType === 'teacher'
        ? {
            firstName: formData.firstName, lastName: formData.lastName, email: formData.email,
            phone: formData.phone, dateOfBirth: formData.dateOfBirth || null,
            qualification: formData.qualification, address: formData.address,
            emergencyContact: formData.emergencyContact, emergencyPhone: formData.emergencyPhone,
            profilePhoto: formData.profilePhoto,
          }
        : {
            firstName: formData.firstName, lastName: formData.lastName, email: formData.email,
            phone: formData.phone, dateOfBirth: formData.dateOfBirth || null,
            gender: formData.gender || null, bloodGroup: formData.bloodGroup,
            address: formData.address, parentGuardianName: formData.parentGuardianName,
            parentGuardianPhone: formData.parentGuardianPhone,
            parentGuardianEmail: formData.parentGuardianEmail,
            emergencyContact: formData.emergencyContact, emergencyPhone: formData.emergencyPhone,
            profilePhoto: formData.profilePhoto,
          };

    try {
      setSavingProfile(true);
      const response = await api.updateMyProfile(payload);
      setProfile(response.profile);
      setFormData({
        name: response.profile.name || '', email: response.profile.email || '',
        phone: response.profile.phone || '', profilePhoto: response.profile.profilePhoto || '',
        firstName: response.profile.firstName || '', lastName: response.profile.lastName || '',
        dateOfBirth: response.profile.dateOfBirth ? String(response.profile.dateOfBirth).slice(0, 10) : '',
        qualification: response.profile.qualification || '', address: response.profile.address || '',
        emergencyContact: response.profile.emergencyContact || '',
        emergencyPhone: response.profile.emergencyPhone || '',
        gender: response.profile.gender || '', bloodGroup: response.profile.bloodGroup || '',
        parentGuardianName: response.profile.parentGuardianName || '',
        parentGuardianPhone: response.profile.parentGuardianPhone || '',
        parentGuardianEmail: response.profile.parentGuardianEmail || '',
      });
      updateUser({ name: response.profile.name, email: response.profile.email, profilePhoto: response.profile.profilePhoto });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingPhoto(true);
      const result = await api.uploadProfilePhoto(file);
      // Refresh profile to get updated photo URL
      const updated = await api.getMyProfile();
      setProfile(updated);
      setFormData((prev) => ({ ...prev, profilePhoto: updated.profilePhoto || '' }));
      updateUser({ profilePhoto: updated.profilePhoto });
      toast.success('Profile photo updated');
    } catch (error) {
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handlePasswordSave = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Fill in all password fields');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    try {
      setSavingPassword(true);
      await api.changeMyPassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setPasswordForm(emptyPasswordForm);
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="space-y-6">
        <div className="h-44 rounded-2xl border border-gray-200 bg-white animate-pulse" />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="h-96 rounded-2xl border border-gray-200 bg-white animate-pulse" />
          <div className="h-96 rounded-2xl border border-gray-200 bg-white animate-pulse" />
        </div>
      </div>
    );
  }

  const isTeacher = profile.profileType === 'teacher';
  const isStudent = profile.profileType === 'student';

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-gray-200">
        <div className="bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#93c5fd)] px-6 py-8 text-white">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="size-24 border-4 border-white/30 shadow-lg">
                <AvatarImage src={profile.profilePhoto || user?.profilePhoto} alt={profile.name} />
                <AvatarFallback className="bg-white/20 text-2xl font-semibold text-white">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-blue-100">Professional Profile</p>
                <h2 className="mt-2 text-3xl font-bold">{profile.name}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className="border-0 bg-white/15 text-white hover:bg-white/15">{user?.role}</Badge>
                  <Badge className="border-0 bg-white/15 text-white hover:bg-white/15">@{profile.username}</Badge>
                  {isTeacher && profile.subjectName && (
                    <Badge className="border-0 bg-white/15 text-white hover:bg-white/15">{profile.subjectName}</Badge>
                  )}
                  {isStudent && profile.className && (
                    <Badge className="border-0 bg-white/15 text-white hover:bg-white/15">{profile.className}</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="grid gap-3 text-sm md:text-right">
              <div>
                <p className="text-blue-100">Last Sign In</p>
                <p className="font-medium">{formatDate(profile.lastLogin)}</p>
              </div>
              <div>
                <p className="text-blue-100">Account Created</p>
                <p className="font-medium">{formatDate(profile.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
        <CardContent className="grid gap-4 p-6 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600"><Mail className="size-4" />Email</div>
            <p className="mt-2 text-base font-semibold text-gray-900">{profile.email || '-'}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600"><Phone className="size-4" />Phone</div>
            <p className="mt-2 text-base font-semibold text-gray-900">{profile.phone || '-'}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600"><UserCircle2 className="size-4" />Username</div>
            <p className="mt-2 text-base font-semibold text-gray-900">@{profile.username}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="w-full justify-start overflow-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="edit">Edit Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="border-gray-200">
              <CardHeader><CardTitle className="text-lg font-semibold">Profile Summary</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div><p className="text-sm text-gray-500">Full Name</p><p className="mt-1 font-medium text-gray-900">{profile.name}</p></div>
                  <div><p className="text-sm text-gray-500">Role</p><p className="mt-1 font-medium text-gray-900">{user?.role}</p></div>
                  <div><p className="text-sm text-gray-500">Email</p><p className="mt-1 font-medium text-gray-900">{profile.email || '-'}</p></div>
                  <div><p className="text-sm text-gray-500">Phone</p><p className="mt-1 font-medium text-gray-900">{profile.phone || '-'}</p></div>
                </div>
                <Separator />
                {profile.profileType === 'admin' && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Administrator Access</h3>
                    <p className="text-sm text-gray-600">Your profile controls account identity and security for system administration.</p>
                  </div>
                )}
                {isTeacher && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Teaching Details</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div><p className="text-sm text-gray-500">Department</p><p className="mt-1 font-medium text-gray-900">{profile.departmentName || '-'}</p></div>
                      <div><p className="text-sm text-gray-500">Subject</p><p className="mt-1 font-medium text-gray-900">{profile.subjectName || '-'}</p></div>
                      <div><p className="text-sm text-gray-500">Qualification</p><p className="mt-1 font-medium text-gray-900">{profile.qualification || '-'}</p></div>
                      <div><p className="text-sm text-gray-500">Hire Date</p><p className="mt-1 font-medium text-gray-900">{formatDate(profile.hireDate)}</p></div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Teaching Classes</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(profile.assignedClasses || []).length > 0 ? (
                          profile.assignedClasses?.map((className) => (
                            <Badge key={className} variant="outline" className="bg-gray-50">{className}</Badge>
                          ))
                        ) : <p className="font-medium text-gray-900">-</p>}
                      </div>
                    </div>
                    <div><p className="text-sm text-gray-500">Homeroom Class</p><p className="mt-1 font-medium text-gray-900">{profile.homeroomClassName || '-'}</p></div>
                  </div>
                )}
                {isStudent && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Academic Details</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div><p className="text-sm text-gray-500">Class</p><p className="mt-1 font-medium text-gray-900">{profile.className || '-'}</p></div>
                      <div><p className="text-sm text-gray-500">Grade</p><p className="mt-1 font-medium text-gray-900">{profile.grade || '-'}</p></div>
                      <div><p className="text-sm text-gray-500">Roll Number</p><p className="mt-1 font-medium text-gray-900">{profile.rollNumber || '-'}</p></div>
                      <div><p className="text-sm text-gray-500">Admission Number</p><p className="mt-1 font-medium text-gray-900">{profile.admissionNumber || '-'}</p></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader><CardTitle className="text-lg font-semibold">Personal And Emergency Info</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><p className="text-sm text-gray-500">Date of Birth</p><p className="mt-1 font-medium text-gray-900">{formatDate(profile.dateOfBirth)}</p></div>
                {isStudent && (
                  <>
                    <div><p className="text-sm text-gray-500">Gender</p><p className="mt-1 font-medium text-gray-900">{profile.gender || '-'}</p></div>
                    <div><p className="text-sm text-gray-500">Blood Group</p><p className="mt-1 font-medium text-gray-900">{profile.bloodGroup || '-'}</p></div>
                  </>
                )}
                <div><p className="text-sm text-gray-500">Address</p><p className="mt-1 font-medium text-gray-900 whitespace-pre-wrap">{profile.address || '-'}</p></div>
                <Separator />
                <div><p className="text-sm text-gray-500">Emergency Contact</p><p className="mt-1 font-medium text-gray-900">{profile.emergencyContact || '-'}</p></div>
                <div><p className="text-sm text-gray-500">Emergency Phone</p><p className="mt-1 font-medium text-gray-900">{profile.emergencyPhone || '-'}</p></div>
                {isStudent && (
                  <>
                    <Separator />
                    <div><p className="text-sm text-gray-500">Parent / Guardian</p><p className="mt-1 font-medium text-gray-900">{profile.parentGuardianName || '-'}</p></div>
                    <div><p className="text-sm text-gray-500">Guardian Phone</p><p className="mt-1 font-medium text-gray-900">{profile.parentGuardianPhone || '-'}</p></div>
                    <div><p className="text-sm text-gray-500">Guardian Email</p><p className="mt-1 font-medium text-gray-900">{profile.parentGuardianEmail || '-'}</p></div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="edit">
          <Card className="border-gray-200">
            <CardHeader><CardTitle className="text-lg font-semibold">Edit Profile</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
                <div className="space-y-4 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                  <div className="flex items-center gap-3">
                    <Camera className="size-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Profile Photo</p>
                      <p className="text-sm text-gray-500">Paste an image URL to update your profile photo.</p>
                    </div>
                  </div>
                  <Avatar className="size-28 border border-gray-200 shadow-sm">
                    <AvatarImage src={formData.profilePhoto || profile.profilePhoto || user?.profilePhoto} alt={profile.name} />
                    <AvatarFallback className="bg-blue-50 text-xl font-semibold text-blue-700">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Label>Upload Photo</Label>
                    <label htmlFor="photoUpload" className="cursor-pointer">
                      <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <Camera className="size-4 text-blue-600" />
                        {uploadingPhoto ? 'Uploading...' : 'Choose image file'}
                      </div>
                      <input
                        id="photoUpload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhoto}
                      />
                    </label>
                    <p className="text-xs text-gray-500">JPEG, PNG or WebP · max 5 MB</p>
                  </div>
                </div>

                <div className="space-y-5">
                  {profile.profileType === 'admin' ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" value={formData.firstName} onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" value={formData.lastName} onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input id="phone" value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dateOfBirth">Date of Birth</Label>
                          <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(e) => setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))} />
                        </div>
                        {isTeacher && (
                          <div className="space-y-2">
                            <Label htmlFor="qualification">Qualification</Label>
                            <Input id="qualification" value={formData.qualification} onChange={(e) => setFormData((prev) => ({ ...prev, qualification: e.target.value }))} />
                          </div>
                        )}
                        {isStudent && (
                          <>
                            <div className="space-y-2">
                              <Label>Gender</Label>
                              <Select value={formData.gender || 'unspecified'} onValueChange={(value) => setFormData((prev) => ({ ...prev, gender: value === 'unspecified' ? '' : value }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="unspecified">Select gender</SelectItem>
                                  <SelectItem value="Male">Male</SelectItem>
                                  <SelectItem value="Female">Female</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="bloodGroup">Blood Group</Label>
                              <Input id="bloodGroup" value={formData.bloodGroup} onChange={(e) => setFormData((prev) => ({ ...prev, bloodGroup: e.target.value }))} />
                            </div>
                          </>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea id="address" value={formData.address} onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))} />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="emergencyContact">Emergency Contact</Label>
                          <Input id="emergencyContact" value={formData.emergencyContact} onChange={(e) => setFormData((prev) => ({ ...prev, emergencyContact: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                          <Input id="emergencyPhone" value={formData.emergencyPhone} onChange={(e) => setFormData((prev) => ({ ...prev, emergencyPhone: e.target.value }))} />
                        </div>
                      </div>
                      {isStudent && (
                        <>
                          <Separator />
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="parentGuardianName">Parent / Guardian Name</Label>
                              <Input id="parentGuardianName" value={formData.parentGuardianName} onChange={(e) => setFormData((prev) => ({ ...prev, parentGuardianName: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="parentGuardianPhone">Guardian Phone</Label>
                              <Input id="parentGuardianPhone" value={formData.parentGuardianPhone} onChange={(e) => setFormData((prev) => ({ ...prev, parentGuardianPhone: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="parentGuardianEmail">Guardian Email</Label>
                              <Input id="parentGuardianEmail" type="email" value={formData.parentGuardianEmail} onChange={(e) => setFormData((prev) => ({ ...prev, parentGuardianEmail: e.target.value }))} />
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                  <div className="flex justify-end">
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleProfileSave} disabled={savingProfile}>
                      <Save className="mr-2 size-4" />
                      {savingProfile ? 'Saving...' : 'Save Profile'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="border-gray-200">
              <CardHeader><CardTitle className="text-lg font-semibold">Security Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <Shield className="mt-0.5 size-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Account Protection</p>
                    <p className="mt-1 text-sm text-blue-800">
                      Use a unique password with at least 8 characters. Change it regularly if this is a shared environment.
                    </p>
                  </div>
                </div>
                <div><p className="text-sm text-gray-500">Username</p><p className="mt-1 font-medium text-gray-900">@{profile.username}</p></div>
                <div><p className="text-sm text-gray-500">Last Sign In</p><p className="mt-1 font-medium text-gray-900">{formatDate(profile.lastLogin)}</p></div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader><CardTitle className="text-lg font-semibold">Change Password</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))} />
                </div>
                <div className="flex justify-end">
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handlePasswordSave} disabled={savingPassword}>
                    <KeyRound className="mr-2 size-4" />
                    {savingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
