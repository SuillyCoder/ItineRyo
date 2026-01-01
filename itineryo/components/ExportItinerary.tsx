// ============================================
// FILE: components/ExportItinerary.tsx
// Export trip itinerary as PDF or XLSX
// ============================================
'use client';

import { useState } from 'react';
import { X, FileText, FileSpreadsheet, Download } from 'lucide-react';
import { Activity, Trip } from '@/lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface DayData {
  dayNumber: number;
  date: Date;
  activities: Activity[];
}

interface ExportItineraryProps {
  trip: Trip;
  days: DayData[];
  onClose: () => void;
}

export default function ExportItinerary({ trip, days, onClose }: ExportItineraryProps) {
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'xlsx' | null>(null);

  // Calculate totals
  const calculateDayTotal = (activities: Activity[]) => {
    return activities.reduce((sum, act) => sum + (act.estimated_cost || 0), 0);
  };

  const calculateTripTotal = () => {
    return days.reduce((sum, day) => sum + calculateDayTotal(day.activities), 0);
  };

  const exportAsPDF = () => {
    setExporting(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPosition = 20;

      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(trip.trip_name, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Trip details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const startDate = new Date(trip.start_date).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      });
      const endDate = new Date(trip.end_date).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'long', day: 'numeric' 
      });
      doc.text(`${startDate} - ${endDate}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 6;
      doc.text(`Destination: ${trip.prefectures?.name || 'Japan'}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Total Budget
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const tripTotal = calculateTripTotal();
      doc.text(`Total Budget: ¥${tripTotal.toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Iterate through each day
      days.forEach((day, dayIndex) => {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        // Day header
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        const dayTitle = `Day ${day.dayNumber} - ${day.date.toLocaleDateString('en-US', { 
          weekday: 'long', month: 'long', day: 'numeric' 
        })}`;
        doc.text(dayTitle, 14, yPosition);
        yPosition += 8;

        // Day total
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const dayTotal = calculateDayTotal(day.activities);
        doc.text(`Day Budget: ¥${dayTotal.toLocaleString()}`, 14, yPosition);
        yPosition += 5;

        if (day.activities.length === 0) {
          doc.setFontSize(10);
          doc.setTextColor(128, 128, 128);
          doc.text('No activities planned', 20, yPosition);
          doc.setTextColor(0, 0, 0);
          yPosition += 15;
        } else {
          // Activities table
          const tableData = day.activities.map(activity => [
            activity.scheduled_time || '--',
            activity.activity_name,
            activity.address || 'No address',
            activity.estimated_duration ? `${activity.estimated_duration} mins` : '--',
            activity.estimated_cost ? `¥${activity.estimated_cost.toLocaleString()}` : '¥0'
          ]);

          autoTable(doc, {
            startY: yPosition,
            head: [['Time', 'Activity', 'Location', 'Duration', 'Cost']],
            body: tableData,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
            columnStyles: {
              0: { cellWidth: 20 },
              1: { cellWidth: 45 },
              2: { cellWidth: 55 },
              3: { cellWidth: 25 },
              4: { cellWidth: 25 }
            },
            margin: { left: 14, right: 14 }
          });

          // @ts-ignore - autoTable adds finalY to doc
          yPosition = doc.lastAutoTable.finalY + 10;
        }
      });

      // Save PDF
      const fileName = `${trip.trip_name.replace(/[^a-z0-9]/gi, '_')}_itinerary.pdf`;
      doc.save(fileName);
      
      alert('PDF exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const exportAsXLSX = () => {
    setExporting(true);
    
    try {
      const workbook = XLSX.utils.book_new();

      // Summary sheet
      const summaryData: (string | number)[][] = [
        ['Trip Name', trip.trip_name],
        ['Start Date', new Date(trip.start_date).toLocaleDateString()],
        ['End Date', new Date(trip.end_date).toLocaleDateString()],
        ['Destination', trip.prefectures?.name || 'Japan'],
        ['Total Days', days.length],
        ['Total Budget', `¥${calculateTripTotal().toLocaleString()}`],
        [],
        ['Day-by-Day Budget'],
        ['Day', 'Date', 'Budget']
      ];

      days.forEach(day => {
        summaryData.push([
          `Day ${day.dayNumber}`,
          day.date.toLocaleDateString(),
          `¥${calculateDayTotal(day.activities).toLocaleString()}`
        ]);
      });

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Create a sheet for each day
      days.forEach(day => {
        const dayData: (string | number)[][] = [
          [`Day ${day.dayNumber} - ${day.date.toLocaleDateString('en-US', { 
            weekday: 'long', month: 'long', day: 'numeric' 
          })}`],
          [],
          ['Time', 'Activity Name', 'Category', 'Location', 'Duration (mins)', 'Cost (¥)', 'Notes']
        ];

        day.activities.forEach(activity => {
          dayData.push([
            activity.scheduled_time || '--',
            activity.activity_name,
            activity.category || 'other',
            activity.address || 'No address',
            activity.estimated_duration || '--',
            activity.estimated_cost || 0,
            activity.notes || ''
          ]);
        });

  // Add day total
  dayData.push([]);
  dayData.push(['', '', '', '', 'Day Total:', calculateDayTotal(day.activities)]);

        const daySheet = XLSX.utils.aoa_to_sheet(dayData);
        
        // Set column widths
        daySheet['!cols'] = [
          { wch: 10 },  // Time
          { wch: 30 },  // Activity
          { wch: 15 },  // Category
          { wch: 40 },  // Location
          { wch: 12 },  // Duration
          { wch: 12 },  // Cost
          { wch: 30 }   // Notes
        ];

        XLSX.utils.book_append_sheet(workbook, daySheet, `Day ${day.dayNumber}`);
      });

      // Save XLSX
      const fileName = `${trip.trip_name.replace(/[^a-z0-9]/gi, '_')}_itinerary.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      alert('Excel file exported successfully!');
    } catch (error) {
      console.error('Error exporting XLSX:', error);
      alert('Failed to export Excel file');
    } finally {
      setExporting(false);
    }
  };

  const handleExport = () => {
    if (!exportFormat) {
      alert('Please select an export format');
      return;
    }

    if (exportFormat === 'pdf') {
      exportAsPDF();
    } else {
      exportAsXLSX();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="bg-linear-to-r from-red-400 to-red-700 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Export Itinerary</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Trip Summary</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><span className="font-medium">Trip:</span> {trip.trip_name}</p>
              <p><span className="font-medium">Duration:</span> {days.length} days</p>
              <p><span className="font-medium">Activities:</span> {days.reduce((sum, d) => sum + d.activities.length, 0)} total</p>
              <p><span className="font-medium">Total Budget:</span> ¥{calculateTripTotal().toLocaleString()}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Select Export Format</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setExportFormat('pdf')}
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
                  exportFormat === 'pdf'
                    ? 'border-red-500 bg-red-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow'
                }`}
              >
                <FileText className={`w-12 h-12 mb-3 ${
                  exportFormat === 'pdf' ? 'text-red-600' : 'text-gray-400'
                }`} />
                <span className={`font-medium ${
                  exportFormat === 'pdf' ? 'text-red-700' : 'text-gray-700'
                }`}>
                  PDF
                </span>
                <span className="text-xs text-gray-500 mt-1">Printable format</span>
              </button>

              <button
                onClick={() => setExportFormat('xlsx')}
                className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all ${
                  exportFormat === 'xlsx'
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow'
                }`}
              >
                <FileSpreadsheet className={`w-12 h-12 mb-3 ${
                  exportFormat === 'xlsx' ? 'text-green-600' : 'text-gray-400'
                }`} />
                <span className={`font-medium ${
                  exportFormat === 'xlsx' ? 'text-green-700' : 'text-gray-700'
                }`}>
                  Excel
                </span>
                <span className="text-xs text-gray-500 mt-1">Editable format</span>
              </button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-medium">📄 Export includes:</span>
              <br />
              • All days and activities
              <br />
              • Time schedules and durations
              <br />
              • Individual and total budgets
              <br />
              • Location information
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={!exportFormat || exporting}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all ${
              !exportFormat || exporting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-linear-to-r from-red-400 to-red-700 text-white hover:from-red-500 hover:to-red-800 shadow-md'
            }`}
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}