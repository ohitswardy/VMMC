import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar } from 'lucide-react';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { useBookingsStore, useORRoomsStore } from '../stores/appStore';
import { getDeptName, getDeptColor, formatTime } from '../lib/utils';
import { generateSchedulePDF } from '../lib/generateSchedulePDF';
import Button from '../components/ui/Button';
import { DatePicker } from '../components/ui/DatePicker';
import PageHelpButton from '../components/ui/PageHelpButton';
import { DOCUMENTS_HELP } from '../lib/helpContent';

export default function DocumentsPage() {
  const { bookings } = useBookingsStore();
  const { rooms } = useORRoomsStore();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  }).reverse();

  const getBookingsForDate = (date: string) =>
    bookings
      .filter((b) => b.date === date && !['cancelled', 'denied'].includes(b.status))
      .sort((a, b) => {
        const roomA = rooms.findIndex((r) => r.id === a.or_room_id);
        const roomB = rooms.findIndex((r) => r.id === b.or_room_id);
        if (roomA !== roomB) return roomA - roomB;
        return a.start_time.localeCompare(b.start_time);
      });

  const handleDownloadPDF = async (date: string) => {
    await generateSchedulePDF(date, bookings, rooms);
  };

  const dayBookings = getBookingsForDate(selectedDate);

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Documents</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">Download OR schedule sheets</p>
          </div>
          <PageHelpButton {...DOCUMENTS_HELP} />
        </div>
      </div>

      {/* ─── Mobile: Date selector as horizontal scroll chips ─── */}
      <div className="md:hidden">
        <div className="bg-white rounded-[10px] border border-gray-200 p-3">
          <div className="mb-3">
            <DatePicker
              value={selectedDate}
              onChange={(val) => setSelectedDate(val)}
              placeholder="Select date"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scroll-snap-x">
            {last7Days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const count = getBookingsForDate(dateStr).length;
              const isSelected = selectedDate === dateStr;
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex-shrink-0 px-3 py-2 rounded-[8px] text-xs font-medium transition-all scroll-snap-start ${
                    isSelected ? 'bg-accent-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                  }`}
                >
                  {format(day, 'EEE d')}
                  <span className={`ml-1 ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* ─── Desktop: Date sidebar ─── */}
        <div className="hidden md:block space-y-3">
          <div className="bg-white rounded-[10px] border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-accent-500" />
              Select Date
            </h3>
            <DatePicker
              value={selectedDate}
              onChange={(val) => setSelectedDate(val)}
              placeholder="Select date"
            />
          </div>
          <div className="bg-white rounded-[10px] border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Dates</h3>
            <div className="space-y-1">
              {last7Days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const count = getBookingsForDate(dateStr).length;
                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-sm transition-colors ${
                      selectedDate === dateStr ? 'bg-accent-50 text-accent-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span>{format(day, 'EEE, MMM d')}</span>
                    <span className="text-xs text-gray-400">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Schedule preview */}
        <div className="lg:col-span-3 space-y-3 md:space-y-4">
          {/* Download actions — horizontal scroll on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Button size="sm" icon={<FileText className="w-4 h-4" />} onClick={() => handleDownloadPDF(selectedDate)}>PDF</Button>
          </div>

          {/* Schedule sheet preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[10px] border border-gray-200 overflow-hidden"
          >
            <div className="px-4 md:px-6 py-3.5 md:py-4 bg-accent-600 text-white">
              <h2 className="text-base md:text-lg font-bold">VMMC Operating Room Schedule</h2>
              <p className="text-xs md:text-sm text-white/80">{format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}</p>
            </div>

            {/* ─── Mobile: Card list ─── */}
            <div className="md:hidden divide-y divide-gray-100">
              {dayBookings.map((b) => {
                const room = rooms.find((r) => r.id === b.or_room_id);
                return (
                  <div key={b.id} className="px-4 py-3.5">
                    <div className="flex items-start gap-3">
                      <div className="w-1.5 rounded-full self-stretch flex-shrink-0" style={{ backgroundColor: getDeptColor(b.department_id) }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-xs font-bold text-accent-600">{room?.name}</span>
                          <span className="text-[10px] text-gray-400 flex-shrink-0">{formatTime(b.start_time)} – {formatTime(b.end_time)}</span>
                        </div>
                        <p className="text-sm font-medium text-gray-800">{b.procedure}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{b.patient_name} ({b.patient_age}/{b.patient_sex})</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{getDeptName(b.department_id)} · {b.surgeon} · {b.anesthesiologist}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {dayBookings.length === 0 && (
                <div className="px-4 py-12 text-center text-sm text-gray-400">No scheduled cases for this date.</div>
              )}
            </div>

            {/* ─── Desktop: Table ─── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase px-4 py-3">OR</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase px-4 py-3">Time</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase px-4 py-3">Department</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase px-4 py-3">Patient</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase px-4 py-3">Procedure</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase px-4 py-3">Surgeon</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase px-4 py-3">Anesthesiologist</th>
                    <th className="text-left text-[11px] font-semibold text-gray-400 uppercase px-4 py-3">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dayBookings.map((b) => {
                    const room = rooms.find((r) => r.id === b.or_room_id);
                    return (
                      <tr key={b.id} className="hover:bg-gray-50 transition-colors text-sm">
                        <td className="px-4 py-2.5 font-medium text-gray-700">{room?.name}</td>
                        <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{formatTime(b.start_time)} – {formatTime(b.end_time)}</td>
                        <td className="px-4 py-2.5 text-gray-600">{getDeptName(b.department_id)}</td>
                        <td className="px-4 py-2.5 text-gray-700">{b.patient_name} ({b.patient_age}/{b.patient_sex})</td>
                        <td className="px-4 py-2.5 text-gray-600">{b.procedure}</td>
                        <td className="px-4 py-2.5 text-gray-600">{b.surgeon}</td>
                        <td className="px-4 py-2.5 text-gray-600">{b.anesthesiologist}</td>
                        <td className="px-4 py-2.5 text-gray-500">{b.patient_category}</td>
                      </tr>
                    );
                  })}
                  {dayBookings.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-400">No scheduled cases for this date.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 md:px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
              <span>Generated: {format(new Date(), 'MMM d, yyyy h:mm a')}</span>
              <span>VMMC OR System</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
