// File: /src/features/contact/components/ContactForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema } from './schema/contactSchema';
import type { ContactFormData } from './types/contactTypes';
import { useContactStore } from '@store/contactStore';
import emailjs from 'emailjs-com';
import { FaFacebook, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { FaX } from 'react-icons/fa6';
import { MapPin } from 'lucide-react';

const ContactForm: React.FC = () => {
  const { resetFormData } = useContactStore();
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: useContactStore.getState().formData,
  });

  const onSubmit = async (data: ContactFormData) => {
    setStatus('Submitting your message...');
    setStatusType(null);

    try {
      const result = await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          from_name: data.name,
          from_email: data.email,
          phone: data.phone,
          message: data.message,
          to_name: 'Fici Shoes',
          is_business: data.isBusiness ? 'Yes' : 'No',
        },
        import.meta.env.VITE_EMAILJS_USER_ID
      );

      if (result.text === 'OK') {
        setStatus('Your message has been sent successfully!');
        setStatusType('success');
        resetFormData();
        reset();
      } else {
        throw new Error('EmailJS response not OK');
      }
    } catch (error) {
      console.error('EmailJS error:', error);
      setStatus('Error while submitting the form. Kindly try again.');
      setStatusType('error');
    }
  };
  return (
    <main className="h-screen bg-gradient-to-br from-[color:var(--color-light1)] via-[color:var(--color-light2)] to-[color:var(--color-light3)] dark:from-[color:var(--color-dark1)] dark:via-[color:var(--color-dark2)] dark:to-[color:var(--color-dark3)]">
      <div className="container mx-auto px-4 py-4 h-full">
        {/* Header Section */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] mb-2 bg-gradient-to-r from-[color:var(--color-primary)] to-[color:var(--color-accent)] bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-sm sm:text-base text-[color:var(--color-text-secondary)] dark:text-[color:var(--color-light3)] max-w-3xl mx-auto leading-relaxed">
            We'd love to hear from you. Get in touch with us for any inquiries or support.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 max-w-6xl mx-auto h-full">
          {/* Contact Information Card */}
          <div className="bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] rounded-2xl shadow-xl p-4 border border-[color:var(--color-light3)] dark:border-[color:var(--color-dark3)] flex-1 overflow-y-auto">
            <h2 className="text-xl font-bold text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] mb-4 text-center">
              Get In Touch
            </h2>

            {/* Contact Info Grid - Compact Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* Address */}
              <div className="group">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-[color:var(--color-light2)] dark:bg-[color:var(--color-dark3)] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300">
                  <div className="flex-shrink-0">
                    <MapPin className="w-4 h-4 text-[color:var(--color-primary)] dark:text-[color:var(--color-accent)] group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] text-xs mb-1">Address</p>
                    <a
                      href="https://maps.app.goo.gl/zN1S7K3zKaLyTiCo6?g_st=awb"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[color:var(--color-text-secondary)] dark:text-[color:var(--color-light3)] hover:text-[color:var(--color-primary)] dark:hover:text-[color:var(--color-accent)] transition-colors leading-relaxed block"
                    >
                      No.20, 1st Floor, Broad Bazaar, Flower Bazaar Lane, Ambur - 635802
                    </a>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="group">
                <div className="p-3 rounded-lg bg-[color:var(--color-light2)] dark:bg-[color:var(--color-dark3)] hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-300">
                  <p className="font-semibold text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] text-xs mb-1">Phone</p>
                  <a
                    href="tel:+918122003006"
                    className="text-xs text-[color:var(--color-text-secondary)] dark:text-[color:var(--color-light3)] group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors"
                  >
                    +91 81220 03006
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="group">
                <div className="p-3 rounded-lg bg-[color:var(--color-light2)] dark:bg-[color:var(--color-dark3)] hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300">
                  <p className="font-semibold text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] text-xs mb-1">Email</p>
                  <a
                    href="mailto:nmfinternational@gmail.com"
                    className="text-xs text-[color:var(--color-text-secondary)] dark:text-[color:var(--color-light3)] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
                  >
                    nmfinternational@gmail.com
                  </a>
                </div>
              </div>

              {/* Social Media */}
              <div className="group">
                <div className="p-3 rounded-lg bg-[color:var(--color-light2)] dark:bg-[color:var(--color-dark3)] hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-300">
                  <p className="font-semibold text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] text-xs mb-2">Follow Us</p>
                  <div className="flex space-x-2">
                    <a
                      href="https://www.facebook.com/FICI-Shoes"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-[color:var(--color-primary-hover)] transition-colors"
                    >
                      <FaFacebook className="w-3 h-3" />
                    </a>
                    <a
                      href="https://x.com/ficiShoes"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-gray-800 text-white hover:bg-gray-900 transition-colors"
                    >
                      <FaX className="w-3 h-3" />
                    </a>
                    <a
                      href="https://www.instagram.com/FICI_Shoes"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                    >
                      <FaInstagram className="w-3 h-3" />
                    </a>
                    <a
                      href="https://wa.me/918122003006"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      <FaWhatsapp className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    {...register('name')}
                    placeholder="Your Name"
                    className="w-full px-3 py-2 rounded-lg border border-[color:var(--color-light3)] dark:border-[color:var(--color-dark3)] bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] placeholder-[color:var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent transition-all duration-300 text-sm"
                  />
                  {errors.name && <p className="text-xs text-[color:var(--color-error)] mt-1 italic">{errors.name.message}</p>}
                </div>

                <div>
                  <input
                    {...register('email')}
                    placeholder="Your Email"
                    type="email"
                    className="w-full px-3 py-2 rounded-lg border border-[color:var(--color-light3)] dark:border-[color:var(--color-dark3)] bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] placeholder-[color:var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent transition-all duration-300 text-sm"
                  />
                  {errors.email && <p className="text-xs text-[color:var(--color-error)] mt-1 italic">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    {...register('phone')}
                    placeholder="Your Phone"
                    className="w-full px-3 py-2 rounded-lg border border-[color:var(--color-light3)] dark:border-[color:var(--color-dark3)] bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] placeholder-[color:var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent transition-all duration-300 text-sm"
                  />
                  {errors.phone && <p className="text-xs text-[color:var(--color-error)] mt-1 italic">{errors.phone.message}</p>}
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-[color:var(--color-light2)] dark:bg-[color:var(--color-dark3)]">
                  <input
                    type="checkbox"
                    {...register('isBusiness')}
                    className="accent-[color:var(--color-primary)] size-4"
                  />
                  <label className="text-xs text-[color:var(--color-text-primary)] dark:text-[color:var(--color-light3)] font-medium">
                    Business Inquiry?
                  </label>
                </div>
              </div>

              <div>
                <textarea
                  {...register('message')}
                  placeholder="Your Message"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-[color:var(--color-light3)] dark:border-[color:var(--color-dark3)] bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] placeholder-[color:var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent transition-all duration-300 text-sm resize-none"
                />
                {errors.message && <p className="text-xs text-[color:var(--color-error)] mt-1 italic">{errors.message.message}</p>}
              </div>

              <div className="text-center">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-[color:var(--color-primary)] to-[color:var(--color-accent)] hover:from-[color:var(--color-primary-hover)] hover:to-[color:var(--color-accent-hover)] text-[color:var(--color-text-inverse)] font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm"
                >
                  Send Message
                </button>
              </div>

              {status && (
                <div className={`text-center p-3 rounded-lg ${
                  statusType === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                }`}>
                  <p className="font-medium text-sm">{status}</p>
                </div>
              )}
            </form>
          </div>

          {/* Additional Info/Branding Card */}
          <div className="bg-gradient-to-br from-[color:var(--color-primary)] to-[color:var(--color-accent)] rounded-2xl shadow-xl p-4 text-[color:var(--color-text-inverse)] flex-1 overflow-y-auto">
            <h3 className="text-lg font-bold mb-3">Why Choose FICI?</h3>
            <div className="space-y-2 text-blue-100">
              <p className="flex items-center gap-2 text-sm">
                <span className="w-1.5 h-1.5 bg-[color:var(--color-text-inverse)] rounded-full"></span>
                Premium quality footwear and accessories
              </p>
              <p className="flex items-center gap-2 text-sm">
                <span className="w-1.5 h-1.5 bg-[color:var(--color-text-inverse)] rounded-full"></span>
                Fast and reliable delivery
              </p>
              <p className="flex items-center gap-2 text-sm">
                <span className="w-1.5 h-1.5 bg-[color:var(--color-text-inverse)] rounded-full"></span>
                Excellent customer support
              </p>
              <p className="flex items-center gap-2 text-sm">
                <span className="w-1.5 h-1.5 bg-[color:var(--color-text-inverse)] rounded-full"></span>
                Secure payment options
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ContactForm;