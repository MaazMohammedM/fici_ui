import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, Lock, Eye, EyeOff, Save, Edit3 } from 'lucide-react';
import { useAuthStore } from '@store/authStore';
import { supabase } from '@lib/supabase';
import { Input, Button } from '../../auth/ui';

const ProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional()
});

const PasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type ProfileFormData = z.infer<typeof ProfileSchema>;
type PasswordFormData = z.infer<typeof PasswordSchema>;

const ProfilePage: React.FC = () => {
  const { user, setFirstName } = useAuthStore();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    }
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(PasswordSchema)
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        setUserProfile(data);
        profileForm.reset({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || user.email || '',
          phone: data.phone || ''
        });
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user, profileForm]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setIsSubmittingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      // Update user profile in database
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          phone: data.phone || null
        })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Update auth user email if changed
      if (data.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: data.email
        });

        if (emailError) throw emailError;
      }

      // Update local state
      setFirstName(data.firstName);
      setUserProfile((prev: any) => ({
        ...prev,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone
      }));

      setProfileSuccess('Profile updated successfully!');
      setIsEditingProfile(false);
    } catch (error: any) {
      setProfileError(error.message || 'Failed to update profile');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsSubmittingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: data.currentPassword
      });

      if (signInError) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword
      });

      if (updateError) throw updateError;

      setPasswordSuccess('Password updated successfully!');
      setIsEditingPassword(false);
      passwordForm.reset();
    } catch (error: any) {
      setPasswordError(error.message || 'Failed to update password');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Please sign in to view your profile
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
              My Profile
            </h1>

            {/* Profile Information Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Profile Information
                </h2>
                {!isEditingProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingProfile(true)}
                    leftIcon={Edit3}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>

              {profileSuccess && (
                <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-700 dark:text-green-300">{profileSuccess}</p>
                </div>
              )}

              {profileError && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-700 dark:text-red-300">{profileError}</p>
                </div>
              )}

              {isEditingProfile ? (
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      placeholder="Enter your first name"
                      leftIcon={User}
                      error={profileForm.formState.errors.firstName?.message}
                      {...profileForm.register('firstName')}
                      required
                    />

                    <Input
                      label="Last Name"
                      placeholder="Enter your last name"
                      leftIcon={User}
                      error={profileForm.formState.errors.lastName?.message}
                      {...profileForm.register('lastName')}
                      required
                    />
                  </div>

                  <Input
                    type="email"
                    label="Email Address"
                    placeholder="Enter your email address"
                    leftIcon={Mail}
                    error={profileForm.formState.errors.email?.message}
                    {...profileForm.register('email')}
                    required
                  />

                  <Input
                    type="tel"
                    label="Phone Number (Optional)"
                    placeholder="Enter your phone number"
                    leftIcon={Phone}
                    error={profileForm.formState.errors.phone?.message}
                    {...profileForm.register('phone')}
                  />

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      loading={isSubmittingProfile}
                      leftIcon={Save}
                    >
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditingProfile(false);
                        setProfileError(null);
                        setProfileSuccess(null);
                        profileForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        First Name
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {userProfile?.first_name || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Last Name
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {userProfile?.last_name || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {userProfile?.email || user.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {userProfile?.phone || 'Not provided'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Password Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Password & Security
                </h2>
                {!isEditingPassword && (
                    <Button
  variant="outline"
  size="sm"
  onClick={() => setIsEditingPassword(true)}
  leftIcon={Lock}   // ✅ Pass the component
>
                    Change Password
                  </Button>
                )}
              </div>

              {passwordSuccess && (
                <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-700 dark:text-green-300">{passwordSuccess}</p>
                </div>
              )}

              {passwordError && (
                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-700 dark:text-red-300">{passwordError}</p>
                </div>
              )}

              {isEditingPassword ? (
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      label="Current Password"
                      placeholder="Enter your current password"
                      leftIcon={Lock}
                      error={passwordForm.formState.errors.currentPassword?.message}
                      {...passwordForm.register('currentPassword')}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      label="New Password"
                      placeholder="Enter your new password"
                      leftIcon={Lock}
                      error={passwordForm.formState.errors.newPassword?.message}
                      {...passwordForm.register('newPassword')}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      label="Confirm New Password"
                      placeholder="Confirm your new password"
                      leftIcon={Lock}
                      error={passwordForm.formState.errors.confirmPassword?.message}
                      {...passwordForm.register('confirmPassword')}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                      Password Requirements:
                    </h3>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• At least 8 characters long</li>
                      <li>• Contains at least one uppercase letter</li>
                      <li>• Contains at least one lowercase letter</li>
                      <li>• Contains at least one number</li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      loading={isSubmittingPassword}
                      leftIcon={Save}
                    >
                      Update Password
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditingPassword(false);
                        setPasswordError(null);
                        setPasswordSuccess(null);
                        passwordForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Password
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      ••••••••••••
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Last updated: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
