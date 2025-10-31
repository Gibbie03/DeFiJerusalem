import PDFDocument from 'pdfkit';
import type { Writable } from 'stream';

interface ProtocolSecurityData {
  id: string;
  name: string;
  tvl: number;
  category: string;
  chains: string[];
  website: string;
  twitter?: string | null;
  github?: string | null;
  score: number;
  severity: string;
  threats: any[];
  scanned_at: Date;
  is_blacklisted: boolean;
}

export class PDFReportGenerator {
  private doc: PDFKit.PDFDocument;
  
  constructor() {
    this.doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: 'JERUSALEM DeFi Security Scanner - Top 300 Protocols Report',
        Author: 'JERUSALEM DeFi Security',
        Subject: 'Protocol Security Rankings',
        Keywords: 'DeFi, Security, Blockchain, Protocols',
      },
    });
  }

  private formatTVL(tvl: number): string {
    if (tvl >= 1e9) return `$${(tvl / 1e9).toFixed(2)}B`;
    if (tvl >= 1e6) return `$${(tvl / 1e6).toFixed(2)}M`;
    if (tvl >= 1e3) return `$${(tvl / 1e3).toFixed(2)}K`;
    return `$${tvl.toFixed(2)}`;
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'SAFE': return '#00C853';
      case 'LOW': return '#64DD17';
      case 'MEDIUM': return '#FFB300';
      case 'HIGH': return '#FF6D00';
      case 'CRITICAL': return '#D50000';
      default: return '#9E9E9E';
    }
  }

  private addHeader() {
    this.doc
      .fontSize(24)
      .fillColor('#1A237E')
      .font('Helvetica-Bold')
      .text('JERUSALEM DeFi Security Scanner', { align: 'center' });

    this.doc
      .moveDown(0.3)
      .fontSize(18)
      .fillColor('#424242')
      .font('Helvetica')
      .text('Top 300 Protocols - Security Rankings Report', { align: 'center' });

    this.doc
      .moveDown(0.3)
      .fontSize(10)
      .fillColor('#757575')
      .text(`Generated: ${new Date().toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      })}`, { align: 'center' });

    this.doc
      .moveDown(0.5)
      .moveTo(50, this.doc.y)
      .lineTo(545, this.doc.y)
      .strokeColor('#E0E0E0')
      .lineWidth(1)
      .stroke();

    this.doc.moveDown(1);
  }

  private addIntroduction() {
    this.doc
      .fontSize(10)
      .fillColor('#424242')
      .font('Helvetica')
      .text(
        'This report presents the top 300 DeFi protocols ranked by security score. ' +
        'Protocols are evaluated across 38+ threat categories including 2025 advanced wallet drainer operations, ' +
        'smart contract vulnerabilities, and phishing attacks. Lower security scores indicate safer protocols.',
        { align: 'justify', lineGap: 4 }
      );

    this.doc.moveDown(0.8);
  }

  private addSeverityLegend() {
    this.doc
      .fontSize(12)
      .fillColor('#1A237E')
      .font('Helvetica-Bold')
      .text('Severity Levels', { underline: true });

    this.doc.moveDown(0.5);

    const severityLevels = [
      { level: 'SAFE', description: 'No significant threats detected - Recommended for use', color: '#00C853' },
      { level: 'LOW', description: 'Minor concerns - Generally safe with standard precautions', color: '#64DD17' },
      { level: 'MEDIUM', description: 'Moderate risks - Use with caution and review details', color: '#FFB300' },
      { level: 'HIGH', description: 'Significant threats - Exercise extreme caution', color: '#FF6D00' },
      { level: 'CRITICAL', description: 'Dangerous - Avoid use, likely scam or exploit', color: '#D50000' },
    ];

    severityLevels.forEach(({ level, description, color }) => {
      this.doc
        .rect(60, this.doc.y, 80, 15)
        .fillAndStroke(color, '#424242');

      this.doc
        .fontSize(9)
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .text(level, 65, this.doc.y - 12, { width: 70, align: 'center' });

      this.doc
        .fontSize(8)
        .fillColor('#424242')
        .font('Helvetica')
        .text(description, 150, this.doc.y - 12, { width: 350 });

      this.doc.moveDown(0.8);
    });

    this.doc.moveDown(1);
  }

  private addPageFooter(pageNumber: number, totalPages: number) {
    const currentY = this.doc.y;
    
    this.doc
      .fontSize(8)
      .fillColor('#9E9E9E')
      .font('Helvetica')
      .text(
        `JERUSALEM DeFi Security Scanner | defijerusalem.com | partnerships@defijerusalem.com`,
        50,
        this.doc.page.height - 40,
        { align: 'center', width: this.doc.page.width - 100 }
      );

    this.doc
      .fontSize(8)
      .text(
        `Page ${pageNumber} of ${totalPages}`,
        50,
        this.doc.page.height - 30,
        { align: 'center', width: this.doc.page.width - 100 }
      );
    
    // Restore Y position
    this.doc.y = currentY;
  }

  private addProtocolEntry(protocol: ProtocolSecurityData, rank: number) {
    // Check if we need a new page
    if (this.doc.y > 700) {
      this.doc.addPage();
      this.doc.moveDown(1);
    }

    const startY = this.doc.y;

    // Rank badge
    this.doc
      .roundedRect(50, startY, 35, 35, 3)
      .fillAndStroke('#1A237E', '#424242')
      .lineWidth(0.5);

    this.doc
      .fontSize(14)
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .text(`#${rank}`, 50, startY + 10, { width: 35, align: 'center' });

    // Protocol name
    this.doc
      .fontSize(11)
      .fillColor('#1A237E')
      .font('Helvetica-Bold')
      .text(protocol.name, 95, startY + 2, { width: 300 });

    // TVL
    this.doc
      .fontSize(9)
      .fillColor('#757575')
      .font('Helvetica')
      .text(`TVL: ${this.formatTVL(protocol.tvl)}`, 95, startY + 17, { width: 150 });

    // Category
    if (protocol.category) {
      this.doc
        .fontSize(8)
        .fillColor('#757575')
        .text(`Category: ${protocol.category}`, 250, startY + 17, { width: 150 });
    }

    // Severity badge
    const severityColor = this.getSeverityColor(protocol.severity);
    this.doc
      .roundedRect(410, startY + 5, 85, 25, 3)
      .fillAndStroke(severityColor, '#424242')
      .lineWidth(0.5);

    this.doc
      .fontSize(10)
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .text(protocol.severity, 415, startY + 12, { width: 75, align: 'center' });

    // Security score
    this.doc
      .fontSize(8)
      .fillColor('#424242')
      .font('Helvetica')
      .text(`Score: ${protocol.score.toFixed(1)}`, 505, startY + 14, { width: 40, align: 'right' });

    // Chains (up to 5)
    if (protocol.chains && protocol.chains.length > 0) {
      const chainText = protocol.chains.slice(0, 5).join(', ');
      const displayChains = protocol.chains.length > 5 
        ? `${chainText} +${protocol.chains.length - 5} more`
        : chainText;

      this.doc
        .fontSize(7)
        .fillColor('#9E9E9E')
        .font('Helvetica')
        .text(`Chains: ${displayChains}`, 95, startY + 32, { width: 400 });
    }

    // Threats summary
    if (protocol.threats && protocol.threats.length > 0) {
      this.doc
        .fontSize(8)
        .fillColor('#D50000')
        .font('Helvetica-Bold')
        .text(`⚠ ${protocol.threats.length} Threat(s) Detected`, 95, this.doc.y + 5, { width: 450 });

      // List up to 3 threats
      const threatsToShow = protocol.threats.slice(0, 3);
      threatsToShow.forEach((threat: any) => {
        this.doc
          .fontSize(7)
          .fillColor('#757575')
          .font('Helvetica')
          .text(`• ${threat.type || threat}`, 105, this.doc.y + 3, { width: 440 });
      });

      if (protocol.threats.length > 3) {
        this.doc
          .fontSize(7)
          .fillColor('#9E9E9E')
          .text(`... and ${protocol.threats.length - 3} more`, 105, this.doc.y + 2);
      }
    } else {
      this.doc
        .fontSize(8)
        .fillColor('#00C853')
        .font('Helvetica')
        .text('✓ No threats detected', 95, this.doc.y + 5);
    }

    // Website link
    if (protocol.website) {
      this.doc
        .fontSize(7)
        .fillColor('#1976D2')
        .font('Helvetica')
        .text(protocol.website, 95, this.doc.y + 5, { width: 400, link: protocol.website });
    }

    // Blacklisted warning
    if (protocol.is_blacklisted) {
      this.doc
        .rect(95, this.doc.y + 5, 450, 15)
        .fillAndStroke('#D50000', '#424242')
        .lineWidth(0.5);

      this.doc
        .fontSize(8)
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .text('⛔ BLACKLISTED - DO NOT USE', 100, this.doc.y - 10, { width: 440, align: 'center' });
    }

    // Divider line
    this.doc
      .moveDown(0.8)
      .moveTo(50, this.doc.y)
      .lineTo(545, this.doc.y)
      .strokeColor('#E0E0E0')
      .lineWidth(0.5)
      .stroke();

    this.doc.moveDown(0.8);
  }

  public async generateReport(protocols: ProtocolSecurityData[], outputStream: Writable): Promise<void> {
    return new Promise((resolve, reject) => {
      this.doc.pipe(outputStream);

      outputStream.on('finish', resolve);
      outputStream.on('error', reject);

      try {
        // Header and Introduction
        this.addHeader();
        this.addIntroduction();
        this.addSeverityLegend();

        // Add protocols
        protocols.forEach((protocol, index) => {
          this.addProtocolEntry(protocol, index + 1);
        });

        // Finalize (footer will be added by PDF rendering)
        this.doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
