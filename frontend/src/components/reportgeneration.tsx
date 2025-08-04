// import React, { useState } from 'react';
// import { FileText } from 'lucide-react';

// interface ReportData {
//   success: boolean;
//   holding_id: string;
//   portfolio_count: number;
//   holdings_data: {
//     Ticker: string;
//     quantity: number;
//   }[];
//   report: string;
//   generated_at: string;
//   message?: string;
// }

// interface ReportGenerationProps {
//   holdingId?: string;
// }

// const ReportGeneration: React.FC<ReportGenerationProps> = ({ holdingId: initialHoldingId = '' }) => {
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [holdingId, setHoldingId] = useState<string>(initialHoldingId);

//   const handleGenerateReport = async () => {
//     if (!holdingId.trim()) {
//       setError('Please enter a holding ID');
//       return;
//     }

//     setLoading(true);
//     setError('');
//     setSuccess('');
    
//     try {
//       const response = await fetch(`http://192.168.230.228:5002/report_generation/${holdingId}`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//         }
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const data: ReportData = await response.json();

//       if (data.success) {
//         setSuccess('Report generated successfully! PDF download started.');
//         await generatePDF(data);
//       } else {
//         throw new Error(data.message || 'Failed to generate report');
//       }
//     } catch (err: unknown) {
//       const errorMessage = err instanceof Error ? err.message : String(err);
//       setError(`Error generating report: ${errorMessage}`);
//       console.error('Error:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const generatePDF = async (reportData: ReportData) => {
//     try {
//       const pdfMake = await import('pdfmake/build/pdfmake');
//       const pdfFonts = await import('pdfmake/build/vfs_fonts');
//       pdfMake.vfs = pdfFonts.pdfMake.vfs;

//       // Clean and format the report text
//       const cleanReport = reportData.report
//         .replace(/[🔴📊❌🏢📰🇮🇳]/g, '') // Remove emojis
//         .replace(/={2,}/g, '────────────────────────────────────────────────') // Replace = with lines
//         .replace(/\n\n+/g, '\n\n') // Remove excessive line breaks
//         .trim();

//       const docDefinition = {
//         content: [
//           // Header Section
//           {
//             text: 'NSE REAL-TIME PORTFOLIO REPORT',
//             style: 'header',
//             alignment: 'center',
//             color: '#1e40af'
//           },
//           {
//             canvas: [
//               {
//                 type: 'line',
//                 x1: 0,
//                 y1: 0,
//                 x2: 515,
//                 y2: 0,
//                 lineWidth: 2,
//                 lineColor: '#1e40af'
//               }
//             ],
//             margin: [0, 5, 0, 15]
//           },

//           // Report Metadata
//           {
//             columns: [
//               {
//                 width: '50%',
//                 text: [
//                   { text: 'Generated on: ', bold: true, color: '#374151' },
//                   { text: new Date(reportData.generated_at).toLocaleString('en-IN'), color: '#6b7280' }
//                 ]
//               },
//               {
//                 width: '50%',
//                 text: [
//                   { text: 'Holding ID: ', bold: true, color: '#374151' },
//                   { text: reportData.holding_id, color: '#6b7280' }
//                 ]
//               }
//             ],
//             margin: [0, 0, 0, 20]
//           },

//           // Portfolio Summary Box
//           {
//             table: {
//               headerRows: 0,
//               widths: ['100%'],
//               body: [
//                 [{
//                   text: 'PORTFOLIO SUMMARY',
//                   style: 'sectionHeader',
//                   fillColor: '#f3f4f6',
//                   border: [true, true, true, false],
//                   margin: [10, 8, 10, 5]
//                 }],
//                 [{
//                   columns: [
//                     {
//                       width: '33%',
//                       text: [
//                         { text: 'Total Holdings\n', bold: true, fontSize: 10, color: '#374151' },
//                         { text: reportData.portfolio_count.toString(), fontSize: 16, bold: true, color: '#1e40af' }
//                       ],
//                       alignment: 'center'
//                     },
//                     {
//                       width: '33%',
//                       text: [
//                         { text: 'Market\n', bold: true, fontSize: 10, color: '#374151' },
//                         { text: 'NSE India', fontSize: 12, bold: true, color: '#059669' }
//                       ],
//                       alignment: 'center'
//                     },
//                     {
//                       width: '34%',
//                       text: [
//                         { text: 'Status\n', bold: true, fontSize: 10, color: '#374151' },
//                         { text: reportData.success ? 'Active' : 'Error', fontSize: 12, bold: true, color: reportData.success ? '#059669' : '#dc2626' }
//                       ],
//                       alignment: 'center'
//                     }
//                   ],
//                   border: [true, false, true, true],
//                   margin: [10, 5, 10, 8]
//                 }]
//               ]
//             },
//             layout: 'noBorders',
//             margin: [0, 0, 0, 20]
//           },

//           // Holdings Table
//           {
//             text: 'HOLDINGS DETAILS',
//             style: 'sectionHeader',
//             margin: [0, 0, 0, 10]
//           },
//           {
//             table: {
//               headerRows: 1,
//               widths: ['25%', '25%', '25%', '25%'],
//               body: [
//                 [
//                   { text: 'Ticker', style: 'tableHeader' },
//                   { text: 'Quantity', style: 'tableHeader' },
//                   { text: 'Type', style: 'tableHeader' },
//                   { text: 'Market', style: 'tableHeader' }
//                 ],
//                 ...reportData.holdings_data.map((holding) => [
//                   { text: holding.Ticker || 'N/A', style: 'tableCell' },
//                   { text: holding.quantity?.toString() || '0', style: 'tableCell' },
//                   { text: 'Equity', style: 'tableCell' },
//                   { text: 'NSE', style: 'tableCell' }
//                 ])
//               ]
//             },
//             layout: {
//               fillColor: (rowIndex: number) => (rowIndex === 0 ? '#e5e7eb' : null),
//               hLineWidth: () => 1,
//               vLineWidth: () => 1,
//               hLineColor: () => '#d1d5db',
//               vLineColor: () => '#d1d5db'
//             },
//             margin: [0, 0, 0, 20]
//           },

//           // Detailed Report Section
//           {
//             text: 'DETAILED MARKET REPORT',
//             style: 'sectionHeader',
//             margin: [0, 0, 0, 10]
//           },
//           {
//             table: {
//               headerRows: 0,
//               widths: ['100%'],
//               body: [
//                 [{
//                   text: cleanReport,
//                   style: 'reportText',
//                   margin: [15, 15, 15, 15]
//                 }]
//               ]
//             },
//             layout: {
//               fillColor: () => '#f9fafb',
//               hLineWidth: () => 1,
//               vLineWidth: () => 1,
//               hLineColor: () => '#e5e7eb',
//               vLineColor: () => '#e5e7eb'
//             }
//           },

//           // Footer Information
//           {
//             text: '────────────────────────────────────────────────',
//             alignment: 'center',
//             margin: [0, 20, 0, 10],
//             color: '#9ca3af'
//           },
//           {
//             columns: [
//               {
//                 width: '50%',
//                 text: [
//                   { text: 'Report Type: ', bold: true, fontSize: 9, color: '#6b7280' },
//                   { text: 'NSE Real-time Portfolio Analysis', fontSize: 9, color: '#6b7280' }
//                 ]
//               },
//               {
//                 width: '50%',
//                 text: [
//                   { text: 'Data Source: ', bold: true, fontSize: 9, color: '#6b7280' },
//                   { text: 'National Stock Exchange (NSE)', fontSize: 9, color: '#6b7280' }
//                 ]
//               }
//             ],
//             margin: [0, 0, 0, 10]
//           }
//         ],

//         styles: {
//           header: {
//             fontSize: 20,
//             bold: true,
//             margin: [0, 0, 0, 10]
//           },
//           sectionHeader: {
//             fontSize: 14,
//             bold: true,
//             color: '#374151',
//             margin: [0, 10, 0, 5]
//           },
//           tableHeader: {
//             bold: true,
//             fillColor: '#f3f4f6',
//             color: '#374151',
//             fontSize: 11,
//             alignment: 'center',
//             margin: [0, 8, 0, 8]
//           },
//           tableCell: {
//             margin: [0, 6, 0, 6],
//             fontSize: 10,
//             alignment: 'center'
//           },
//           reportText: {
//             fontSize: 9,
//             font: 'Courier',
//             lineHeight: 1.3,
//             color: '#374151'
//           },
//           footer: {
//             fontSize: 8,
//             italics: true,
//             color: '#6b7280'
//           }
//         },

//         defaultStyle: {
//           fontSize: 10,
//           font: 'Helvetica'
//         },

//         pageSize: 'A4',
//         pageMargins: [40, 60, 40, 60],

//         header: (currentPage: number) => {
//           if (currentPage > 1) {
//             return {
//               text: 'NSE Portfolio Report - Confidential',
//               alignment: 'center',
//               margin: [0, 20, 0, 0],
//               fontSize: 8,
//               color: '#9ca3af'
//             };
//           }
//           return null;
//         },

//         footer: (currentPage: number, pageCount: number) => {
//           return {
//             columns: [
//               {
//                 text: `Generated: ${new Date().toLocaleString('en-IN')}`,
//                 alignment: 'left',
//                 style: 'footer',
//                 margin: [40, 0, 0, 0]
//               },
//               {
//                 text: `Page ${currentPage} of ${pageCount}`,
//                 alignment: 'right',
//                 style: 'footer',
//                 margin: [0, 0, 40, 0]
//               }
//             ],
//             margin: [0, 0, 0, 20]
//           };
//         }
//       };

//       // Generate filename with timestamp
//       const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
//       const fileName = `NSE_Portfolio_Report_${reportData.holding_id}_${timestamp}.pdf`;

//       // Create and download PDF
//       pdfMake.createPdf(docDefinition).download(fileName);
//     } catch (error) {
//       console.error('Error generating PDF:', error);
//       setError('Failed to generate PDF. Please try again.');
//     }
//   };

//   return (
//     <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
//       <div className="text-center mb-8">
//         <h1 className="text-3xl font-bold text-gray-800 mb-2">
//           NSE Portfolio Report Generator
//         </h1>
//         <p className="text-gray-600">
//           Generate comprehensive PDF reports for your NSE holdings
//         </p>
//       </div>

//       <div className="mb-6">
//         <label className="block text-sm font-medium text-gray-700 mb-2">
//           Holding ID
//         </label>
//         <input
//           type="text"
//           value={holdingId}
//           onChange={(e) => setHoldingId(e.target.value)}
//           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//           placeholder="Enter your holding ID (e.g., QwzYsV22yz)"
//           disabled={loading}
//         />
//       </div>

//       {error && (
//         <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
//           <p className="text-red-600 text-sm">{error}</p>
//         </div>
//       )}

//       {success && (
//         <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-4">
//           <p className="text-green-600 text-sm">{success}</p>
//         </div>
//       )}

//       <div className="text-center mb-6">
//         <button
//           onClick={handleGenerateReport}
//           disabled={loading || !holdingId.trim()}
//           className={`inline-flex items-center px-6 py-3 rounded-lg font-medium text-white transition-colors ${
//             loading || !holdingId.trim()
//               ? 'bg-gray-400 cursor-not-allowed'
//               : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
//           }`}
//         >
//           {loading ? (
//             <>
//               <div className="animate-spin -ml-1 mr-3 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
//               Generating Report...
//             </>
//           ) : (
//             <>
//               <FileText className="mr-2 h-5 w-5" />
//               Generate PDF Report
//             </>
//           )}
//         </button>
//       </div>

//       <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
//         <h3 className="font-medium mb-2">Features:</h3>
//         <ul className="space-y-1">
//           <li>• Real-time NSE portfolio data</li>
//           <li>• Professional PDF formatting</li>
//           <li>• Holdings summary and details</li>
//           <li>• Market analysis and news</li>
//           <li>• Automatic file naming with timestamp</li>
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default ReportGeneration;


import jsPDF from 'jspdf';

// Define the ReportData interface (adjust according to your actual data structure)
interface ReportData {
  title?: string;
  content?: string;
  sections?: Array<{
    header: string;
    data: string;
  }>;
  // Add other properties as needed
}

const generateAndDownloadPDF = async (holdingId: string) => {
  try {
    const response = await fetch(`http://192.168.230.228:5002/report_generation/${holdingId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ReportData = await response.json();

    // Create a new PDF document
    const pdf = new jsPDF();

    // Add title
    pdf.setFontSize(20);
    pdf.text(data.title || 'Report', 20, 20);

    // Add content
    let yPosition = 40;
    pdf.setFontSize(12);

    if (data.content) {
      // Split content into lines to handle text wrapping
      const lines = pdf.splitTextToSize(data.content, 170); // 170 is page width minus margins
      pdf.text(lines, 20, yPosition);
      yPosition += lines.length * 7; // Adjust spacing
    }

    // Add sections if they exist
    if (data.sections && data.sections.length > 0) {
      data.sections.forEach(section => {
        // Check if we need a new page
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }

        // Add section header
        pdf.setFontSize(14);
        pdf.text(section.header, 20, yPosition);
        yPosition += 10;

        // Add section data
        pdf.setFontSize(12);
        const sectionLines = pdf.splitTextToSize(section.data, 170);
        pdf.text(sectionLines, 20, yPosition);
        yPosition += sectionLines.length * 7 + 10; // Extra spacing after section
      });
    }

    // Generate PDF blob
    const pdfBlob = pdf.output('blob');

    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${holdingId}.pdf`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('PDF downloaded successfully');

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Alternative method using a more robust PDF library (react-pdf or pdfmake)
// If you prefer using pdfmake, here's an alternative implementation:

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Set up pdfMake fonts
pdfMake.vfs = pdfFonts.pdfMake.vfs;

const generatePDFWithPdfMake = async (holdingId: string) => {
  try {
    const response = await fetch(`http://192.168.1.107:5002/report_generation/${holdingId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: ReportData = await response.json();

    // Define PDF document structure
    const documentDefinition = {
      content: [
        {
          text: data.title || 'Report',
          style: 'header'
        },
        {
          text: data.content || '',
          style: 'normal',
          margin: [0, 20, 0, 20]
        },
        // Add sections
        ...(data.sections || []).map(section => [
          {
            text: section.header,
            style: 'subheader'
          },
          {
            text: section.data,
            style: 'normal',
            margin: [0, 10, 0, 20]
          }
        ]).flat()
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 0, 0, 10]
        },
        subheader: {
          fontSize: 16,
          bold: true,
          margin: [0, 10, 0, 5]
        },
        normal: {
          fontSize: 12,
          lineHeight: 1.5
        }
      }
    };

    // Generate and download PDF
    pdfMake.createPdf(documentDefinition).download(`report_${holdingId}.pdf`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export { generateAndDownloadPDF, generatePDFWithPdfMake };

// Usage example:
// generateAndDownloadPDF('your-holding-id');
// or
// generatePDFWithPdfMake('your-holding-id');