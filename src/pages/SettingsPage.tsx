import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Archive, Bell, Save } from 'lucide-react';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/FormFields';
import PageHelpButton from '../components/ui/PageHelpButton';
import { SETTINGS_HELP } from '../lib/helpContent';
import { useAuthStore } from '../stores/authStore';
import { fetchSystemSettings, upsertSystemSettings } from '../lib/supabaseService';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'vmmc_settings';

interface SettingsData {
  bufferTime: string;
  downloadRetention: string;
  archiveRetention: string;
  purgeWarningHours: string;
  autoArchive: boolean;
  notifications: Record<string, boolean>;
}

const DEFAULT_SETTINGS: SettingsData = {
  bufferTime: '30',
  downloadRetention: '7',
  archiveRetention: '30',
  purgeWarningHours: '48',
  autoArchive: true,
  notifications: {},
};

const NOTIFICATION_ITEMS = [
  'Booking confirmation',
  'Approval/denial with reason',
  'Schedule changes or cancellations',
  '24-hour reminder to requesting department',
  '2-hour reminder to requesting department',
  'Emergency case preemption alerts',
  'New booking request (Anesthesia)',
  'Case nearing estimated end time',
];

function loadSettingsFromLocal(): SettingsData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<SettingsData>(loadSettingsFromLocal);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Track original state for dirty detection
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(loadSettingsFromLocal()));

  // Load from Supabase on mount, fallback to localStorage
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const remote = await fetchSystemSettings();
        if (!cancelled && remote) {
          const merged = { ...DEFAULT_SETTINGS, ...(remote as unknown as Partial<SettingsData>) };
          setSettings(merged);
          setSavedSnapshot(JSON.stringify(merged));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
      } catch {
        // fallback to localStorage — already loaded
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setIsDirty(JSON.stringify(settings) !== savedSnapshot);
  }, [settings, savedSnapshot]);

  const update = <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleNotification = (item: string) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [item]: !(prev.notifications[item] ?? true) },
    }));
  };

  const isNotifEnabled = (item: string) => settings.notifications[item] ?? true;

  const validate = (): string | null => {
    const buf = parseInt(settings.bufferTime, 10);
    if (isNaN(buf) || buf < 0 || buf > 120) return 'Buffer time must be between 0 and 120 minutes.';
    const dl = parseInt(settings.downloadRetention, 10);
    if (isNaN(dl) || dl < 1 || dl > 90) return 'Download window must be between 1 and 90 days.';
    const ar = parseInt(settings.archiveRetention, 10);
    if (isNaN(ar) || ar < 7 || ar > 365) return 'Archive retention must be between 7 and 365 days.';
    const pw = parseInt(settings.purgeWarningHours, 10);
    if (isNaN(pw) || pw < 12 || pw > 168) return 'Purge warning must be between 12 and 168 hours.';
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) { toast.error(error); return; }
    setIsSaving(true);
    try {
      // Save to Supabase first
      await upsertSystemSettings(settings as unknown as Record<string, unknown>, user?.id);
      // Also keep localStorage as a fast local cache
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSavedSnapshot(JSON.stringify(settings));
      toast.success('Settings saved successfully!');
    } catch {
      toast.error('Failed to save settings to server.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="page-container max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">System configuration and policies</p>
        </div>
        <PageHelpButton {...SETTINGS_HELP} />
      </div>

      {/* Buffer Time */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[10px] border border-gray-200 p-4 md:p-6"
      >
        <h3 className="text-xs md:text-sm font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent-500" />
          Scheduling Settings
        </h3>
        <div className="space-y-4">
          <Input
            label="Default Buffer Time Between Cases (minutes)"
            type="number"
            value={settings.bufferTime}
            onChange={(e) => update('bufferTime', e.target.value)}
            min="0"
            max="120"
            helperText="Minimum rest/turnover time between back-to-back cases"
          />
        </div>
      </motion.div>

      {/* Data Retention */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-[10px] border border-gray-200 p-4 md:p-6"
      >
        <h3 className="text-xs md:text-sm font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
          <Archive className="w-4 h-4 text-accent-500" />
          Data Retention & Archival
        </h3>
        <div className="space-y-4">
          <Input
            label="Downloadable Window (days)"
            type="number"
            value={settings.downloadRetention}
            onChange={(e) => update('downloadRetention', e.target.value)}
            min="1"
            max="90"
            helperText="Number of days schedule sheets remain available for download"
          />
          <Input
            label="Archive Retention (days)"
            type="number"
            value={settings.archiveRetention}
            onChange={(e) => update('archiveRetention', e.target.value)}
            min="7"
            max="365"
            helperText="After this period, data moves to cold storage or is purged"
          />
          <Input
            label="Purge Warning (hours before)"
            type="number"
            value={settings.purgeWarningHours}
            onChange={(e) => update('purgeWarningHours', e.target.value)}
            min="12"
            max="168"
            helperText="Admin receives notification this many hours before auto-deletion"
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoArchive}
              onChange={(e) => update('autoArchive', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">Auto-archive old data</span>
              <p className="text-xs text-gray-400">Automatically generate final archive snapshot before deletion</p>
            </div>
          </label>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-[10px] border border-gray-200 p-4 md:p-6"
      >
        <h3 className="text-xs md:text-sm font-semibold text-gray-900 mb-3 md:mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-500" />
          Notification Settings
        </h3>
        <div className="space-y-3">
          {NOTIFICATION_ITEMS.map((item) => (
            <label key={item} className="flex items-center gap-3 cursor-pointer touch-target">
              <input
                type="checkbox"
                checked={isNotifEnabled(item)}
                onChange={() => toggleNotification(item)}
                className="w-5 h-5 md:w-4 md:h-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
              />
              <span className="text-sm text-gray-700">{item}</span>
            </label>
          ))}
        </div>
      </motion.div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button icon={<Save className="w-4 h-4" />} onClick={handleSave} disabled={!isDirty || isLoading} loading={isSaving}>
          {isDirty ? 'Save Settings' : 'Saved'}
        </Button>
      </div>
    </div>
  );
}
