import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Archive, Bell, Save } from 'lucide-react';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/FormFields';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [bufferTime, setBufferTime] = useState('30');
  const [downloadRetention, setDownloadRetention] = useState('7');
  const [archiveRetention, setArchiveRetention] = useState('30');
  const [purgeWarningHours, setPurgeWarningHours] = useState('48');
  const [autoArchive, setAutoArchive] = useState(true);

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  return (
    <div className="page-container max-w-3xl">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-xs md:text-sm text-gray-500 mt-0.5">System configuration and policies</p>
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
            value={bufferTime}
            onChange={(e) => setBufferTime(e.target.value)}
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
            value={downloadRetention}
            onChange={(e) => setDownloadRetention(e.target.value)}
            min="1"
            max="90"
            helperText="Number of days schedule sheets remain available for download"
          />
          <Input
            label="Archive Retention (days)"
            type="number"
            value={archiveRetention}
            onChange={(e) => setArchiveRetention(e.target.value)}
            min="7"
            max="365"
            helperText="After this period, data moves to cold storage or is purged"
          />
          <Input
            label="Purge Warning (hours before)"
            type="number"
            value={purgeWarningHours}
            onChange={(e) => setPurgeWarningHours(e.target.value)}
            min="12"
            max="168"
            helperText="Admin receives notification this many hours before auto-deletion"
          />
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoArchive}
              onChange={(e) => setAutoArchive(e.target.checked)}
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
          {[
            'Booking confirmation',
            'Approval/denial with reason',
            'Schedule changes or cancellations',
            '24-hour reminder to requesting department',
            '2-hour reminder to requesting department',
            'Emergency case preemption alerts',
            'New booking request (Anesthesia)',
            'Case nearing estimated end time',
          ].map((item) => (
            <label key={item} className="flex items-center gap-3 cursor-pointer touch-target">
              <input
                type="checkbox"
                defaultChecked
                className="w-5 h-5 md:w-4 md:h-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500"
              />
              <span className="text-sm text-gray-700">{item}</span>
            </label>
          ))}
        </div>
      </motion.div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button icon={<Save className="w-4 h-4" />} onClick={handleSave}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
