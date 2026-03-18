import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { User, Shield, Lock, Calendar, Activity } from 'lucide-react';
import { usersApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { RoleBadge, UserStatusBadge } from '@/components/ui/Badge';
import { formatDate, getInitials } from '@/lib/utils';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, refreshProfile } = useAuth();
  const toast = useToast();
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      phone: user?.phone ?? '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<typeof user>) =>
      usersApi.update(user!.id, data as Parameters<typeof usersApi.update>[1]),
    onSuccess: async () => {
      await refreshProfile();
      toast.success('Profile updated successfully');
      setEditingProfile(false);
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      usersApi.changePassword(user!.id, data),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setEditingPassword(false);
      passwordForm.reset();
    },
    onError: () => toast.error('Failed to change password. Check your current password.'),
  });

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Profile header card */}
      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-primary-200 shrink-0">
              {getInitials(user.firstName, user.lastName)}
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-slate-900">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-slate-500 text-sm mt-0.5">{user.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 flex-wrap">
                <RoleBadge role={user.role} />
                <UserStatusBadge status={user.status} />
                {user.department && (
                  <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full">
                    {user.department.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Account info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-slate-900">Account Information</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {[
              { label: 'User ID', value: user.id, mono: true },
              { label: 'Email', value: user.email },
              { label: 'Role', value: <RoleBadge key="r" role={user.role} /> },
              { label: 'Status', value: <UserStatusBadge key="s" status={user.status} /> },
              { label: 'Department', value: user.department?.name ?? '—' },
              { label: 'Phone', value: user.phone ?? '—' },
              { label: 'Member since', value: formatDate(user.createdAt) },
              { label: 'Last login', value: formatDate(user.lastLoginAt) },
            ].map(({ label, value, mono }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
                <span className={`text-slate-900 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Edit profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary-500" />
              <h3 className="text-sm font-semibold text-slate-900">Personal Information</h3>
            </div>
            {!editingProfile && (
              <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)}>
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {editingProfile ? (
            <form
              onSubmit={profileForm.handleSubmit((d) => updateMutation.mutate(d))}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  error={profileForm.formState.errors.firstName?.message}
                  required
                  {...profileForm.register('firstName')}
                />
                <Input
                  label="Last Name"
                  error={profileForm.formState.errors.lastName?.message}
                  required
                  {...profileForm.register('lastName')}
                />
              </div>
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+250 7XX XXX XXX"
                {...profileForm.register('phone')}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingProfile(false);
                    profileForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={updateMutation.isPending}>
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">First Name</p>
                <p className="font-medium text-slate-900">{user.firstName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Last Name</p>
                <p className="font-medium text-slate-900">{user.lastName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Phone</p>
                <p className="font-medium text-slate-900">{user.phone ?? '—'}</p>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary-500" />
              <h3 className="text-sm font-semibold text-slate-900">Change Password</h3>
            </div>
            {!editingPassword && (
              <Button variant="outline" size="sm" onClick={() => setEditingPassword(true)}>
                Change Password
              </Button>
            )}
          </div>
        </CardHeader>
        {editingPassword && (
          <CardBody>
            <form
              onSubmit={passwordForm.handleSubmit((d) =>
                passwordMutation.mutate({
                  currentPassword: d.currentPassword,
                  newPassword: d.newPassword,
                })
              )}
              className="space-y-4"
            >
              <Input
                label="Current Password"
                type="password"
                error={passwordForm.formState.errors.currentPassword?.message}
                required
                {...passwordForm.register('currentPassword')}
              />
              <Input
                label="New Password"
                type="password"
                hint="Minimum 8 characters"
                error={passwordForm.formState.errors.newPassword?.message}
                required
                {...passwordForm.register('newPassword')}
              />
              <Input
                label="Confirm New Password"
                type="password"
                error={passwordForm.formState.errors.confirmPassword?.message}
                required
                {...passwordForm.register('confirmPassword')}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingPassword(false);
                    passwordForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={passwordMutation.isPending}>
                  Change Password
                </Button>
              </div>
            </form>
          </CardBody>
        )}
      </Card>

      {/* Activity info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-500" />
            <h3 className="text-sm font-semibold text-slate-900">Account Activity</h3>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Member Since</p>
                <p className="text-sm font-medium text-slate-900">{formatDate(user.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
              <Activity className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Last Active</p>
                <p className="text-sm font-medium text-slate-900">{formatDate(user.lastLoginAt)}</p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
