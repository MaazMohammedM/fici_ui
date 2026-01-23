import { supabase } from '@lib/supabase';
import type { ContactFormData } from '../features/contact/types/contactTypes';

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private static readonly SUPPORT_EMAIL = 'support@ficishoes.com';
  private static readonly EDGE_FUNCTION_NAME = 'send-email';

  /**
   * Send email via Supabase Edge Function
   */
  static async sendEmail(payload: EmailPayload): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        return { success: false, error: 'Authentication failed' };
      }

      const token = session?.access_token;
      if (!token) {
        return { success: false, error: 'No authentication token available' };
      }

      const { data, error } = await supabase.functions.invoke(this.EDGE_FUNCTION_NAME, {
        body: payload,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        return { success: false, error: error.message || 'Failed to send email' };
      }

      return { success: true };
    } catch (error) {
      console.error('Email service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      };
    }
  }

  /**
   * Send contact form email to support team
   */
  static async sendContactForm(formData: ContactFormData): Promise<{ success: boolean; error?: string }> {
    const subject = `New Contact Form Submission from ${formData.name}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; border: 1px solid #dee2e6;">
          <h2 style="color: #333; margin-bottom: 20px;">New Contact Form Submission</h2>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #555;">Name:</strong>
            <span style="color: #333; margin-left: 10px;">${formData.name}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #555;">Email:</strong>
            <span style="color: #333; margin-left: 10px;">${formData.email}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #555;">Phone:</strong>
            <span style="color: #333; margin-left: 10px;">${formData.phone}</span>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong style="color: #555;">Business Inquiry:</strong>
            <span style="color: #333; margin-left: 10px;">${formData.isBusiness ? 'Yes' : 'No'}</span>
          </div>
          
          <div style="margin-bottom: 20px;">
            <strong style="color: #555;">Message:</strong>
            <div style="color: #333; margin-top: 10px; padding: 15px; background-color: #fff; border-left: 4px solid #007bff; border-radius: 4px;">
              ${(formData.message as string).replace(/\n/g, '<br>')}
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d;">
            <p>This email was sent from the FiCi Shoes contact form.</p>
            <p>Submitted on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    `;

    const text = `
New Contact Form Submission

Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}
Business Inquiry: ${formData.isBusiness ? 'Yes' : 'No'}

Message:
${formData.message}

---
This email was sent from the FiCi Shoes contact form.
Submitted on: ${new Date().toLocaleString()}
    `;

    return this.sendEmail({
      to: this.SUPPORT_EMAIL,
      subject,
      html,
      text,
    });
  }

  /**
   * Generic email sender for other use cases
   */
  static async sendGenericEmail(
    to: string,
    subject: string,
    message: string,
    isHtml: boolean = false
  ): Promise<{ success: boolean; error?: string }> {
    if (!to) {
      return { success: false, error: 'Recipient email is required' };
    }

    return this.sendEmail({
      to,
      subject,
      html: isHtml ? message : `<p>${message}</p>`,
      text: isHtml ? this.stripHtml(message) : message,
    });
  }

  /**
   * Send email with custom template
   */
  static async sendEmailWithTemplate(
    to: string,
    subject: string,
    templateData: Record<string, any>,
    template: (data: Record<string, any>) => { html: string; text: string }
  ): Promise<{ success: boolean; error?: string }> {
    const { html, text } = template(templateData);
    
    return this.sendEmail({
      to,
      subject,
      html,
      text,
    });
  }

  /**
   * Helper method to strip HTML tags
   */
  private static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
}
