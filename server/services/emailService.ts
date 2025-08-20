// import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private fromEmail: string;

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@studytracker.com';
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      // Mock email sending for development
      console.log('📧 Mock Email Sent:');
      console.log('  To:', mailOptions.to);
      console.log('  Subject:', mailOptions.subject);
      console.log('  From:', mailOptions.from);
      if (process.env.NODE_ENV === 'development') {
        console.log('  Content Preview:', mailOptions.text?.substring(0, 100) + '...');
      }
      
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  async sendFriendInvitation(inviterName: string, inviterEmail: string, recipientEmail: string, inviteUrl: string, message?: string): Promise<boolean> {
    const subject = `${inviterName} invited you to join Study Tracker`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Study Tracker Invitation</title>
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden; }
          .header { background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; padding: 40px 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; }
          .invitation-box { background: #F3F4F6; border-radius: 8px; padding: 24px; margin: 20px 0; border-left: 4px solid #3B82F6; }
          .btn { display: inline-block; background: #3B82F6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; transition: background 0.3s ease; }
          .btn:hover { background: #2563EB; }
          .footer { background: #F9FAFB; padding: 20px 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
          .icon { width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; font-size: 24px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">🎓</div>
            <h1>Study Tracker</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Track your academic progress together</p>
          </div>
          
          <div class="content">
            <h2 style="color: #1F2937; margin-top: 0;">You're Invited to Join Study Tracker!</h2>
            
            <p><strong>${inviterName}</strong> (${inviterEmail}) has invited you to join Study Tracker - a comprehensive platform for tracking your study progress and connecting with study buddies.</p>
            
            ${message ? `
              <div class="invitation-box">
                <h3 style="margin-top: 0; color: #374151;">Personal Message:</h3>
                <p style="margin-bottom: 0; font-style: italic;">"${message}"</p>
              </div>
            ` : ''}
            
            <h3 style="color: #374151;">What you can do with Study Tracker:</h3>
            <ul style="color: #4B5563;">
              <li><strong>Track Study Sessions:</strong> Log your study hours and monitor progress across subjects</li>
              <li><strong>Set Goals:</strong> Create weekly study goals and track your achievements</li>
              <li><strong>Connect with Friends:</strong> See how your study buddies are doing and motivate each other</li>
              <li><strong>Generate Reports:</strong> Get detailed insights with daily, weekly, and monthly progress reports</li>
              <li><strong>Share Progress:</strong> Share your study achievements with friends and family</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" class="btn">Accept Invitation & Join Study Tracker</a>
            </div>
            
            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
              <strong>Note:</strong> This invitation will expire in 7 days. If you don't have an account yet, you'll be guided through a quick registration process.
            </p>
          </div>
          
          <div class="footer">
            <p>This invitation was sent by ${inviterName}. If you don't know this person or received this email by mistake, you can safely ignore it.</p>
            <p style="margin: 8px 0 0 0;">© 2024 Study Tracker. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
    });
  }

  async sendDailyProgressReport(userEmail: string, userName: string, reportData: {
    date: string;
    totalHours: number;
    sessionsCount: number;
    subjects: Array<{ name: string; hours: number; color: string }>;
    streak: number;
    weeklyGoal: number;
    weeklyProgress: number;
  }, shareToEmail?: string): Promise<boolean> {
    const isSharing = !!shareToEmail;
    const recipientEmail = shareToEmail || userEmail;
    const subject = isSharing 
      ? `${userName} shared their study progress with you`
      : `Your Daily Study Progress - ${reportData.date}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Study Progress Report</title>
        <style>
          body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden; }
          .header { background: linear-gradient(135deg, #3B82F6, #1D4ED8); color: white; padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
          .content { padding: 30px; }
          .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px; margin: 24px 0; }
          .stat-card { background: #F8FAFC; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #E2E8F0; }
          .stat-number { font-size: 28px; font-weight: 700; color: #1E293B; margin-bottom: 4px; }
          .stat-label { font-size: 14px; color: #64748B; text-transform: uppercase; font-weight: 500; letter-spacing: 0.5px; }
          .subject-list { margin: 20px 0; }
          .subject-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #F9FAFB; border-radius: 6px; margin-bottom: 8px; }
          .subject-color { width: 16px; height: 16px; border-radius: 50%; margin-right: 12px; }
          .progress-bar { width: 100%; height: 8px; background: #E5E7EB; border-radius: 4px; margin: 12px 0; overflow: hidden; }
          .progress-fill { height: 100%; background: #10B981; border-radius: 4px; transition: width 0.3s ease; }
          .footer { background: #F9FAFB; padding: 20px 30px; text-align: center; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; }
          .icon { width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px; font-size: 20px; }
          .highlight { color: #3B82F6; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">📊</div>
            <h1>${isSharing ? `${userName}'s Study Progress` : 'Your Daily Study Report'}</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">${reportData.date}</p>
          </div>
          
          <div class="content">
            ${isSharing ? `
              <p><strong>${userName}</strong> wanted to share their study progress with you. Check out their achievements!</p>
            ` : `
              <p>Here's a summary of your study activity for today. Keep up the great work!</p>
            `}
            
            <div class="stat-grid">
              <div class="stat-card">
                <div class="stat-number">${reportData.totalHours}</div>
                <div class="stat-label">Hours Studied</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${reportData.sessionsCount}</div>
                <div class="stat-label">Study Sessions</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${reportData.streak}</div>
                <div class="stat-label">Day Streak</div>
              </div>
            </div>
            
            <h3 style="color: #1F2937; margin-bottom: 16px;">Subject Breakdown</h3>
            <div class="subject-list">
              ${reportData.subjects.map(subject => `
                <div class="subject-item">
                  <div style="display: flex; align-items: center;">
                    <div class="subject-color" style="background-color: ${subject.color};"></div>
                    <span style="font-weight: 500;">${subject.name}</span>
                  </div>
                  <span class="highlight">${subject.hours}h</span>
                </div>
              `).join('')}
            </div>
            
            <h3 style="color: #1F2937; margin-bottom: 12px;">Weekly Progress</h3>
            <div style="background: #F8FAFC; border-radius: 8px; padding: 20px; border: 1px solid #E2E8F0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span style="font-weight: 500;">Weekly Goal Progress</span>
                <span class="highlight">${reportData.weeklyProgress}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(reportData.weeklyProgress, 100)}%;"></div>
              </div>
              <div style="font-size: 14px; color: #64748B; margin-top: 8px;">
                You're ${reportData.weeklyProgress >= 100 ? 'ahead of' : 'working towards'} your weekly goal of ${reportData.weeklyGoal} hours
              </div>
            </div>
            
            ${reportData.streak > 1 ? `
              <div style="background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <div style="font-size: 20px; margin-bottom: 8px;">🔥</div>
                <div style="font-size: 18px; font-weight: 600;">Amazing ${reportData.streak}-day streak!</div>
                <div style="font-size: 14px; opacity: 0.9; margin-top: 4px;">Keep the momentum going!</div>
              </div>
            ` : ''}
          </div>
          
          <div class="footer">
            ${isSharing ? `
              <p>Shared from Study Tracker by ${userName}</p>
              <p style="margin: 8px 0 0 0;"><a href="#" style="color: #3B82F6;">Join Study Tracker</a> to track your own progress!</p>
            ` : `
              <p>Keep studying and achieving your goals! 🎯</p>
              <p style="margin: 8px 0 0 0;">© 2024 Study Tracker. All rights reserved.</p>
            `}
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
    });
  }
}

export const emailService = new EmailService();
