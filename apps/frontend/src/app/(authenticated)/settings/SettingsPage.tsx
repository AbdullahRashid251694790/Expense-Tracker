/**
 * Settings Page
 * User profile and app settings with full functionality
 * Updated for Android/Capacitor compatibility
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Palette, Shield, LogOut, Check, Database } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/context/AuthContext';
import { useTheme } from '@/lib/context/ThemeContext';
import { useCurrency, type CurrencyCode } from '@/lib/context/CurrencyContext';
import { getApiUrl, ApiError } from '@/lib/api/client';
import { authRepository } from '@/lib/api/repositories';
import { Storage } from '@/lib/storage/storage';
import { BentoCard, Button, Avatar, Select, ConfirmDialog } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { cn } from '@/lib/utils/cn';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
];

// Storage keys for settings
const STORAGE_KEYS = {
  BUDGET_ALERTS: 'casha:notifications:budgetAlerts',
  WEEKLY_SUMMARY: 'casha:notifications:weeklySummary',
  AI_INSIGHTS: 'casha:notifications:aiInsights',
  RECURRING_REMINDERS: 'casha:notifications:recurringReminders',
};

const API_URL = getApiUrl();

export function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const { user, logout, refreshUser, getAccessToken } = useAuth();
  const { theme, setTheme, effectiveTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();

  // Profile state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  // Seed data state
  const [isSeeding, setIsSeeding] = useState(false);

  // Delete account state
  const [isDeleting, setIsDeleting] = useState(false);

  // Photo upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Confirm dialog states
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(0); // 0 = closed, 1 = first confirm, 2 = final confirm
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);

  // Update profile name when user changes
  useEffect(() => {
    if (user?.name) {
      setProfileName(user.name);
    }
  }, [user?.name]);

  // Handle profile save
  const handleProfileSave = async () => {
    if (!profileName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    try {
      setIsProfileSaving(true);
      const token = getAccessToken();
      if (!token) {
        toast.error('Not authenticated');
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: profileName.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }

      await refreshUser();
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsProfileSaving(false);
    }
  };

  // Handle photo upload - converts to base64 and stores via API
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a JPG, PNG, or GIF image');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const token = getAccessToken();
    if (!token) {
      toast.error('Not authenticated');
      return;
    }

    try {
      setIsUploadingPhoto(true);

      // Convert file to base64
      const photoURL = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Update via API
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ photoURL }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      await refreshUser();
      toast.success('Profile photo updated successfully');
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle currency change
  const handleCurrencyChange = async (value: string) => {
    try {
      await setCurrency(value as CurrencyCode);
      toast.success(`Currency changed to ${value}`);
    } catch {
      toast.error('Failed to change currency');
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    // Validate password strength (same as signup)
    if (!/[A-Z]/.test(newPassword)) {
      toast.error('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      toast.error('Password must contain at least one lowercase letter');
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      toast.error('Password must contain at least one number');
      return;
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      toast.error('Password must contain at least one special character');
      return;
    }

    const token = getAccessToken();
    if (!token) {
      toast.error('Not authenticated');
      return;
    }

    try {
      setIsPasswordSaving(true);

      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new ApiError(error.message || 'Failed to change password', response.status);
      }

      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to change password');
      }
    } finally {
      setIsPasswordSaving(false);
    }
  };

  // Handle account deletion - step 1
  const handleDeleteAccountClick = () => {
    setDeleteConfirmStep(1);
  };

  // Handle account deletion - confirmed
  const handleDeleteAccountConfirm = async () => {
    if (deleteConfirmStep === 1) {
      // Move to final confirmation
      setDeleteConfirmStep(2);
      return;
    }

    // Final deletion
    try {
      setIsDeleting(true);
      await authRepository.deleteAccount();
      toast.success('Account deleted successfully');
      setDeleteConfirmStep(0);
      // Logout will redirect to login page
      await logout();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  // Handle seed mock data
  const handleSeedDataClick = () => {
    setShowSeedConfirm(true);
  };

  const handleSeedDataConfirm = async () => {
    const token = getAccessToken();
    if (!token) {
      toast.error('Not authenticated');
      setShowSeedConfirm(false);
      return;
    }

    try {
      setIsSeeding(true);

      const response = await fetch(`${API_URL}/api/seed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to seed data');
      }

      const result = await response.json();
      toast.success(`Demo data created! Added ${result.data.expenses} expenses.`);
      setShowSeedConfirm(false);

      // Navigate to dashboard to see new data (instead of window.location.reload)
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create demo data');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-up">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
        <p className="text-text-secondary mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <BentoCard className="lg:col-span-1 p-2">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-bento-sm',
                    'transition-colors duration-200 text-left',
                    isActive
                      ? 'bg-casha-primary/10 text-casha-primary'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}

            <hr className="my-2 border-border" />

            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-bento-sm text-error hover:bg-error/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </nav>
        </BentoCard>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <BentoCard header="Profile Information">
              <div className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center gap-4">
                  <Avatar
                    src={user?.photoURL || undefined}
                    name={user?.name || user?.email}
                    size="xl"
                  />
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      isLoading={isUploadingPhoto}
                      disabled={isUploadingPhoto}
                    >
                      Change Photo
                    </Button>
                    <p className="text-xs text-text-muted mt-1">
                      JPG, PNG or GIF. Max 5MB.
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Full Name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Enter your name"
                  />
                  <FormField
                    label="Email"
                    type="email"
                    value={user?.email || ''}
                    placeholder="Enter your email"
                    disabled
                    hint="Email cannot be changed"
                  />
                </div>

                <div className="pt-4 border-t border-border">
                  <Button
                    onClick={handleProfileSave}
                    isLoading={isProfileSaving}
                    disabled={profileName === user?.name}
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </BentoCard>
          )}

          {activeTab === 'notifications' && (
            <BentoCard header="Notification Preferences">
              <div className="space-y-4">
                <NotificationToggle
                  title="Budget Alerts"
                  description="Get notified when you're approaching budget limits"
                  storageKey={STORAGE_KEYS.BUDGET_ALERTS}
                  defaultChecked
                />
                <NotificationToggle
                  title="Weekly Summary"
                  description="Receive a weekly spending summary email"
                  storageKey={STORAGE_KEYS.WEEKLY_SUMMARY}
                  defaultChecked
                />
                <NotificationToggle
                  title="AI Insights"
                  description="Get notified about new spending insights"
                  storageKey={STORAGE_KEYS.AI_INSIGHTS}
                  defaultChecked={false}
                />
                <NotificationToggle
                  title="Recurring Reminders"
                  description="Remind me about upcoming recurring expenses"
                  storageKey={STORAGE_KEYS.RECURRING_REMINDERS}
                  defaultChecked
                />
              </div>
            </BentoCard>
          )}

          {activeTab === 'appearance' && (
            <BentoCard header="Appearance">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-text-primary mb-3">Theme</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <ThemeOption
                      label="Light"
                      active={theme === 'light'}
                      onClick={() => setTheme('light')}
                    />
                    <ThemeOption
                      label="Dark"
                      active={theme === 'dark'}
                      onClick={() => setTheme('dark')}
                    />
                    <ThemeOption
                      label="System"
                      active={theme === 'system'}
                      onClick={() => setTheme('system')}
                    />
                  </div>
                  <p className="text-sm text-text-muted mt-2">
                    {theme === 'system'
                      ? `Following system preference (${effectiveTheme})`
                      : `Currently using ${theme} theme`}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-text-primary mb-3">Currency</h3>
                  <Select
                    className="w-full md:w-48"
                    value={currency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    options={[
                      { value: 'USD', label: 'USD ($)' },
                      { value: 'EUR', label: 'EUR (€)' },
                      { value: 'GBP', label: 'GBP (£)' },
                      { value: 'INR', label: 'INR (₹)' },
                      { value: 'JPY', label: 'JPY (¥)' },
                      { value: 'CAD', label: 'CAD ($)' },
                      { value: 'AUD', label: 'AUD ($)' },
                    ]}
                  />
                </div>
              </div>
            </BentoCard>
          )}

          {activeTab === 'security' && (
            <BentoCard header="Security">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-text-primary mb-3">
                    Change Password
                  </h3>
                  <div className="space-y-4 max-w-md">
                    <FormField
                      label="Current Password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <FormField
                      label="New Password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <FormField
                      label="Confirm New Password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                    <Button
                      onClick={handlePasswordChange}
                      isLoading={isPasswordSaving}
                    >
                      Update Password
                    </Button>
                  </div>
                </div>

                <hr className="border-border" />

                <div>
                  <h3 className="font-medium text-text-primary mb-2">Developer Tools</h3>
                  <p className="text-sm text-text-secondary mb-4">
                    Seed your account with demo data for testing.
                  </p>
                  <Button
                    variant="secondary"
                    leftIcon={<Database className="h-4 w-4" />}
                    onClick={handleSeedDataClick}
                    isLoading={isSeeding}
                  >
                    Load Demo Data
                  </Button>
                </div>

                <hr className="border-border" />

                <div>
                  <h3 className="font-medium text-error mb-2">Danger Zone</h3>
                  <p className="text-sm text-text-secondary mb-4">
                    Once you delete your account, there is no going back. All your expenses, budgets, categories, and other data will be permanently deleted.
                  </p>
                  <Button
                    variant="danger"
                    onClick={handleDeleteAccountClick}
                    isLoading={isDeleting}
                    disabled={isDeleting}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </BentoCard>
          )}
        </div>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={deleteConfirmStep === 1}
        onClose={() => setDeleteConfirmStep(0)}
        onConfirm={handleDeleteAccountConfirm}
        title="Delete Account?"
        message="Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently deleted."
        confirmLabel="Continue"
        cancelLabel="Cancel"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={deleteConfirmStep === 2}
        onClose={() => setDeleteConfirmStep(0)}
        onConfirm={handleDeleteAccountConfirm}
        title="Final Warning"
        message="This is your final warning. Are you absolutely sure? There is no way to recover your account after deletion."
        confirmLabel="Delete Forever"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      <ConfirmDialog
        isOpen={showSeedConfirm}
        onClose={() => setShowSeedConfirm(false)}
        onConfirm={handleSeedDataConfirm}
        title="Load Demo Data?"
        message="This will add demo data to your account (expenses, budgets, income). Continue?"
        confirmLabel="Load Data"
        cancelLabel="Cancel"
        variant="warning"
        isLoading={isSeeding}
      />
    </div>
  );
}

// Helper Components
function NotificationToggle({
  title,
  description,
  storageKey,
  defaultChecked,
}: {
  title: string;
  description: string;
  storageKey: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked ?? false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial value from storage
  useEffect(() => {
    const loadValue = async () => {
      const stored = Storage.getItemSync(storageKey);
      if (stored !== null) {
        setChecked(stored === 'true');
      }
      setIsLoaded(true);
    };
    loadValue();
  }, [storageKey]);

  const handleToggle = useCallback(() => {
    const newValue = !checked;
    setChecked(newValue);
    Storage.setItemSync(storageKey, String(newValue));
    toast.success(`${title} ${newValue ? 'enabled' : 'disabled'}`);
  }, [checked, storageKey, title]);

  if (!isLoaded) return null;

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="font-medium text-text-primary">{title}</p>
        <p className="text-sm text-text-muted">{description}</p>
      </div>
      <button
        onClick={handleToggle}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors duration-200',
          checked ? 'bg-casha-primary' : 'bg-border'
        )}
      >
        <span
          className={cn(
            'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm',
            checked && 'translate-x-5'
          )}
        />
      </button>
    </div>
  );
}

function ThemeOption({
  label,
  active,
  onClick
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative p-4 rounded-bento-sm border-2 transition-all',
        active
          ? 'border-casha-primary bg-casha-primary/5'
          : 'border-border hover:border-border-hover'
      )}
    >
      <span className="font-medium text-text-primary">{label}</span>
      {active && (
        <Check className="absolute top-2 right-2 h-4 w-4 text-casha-primary" />
      )}
    </button>
  );
}
