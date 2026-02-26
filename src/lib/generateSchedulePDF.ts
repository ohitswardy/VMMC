import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Booking, ORRoom } from './types';
import { formatTime } from './utils';

/**
 * Loads an image from a URL and returns its base64 data URL.
 */
function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context unavailable'));
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

/**
 * Generates a PDF of the daily OR schedule following the VMMC
 * Department of Anesthesiology "Schedule of Operation" template.
 *
 * Columns: Room | Time | Name of Patient / Age / Sex / Category | Ward No. |
 *          Operation | Anesthesiologist | Surgeon | Scrub Nurse | CN/NA
 */
export async function generateSchedulePDF(
  dateStr: string,
  bookings: Booking[],
  rooms: ORRoom[],
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'legal' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // ── Load logo ──
  let logoData: string | null = null;
  try {
    logoData = await loadImage('/VMMClogo.png');
  } catch {
    // proceed without logo
  }

  // ── Header ──
  // Logo on the left, text block centered on the page (matching the physical template)
  const logoSize = 22;
  const logoX = 14;
  const logoY = 8;

  if (logoData) {
    doc.addImage(logoData, 'PNG', logoX, logoY, logoSize, logoSize);
  }

  const headerCenterX = pageWidth / 2;
  let headerY = 13;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('North Avenue, Diliman, Quezon City', headerCenterX, headerY, { align: 'center' });
  headerY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('DEPARTMENT OF ANESTHESIOLOGY', headerCenterX, headerY, { align: 'center' });
  headerY += 6;

  doc.setFontSize(12);
  doc.text('SCHEDULE OF OPERATION', headerCenterX, headerY, { align: 'center' });
  headerY += 6;

  // Date line
  const displayDate = format(new Date(dateStr + 'T00:00:00'), 'MMMM d, yyyy');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(displayDate, headerCenterX, headerY, { align: 'center' });
  headerY += 8;

  // ── Filter bookings for the date & exclude cancelled/denied ──
  const dayBookings = bookings
    .filter(b => b.date === dateStr && !['cancelled', 'denied'].includes(b.status))
    .sort((a, b) => {
      // Sort by room number first, then start time
      const roomA = rooms.find(r => r.id === a.or_room_id)?.number ?? 0;
      const roomB = rooms.find(r => r.id === b.or_room_id)?.number ?? 0;
      if (roomA !== roomB) return roomA - roomB;
      return a.start_time.localeCompare(b.start_time);
    });

  // ── Build table data ──
  const tableBody = dayBookings.map(b => {
    const room = rooms.find(r => r.id === b.or_room_id);
    const roomLabel = room ? `Rm ${room.number}` : '';
    const timeLabel = `${formatTime(b.start_time)}`;
    const patientInfo = `${b.patient_name}\n${b.patient_age} ${b.patient_sex} ${b.patient_category}`;
    return [
      roomLabel,
      timeLabel,
      patientInfo,
      b.ward,
      b.procedure,
      b.anesthesiologist,
      b.surgeon,
      b.scrub_nurse || '',
      b.circulating_nurse || '',
    ];
  });

  if (tableBody.length === 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.text('No cases scheduled for this date.', headerCenterX, headerY + 10, { align: 'center' });
  } else {
    autoTable(doc, {
      startY: headerY,
      head: [[
        'Room',
        'Time',
        'Name of Patient\nAge/Sex/Category',
        'Ward\nNo.',
        'Operation',
        'Anesthesiologist',
        'Surgeon',
        'Scrub\nNurse',
        'CN/NA',
      ]],
      body: tableBody,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        textColor: [0, 0, 0],
        valign: 'middle',
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
      },
      margin: { left: 10, right: 10 },
      columnStyles: {
        0: { cellWidth: 13, halign: 'center' },   // Room
        1: { cellWidth: 17, halign: 'center' },   // Time
        2: { cellWidth: 35 },                      // Patient
        3: { cellWidth: 13, halign: 'center' },   // Ward
        4: { cellWidth: 36 },                      // Operation
        5: { cellWidth: 26 },                      // Anesthesiologist
        6: { cellWidth: 26 },                      // Surgeon
        7: { cellWidth: 15, halign: 'center' },   // Scrub Nurse
        8: { cellWidth: 15, halign: 'center' },   // CN/NA
      },
      didParseCell: (data) => {
        // Alternating row styling (very light gray)
        if (data.section === 'body' && data.row.index % 2 === 1) {
          data.cell.styles.fillColor = [248, 248, 248];
        }
      },
    });
  }

  // ── Footer: total cases ──
  const finalY = (doc as any).lastAutoTable?.finalY ?? headerY + 20;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Cases: ${dayBookings.length}`, 10, finalY + 8);

  // ── Save ──
  const fileName = `OR_Schedule_${dateStr}.pdf`;
  doc.save(fileName);
}
