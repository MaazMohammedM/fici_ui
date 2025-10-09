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
    <main className="min-h-screen bg-gradient-to-br from-[color:var(--color-light1)] via-[color:var(--color-light2)] to-[color:var(--color-light3)] dark:from-[color:var(--color-dark1)] dark:via-[color:var(--color-dark2)] dark:to-[color:var(--color-dark3)]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Header Section */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] mb-4 sm:mb-6 bg-gradient-to-r from-[color:var(--color-primary)] to-[color:var(--color-accent)] bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-lg sm:text-xl lg:text-2xl text-[color:var(--color-text-secondary)] dark:text-[color:var(--color-light3)] max-w-3xl mx-auto leading-relaxed">
            We'd love to hear from you. Get in touch with us for any inquiries or support.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 max-w-7xl mx-auto">
          {/* Contact Information Card */}
          <div className="bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] rounded-3xl shadow-xl p-6 sm:p-8 lg:p-10 border border-[color:var(--color-light3)] dark:border-[color:var(--color-dark3)]">
            <h2 className="text-2xl sm:text-3xl font-bold text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] mb-8 text-center">
              Get In Touch
            </h2>

            {/* Contact Info Grid - Improved 2x2 Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-8">
              {/* Address */}
              <div className="group">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-[color:var(--color-light2)] dark:bg-[color:var(--color-dark3)] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300">
                  <div className="flex-shrink-0">
                    <MapPin className="w-6 h-6 text-[color:var(--color-primary)] dark:text-[color:var(--color-accent)] group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] mb-1">Address</p>
                    <a
                      href="https://maps.app.goo.gl/zN1S7K3zKaLyTiCo6?g_st=awb"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[color:var(--color-text-secondary)] dark:text-[color:var(--color-light3)] hover:text-[color:var(--color-primary)] dark:hover:text-[color:var(--color-accent)] transition-colors leading-relaxed block"
                    >
                      No.20, 1st Floor, Broad Bazaar, Flower Bazaar Lane, Ambur - 635802 Tirupattur District Tamilnadu, India.
                    </a>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="group">
                <div className="p-4 rounded-xl bg-[color:var(--color-light2)] dark:bg-[color:var(--color-dark3)] hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-300">
                  <p className="font-semibold text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] mb-1">Phone</p>
                  <a
                    href="tel:+918122003006"
                    className="text-sm text-[color:var(--color-text-secondary)] dark:text-[color:var(--color-light3)] group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors"
                  >
                    +91 81220 03006
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="group">
                <div className="p-4 rounded-xl bg-[color:var(--color-light2)] dark:bg-[color:var(--color-dark3)] hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300">
                  <p className="font-semibold text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] mb-1">Email</p>
                  <a
                    href="mailto:nmfinternational@gmail.com"
                    className="text-sm text-[color:var(--color-text-secondary)] dark:text-[color:var(--color-light3)] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
                  >
                    nmfinternational@gmail.com
                  </a>
                </div>
              </div>

              {/* Social Media */}
              <div className="group">
                <div className="p-4 rounded-xl bg-[color:var(--color-light2)] dark:bg-[color:var(--color-dark3)] hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-300">
                  <p className="font-semibold text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] mb-3">Follow Us</p>
                  <div className="flex space-x-3">
                    <a
                      href="https://www.facebook.com/FICI-Shoes"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-blue-600 text-white hover:bg-[color:var(--color-primary-hover)] transition-colors"
                    >
                      <FaFacebook className="w-4 h-4" />
                    </a>
                    <a
                      href="https://x.com/ficiShoes"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-900 transition-colors"
                    >
                      <FaX className="w-4 h-4" />
                    </a>
                    <a
                      href="https://www.instagram.com/FICI_Shoes"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                    >
                      <FaInstagram className="w-4 h-4" />
                    </a>
                    <a
                      href="https://wa.me/918122003006"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      <FaWhatsapp className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <input
                    {...register('name')}
                    placeholder="Your Name"
                    className="w-full px-4 py-3 rounded-xl border border-[color:var(--color-light3)] dark:border-[color:var(--color-dark3)] bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] placeholder-[color:var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                  />
                  {errors.name && <p className="text-xs sm:text-sm text-[color:var(--color-error)] mt-1 italic">{errors.name.message}</p>}
                </div>

                <div>
                  <input
                    {...register('email')}
                    placeholder="Your Email"
                    type="email"
                    className="w-full px-4 py-3 rounded-xl border border-[color:var(--color-light3)] dark:border-[color:var(--color-dark3)] bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] placeholder-[color:var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                  />
                  {errors.email && <p className="text-xs sm:text-sm text-[color:var(--color-error)] mt-1 italic">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <input
                    {...register('phone')}
                    placeholder="Your Phone"
                    className="w-full px-4 py-3 rounded-xl border border-[color:var(--color-light3)] dark:border-[color:var(--color-dark3)] bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] placeholder-[color:var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                  />
                  {errors.phone && <p className="text-xs sm:text-sm text-[color:var(--color-error)] mt-1 italic">{errors.phone.message}</p>}
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-[color:var(--color-light2)] dark:bg-[color:var(--color-dark3)]">
                  <input
                    type="checkbox"
                    {...register('isBusiness')}
                    className="accent-[color:var(--color-primary)] size-5"
                  />
                  <label className="text-sm sm:text-base text-[color:var(--color-text-primary)] dark:text-[color:var(--color-light3)] font-medium">
                    Business Inquiry?
                  </label>
                </div>
              </div>

              <div>
                <textarea
                  {...register('message')}
                  placeholder="Your Message"
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-[color:var(--color-light3)] dark:border-[color:var(--color-dark3)] bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] placeholder-[color:var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent transition-all duration-300 text-sm sm:text-base resize-none"
                />
                {errors.message && <p className="text-xs sm:text-sm text-[color:var(--color-error)] mt-1 italic">{errors.message.message}</p>}
              </div>

              <div className="text-center">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[color:var(--color-primary)] to-[color:var(--color-accent)] hover:from-[color:var(--color-primary-hover)] hover:to-[color:var(--color-accent-hover)] text-[color:var(--color-text-inverse)] font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-base sm:text-lg"
                >
                  Send Message
                </button>
              </div>

              {status && (
                <div className={`text-center p-4 rounded-xl ${
                  statusType === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                }`}>
                  <p className="font-medium text-sm sm:text-base">{status}</p>
                </div>
              )}
            </form>
          </div>

          {/* Additional Info/Branding Card */}
          <div className="bg-gradient-to-br from-[color:var(--color-primary)] to-[color:var(--color-accent)] rounded-3xl shadow-xl p-6 sm:p-8 lg:p-10 text-[color:var(--color-text-inverse)]">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">Why Choose FICI?</h3>
            <div className="space-y-4 text-blue-100">
              <p className="flex items-center gap-3">
                <span className="w-2 h-2 bg-[color:var(--color-text-inverse)] rounded-full"></span>
                Premium quality footwear and accessories
              </p>
              <p className="flex items-center gap-3">
                <span className="w-2 h-2 bg-[color:var(--color-text-inverse)] rounded-full"></span>
                Fast and reliable delivery
              </p>
              <p className="flex items-center gap-3">
                <span className="w-2 h-2 bg-[color:var(--color-text-inverse)] rounded-full"></span>
                Excellent customer support
              </p>
              <p className="flex items-center gap-3">
                <span className="w-2 h-2 bg-[color:var(--color-text-inverse)] rounded-full"></span>
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