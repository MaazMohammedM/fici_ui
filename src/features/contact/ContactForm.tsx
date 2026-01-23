// File: /src/features/contact/components/ContactForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema } from './schema/contactSchema';
import type { ContactFormData } from './types/contactTypes';
import { useContactStore } from '@store/contactStore';
import { EmailService } from '@utils/emailService';
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
      const result = await EmailService.sendContactForm(data);

      if (result.success) {
        setStatus('Your message has been sent successfully!');
        setStatusType('success');
        resetFormData();
        reset();
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Email service error:', error);
      setStatus('Error while submitting the form. Kindly try again.');
      setStatusType('error');
    }
  };
  return (
    <div className="min-h-full bg-gradient-to-br from-[color:var(--color-light1)] via-[color:var(--color-light2)] to-[color:var(--color-light3)] dark:from-[color:var(--color-dark1)] dark:via-[color:var(--color-dark2)] dark:to-[color:var(--color-dark3)] py-6 sm:py-8">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] mb-3 bg-gradient-to-r from-[color:var(--color-primary)] to-[color:var(--color-accent)] bg-clip-text text-transparent">
            Contact Us
          </h1>
          <p className="text-base sm:text-lg text-[color:var(--color-text-secondary)] dark:text-[color:var(--color-light3)] max-w-3xl mx-auto leading-relaxed">
            We'd love to hear from you. <br className="hidden sm:block"/>
            Get in touch with us for any inquiries or support.
          </p>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 lg:gap-8 w-full">
          {/* Left Column - Contact Form */}
          <div className="flex-1 w-full">
            <div className="bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-[color:var(--color-light3)] dark:border-[color:var(--color-dark3)]">
            <h2 className="text-xl sm:text-2xl font-bold text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] mb-6 text-center">
              Get In Touch
            </h2>

            {/* Contact Info Grid - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {/* Address */}
              <div className="group col-span-1 sm:col-span-2">
                <div className="flex flex-row items-start p-4 rounded-lg bg-[color:var(--color-light2)] dark:bg-[color:var(--color-dark3)] hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300">
                  <MapPin className="flex-shrink-0 w-5 h-5 mt-0.5 mr-3 text-[color:var(--color-primary)] dark:text-[color:var(--color-accent)] group-hover:scale-110 transition-transform duration-300" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] text-sm mb-1">Address</p>
                    <a
                      href="https://maps.app.goo.gl/zN1S7K3zKaLyTiCo6?g_st=awb"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[color:var(--color-text-secondary)] dark:text-[color:var(--color-light3)] hover:text-[color:var(--color-primary)] dark:hover:text-[color:var(--color-accent)] transition-colors leading-relaxed block"
                    >
                      No.20, 1st Floor, Broad Bazaar, <br/>Flower Bazaar Lane, Ambur - 635802<br/>
                      Tirupattur District, Tamilnadu, India.
                    </a>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="group">
                <div className="p-4 rounded-lg bg-[color:var(--color-light2)] dark:bg-[color:var(--color-dark3)] hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-300">
                  <p className="font-semibold text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] text-sm mb-1">Phone</p>
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
                <div className="p-4 rounded-lg bg-[color:var(--color-light2)] dark:bg-[color:var(--color-dark3)] hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300">
                  <p className="font-semibold text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] text-sm mb-1">Email</p>
                  <a
                    href="mailto:support@ficishoes.com"
                    className="text-sm text-[color:var(--color-text-secondary)] dark:text-[color:var(--color-light3)] group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors"
                  >
                    support@ficishoes.com
                  </a>
                </div>
              </div>

              {/* Social Media */}
              <div className="group col-span-1 sm:col-span-2">
                <div className="p-4 rounded-lg bg-[color:var(--color-light2)] dark:bg-[color:var(--color-dark3)] hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-300">
                  <p className="font-semibold text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] text-sm mb-3">Follow Us</p>
                  <div className="flex flex-wrap gap-3">
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input
                    {...register('name')}
                    placeholder="Your Name"
                    className="w-full px-4 py-3 text-base rounded-lg border border-[color:var(--color-light3)] dark:border-[color:var(--color-dark3)] bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] placeholder-[color:var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent transition-all duration-300"
                  />
                  {errors.name && <p className="text-sm text-[color:var(--color-error)] mt-1 italic">{errors.name.message}</p>}
                </div>

                <div>
                  <input
                    {...register('email')}
                    placeholder="Your Email"
                    type="email"
                    className="w-full px-4 py-3 text-base rounded-lg border border-[color:var(--color-light3)] dark:border-[color:var(--color-dark3)] bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] placeholder-[color:var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent transition-all duration-300"
                  />
                  {errors.email && <p className="text-sm text-[color:var(--color-error)] mt-1 italic">{errors.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <input
                    {...register('phone')}
                    placeholder="Your Phone"
                    className="w-full px-4 py-3 rounded-lg border border-[color:var(--color-light3)] dark:border-[color:var(--color-dark3)] bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] placeholder-[color:var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent transition-all duration-300 text-base"
                  />
                  {errors.phone && <p className="text-sm text-[color:var(--color-error)] mt-1 italic">{errors.phone.message}</p>}
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-[color:var(--color-light2)] dark:bg-[color:var(--color-dark3)]">
                  <input
                    type="checkbox"
                    {...register('isBusiness')}
                    className="accent-[color:var(--color-primary)] size-5"
                  />
                  <label className="text-sm text-[color:var(--color-text-primary)] dark:text-[color:var(--color-light3)] font-medium">
                    Business Inquiry?
                  </label>
                </div>
              </div>

              <div>
                <textarea
                  {...register('message')}
                  placeholder="Your Message"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-[color:var(--color-light3)] dark:border-[color:var(--color-dark3)] bg-[color:var(--color-light1)] dark:bg-[color:var(--color-dark2)] text-[color:var(--color-text-primary)] dark:text-[color:var(--color-text-inverse)] placeholder-[color:var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent transition-all duration-300 text-base resize-none"
                />
                {errors.message && <p className="text-sm text-[color:var(--color-error)] mt-1 italic">{errors.message.message}</p>}
              </div>

              <div className="text-center">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[color:var(--color-primary)] to-[color:var(--color-accent)] hover:from-[color:var(--color-primary-hover)] hover:to-[color:var(--color-accent-hover)] text-[color:var(--color-text-inverse)] font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-base"
                >
                  Send Message
                </button>
              </div>

              {status && (
                <div className={`text-center p-4 rounded-lg ${
                  statusType === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                }`}>
                  <p className="font-medium text-base">{status}</p>
                </div>
              )}
            </form>
          </div>
          </div>

          {/* Right Column - Why Choose FICI */}
          <div className="w-full xl:flex-1">
            <div className="bg-gradient-primary rounded-2xl shadow-lg p-6 sm:p-8 text-[color:var(--color-text-inverse)]">
            <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 font-secondary">Why Choose FICI?</h3>
            <div className="space-y-3 sm:space-y-4 text-[color:var(--color-text-inverse)]/90 text-base sm:text-lg leading-relaxed">
              <div className="flex items-start">
                <span className="flex-shrink-0 mt-2 w-2 h-2 bg-[color:var(--color-text-inverse)] rounded-full mr-3"></span>
                <span className="break-words">Premium quality footwear and accessories</span>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 mt-2 w-2 h-2 bg-[color:var(--color-text-inverse)] rounded-full mr-3"></span>
                <span className="break-words">Fast and reliable delivery</span>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 mt-2 w-2 h-2 bg-[color:var(--color-text-inverse)] rounded-full mr-3"></span>
                <span className="break-words">Excellent customer support</span>
              </div>
              <div className="flex items-start">
                <span className="flex-shrink-0 mt-2 w-2 h-2 bg-[color:var(--color-text-inverse)] rounded-full mr-3"></span>
                <span className="break-words">Secure payment options</span>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactForm;