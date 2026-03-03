import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Booking, ORRoom } from './types';
import { formatTime } from './utils';
import type { SignatoryConfig } from '../stores/appStore';

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
 *
 * Bookings are grouped by room (with room cell spanning multiple rows).
 * Optional PACU resident names are printed below the table.
 */
export async function generateSchedulePDF(
  dateStr: string,
  bookings: Booking[],
  rooms: ORRoom[],
  pacuNames?: string,
  signatory?: SignatoryConfig,
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
  let headerY = 11;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('VETERANS MEMORIAL MEDICAL CENTER', headerCenterX, headerY, { align: 'center' });
  headerY += 5;

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

  // ── Group bookings by room (preserving room order) ──
  const roomOrder: string[] = [];
  const bookingsByRoom = new Map<string, Booking[]>();
  dayBookings.forEach(b => {
    if (!bookingsByRoom.has(b.or_room_id)) {
      roomOrder.push(b.or_room_id);
      bookingsByRoom.set(b.or_room_id, []);
    }
    bookingsByRoom.get(b.or_room_id)!.push(b);
  });

  // Track which body row indices start a new room group (for thicker separator lines)
  const roomGroupStartRows = new Set<number>();
  let currentRow = 0;

  // ── Build table data with room grouping (rowSpan) ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tableBody: any[][] = [];

  roomOrder.forEach(roomId => {
    const roomBookings = bookingsByRoom.get(roomId)!;
    const room = rooms.find(r => r.id === roomId);
    const roomLabel = room ? room.name : '';

    roomGroupStartRows.add(currentRow);

    roomBookings.forEach((b, idx) => {
      const timeLabel = formatTime(b.start_time);
      const patientInfo = `${b.patient_name}\n${b.patient_age} ${b.patient_sex} ${b.patient_category}`;

      if (idx === 0 && roomBookings.length > 1) {
        // First row of a multi-booking room group — room cell spans all rows
        tableBody.push([
          { content: roomLabel, rowSpan: roomBookings.length, styles: { valign: 'middle', halign: 'center', fontStyle: 'bold' } },
          timeLabel,
          patientInfo,
          b.ward,
          b.procedure,
          b.anesthesiologist,
          b.surgeon,
          b.scrub_nurse || '',
          b.circulating_nurse || '',
        ]);
      } else if (idx === 0) {
        // Single booking in room — normal row
        tableBody.push([
          { content: roomLabel, styles: { halign: 'center', fontStyle: 'bold' } },
          timeLabel,
          patientInfo,
          b.ward,
          b.procedure,
          b.anesthesiologist,
          b.surgeon,
          b.scrub_nurse || '',
          b.circulating_nurse || '',
        ]);
      } else {
        // Subsequent rows in a multi-booking room group — no room cell (spanned)
        tableBody.push([
          timeLabel,
          patientInfo,
          b.ward,
          b.procedure,
          b.anesthesiologist,
          b.surgeon,
          b.scrub_nurse || '',
          b.circulating_nurse || '',
        ]);
      }
      currentRow++;
    });
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
        // Thicker top border for rows that start a new room group (except the first group)
        if (data.section === 'body' && roomGroupStartRows.has(data.row.index) && data.row.index !== 0) {
          data.cell.styles.lineWidth = { top: 0.7, right: 0.3, bottom: 0.3, left: 0.3 };
        }
      },
    });
  }

  // ── Footer: total cases ──
  const finalY = (doc as any).lastAutoTable?.finalY ?? headerY + 20;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Cases: ${dayBookings.length}`, 10, finalY + 8);

  // ── PACU: Assigned Anesthesia Residents ──
  let signatoryStartY = finalY + 16;
  if (pacuNames && pacuNames.trim()) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`PACU: ${pacuNames.trim()}`, 10, signatoryStartY);
    signatoryStartY += 12;
  }

  // ── Signatory block ──
  if (signatory) {
    const lineY = signatoryStartY + 4;
    const pageHeight = doc.internal.pageSize.getHeight();
    // Ensure we don’t overflow — add new page if less than 30 mm remaining
    const printY = lineY + 30 > pageHeight ? pageHeight - 30 : lineY;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    // OR Supervisor
    if (signatory.orSupervisor.trim()) {
      doc.text(signatory.orSupervisor.trim(), 10, printY + 12);
      doc.setFont('helvetica', 'bold');
      doc.text('OR Supervisor', 10, printY + 17);
      doc.setFont('helvetica', 'normal');
    }

    // Head, Department of Anesthesiology
    if (signatory.deptHead.trim()) {
      doc.text(signatory.deptHead.trim(), 10, printY + 27);
      doc.setFont('helvetica', 'bold');
      doc.text('Head, Department of Anesthesiology', 10, printY + 32);
      doc.setFont('helvetica', 'normal');
    }
  }

  // ── Save ──
  const fileName = `OR_Schedule_${dateStr}.pdf`;
  doc.save(fileName);
}
