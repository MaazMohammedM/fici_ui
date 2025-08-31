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
    <main className="flex flex-col justify-between min-h-screen">
      <div className="flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 flex-grow">
        <div className="max-w-5xl w-full text-center mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-secondary font-bold text-[color:var(--color-accent)] mb-4 sm:mb-6">
            Contact Us
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-[color:var(--color-primary)] dark:text-gray-300 mb-6 sm:mb-8 px-4">
            We'd love to hear from you. Feel free to reach out!
          </p>

          {/* Contact Info Grid - Mobile Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 justify-center gap-4 sm:gap-6 lg:gap-8 lg:gap-12 text-left text-[color:var(--color-primary)] dark:text-gray-300 px-4">
            {/* First Row - Address and Phone */}
            <div className="col-span-1 sm:col-span-1">
              <p className="font-semibold text-base sm:text-lg mb-2">Address</p>
              <p className="text-sm sm:text-base">4568, Flower Street<br />San Francisco, CA</p>
            </div>

            <div className="col-span-1 sm:col-span-1">
              <p className="font-semibold text-base sm:text-lg mb-2">Phone</p>
              <p className="text-sm sm:text-base">+91 81220 03006</p>
            </div>

            {/* Second Row - Email and Follow Us */}
            <div className="col-span-1 sm:col-span-1">
              <p className="font-semibold text-base sm:text-lg mb-2">Email</p>
              <p className="text-sm sm:text-base">info@.com</p>
            </div>

            <div className="col-span-1 sm:col-span-1">
              <p className="font-semibold text-base sm:text-lg mb-2">Follow Us</p>
              <div className="flex space-x-3 sm:space-x-4">
                <a
                  href="https://www.facebook.com/FICI-Shoes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-[color:var(--color-accent)]/10 transition-colors"
                >
                  <FaFacebook className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-[color:var(--color-accent)] transition-colors" />
                </a>
                <a
                  href="https://x.com/ficiShoes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-[color:var(--color-accent)]/10 transition-colors"
                >
                  <FaX className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-[color:var(--color-accent)] transition-colors" />
                </a>
                <a
                  href="https://www.instagram.com/FICI_Shoes"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-[color:var(--color-accent)]/10 transition-colors"
                >
                  <FaInstagram className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-[color:var(--color-accent)] transition-colors" />
                </a>
                <a
                  href="https://wa.me/918122003006"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-[color:var(--color-accent)]/10 transition-colors"
                >
                  <FaWhatsapp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 hover:text-[color:var(--color-accent)] transition-colors" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl w-full bg-[color:var(--color-secondary)] dark:bg-[color:var(--color-dark2)] p-6 sm:p-8 lg:p-10 rounded-2xl shadow-xl border border-[color:var(--color-secondary)]/30">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-6 sm:mb-8 text-[color:var(--color-primary)] dark:text-[color:var(--color-accent)]">
            Get In Touch
          </h2>

          {status && (
            <p className={`text-center mb-4 sm:mb-6 font-medium text-sm sm:text-base ${
              statusType === 'success' ? 'text-green-500' : 'text-red-500'
            }`}>
              {status}
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="sm:col-span-1">
              <input
                {...register('name')}
                placeholder="Name"
                className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg border border-[color:var(--color-secondary)] bg-white dark:bg-[color:var(--color-dark1)] text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] text-sm sm:text-base"
              />
              {errors.name && <p className="text-xs sm:text-sm text-red-500 mt-1 italic">{errors.name.message}</p>}
            </div>

            <div className="sm:col-span-1">
              <input
                {...register('email')}
                placeholder="Email"
                className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg border border-[color:var(--color-secondary)] bg-white dark:bg-[color:var(--color-dark1)] text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] text-sm sm:text-base"
              />
              {errors.email && <p className="text-xs sm:text-sm text-red-500 mt-1 italic">{errors.email.message}</p>}
            </div>

            <div className="sm:col-span-1">
              <input
                {...register('phone')}
                placeholder="Phone"
                className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg border border-[color:var(--color-secondary)] bg-white dark:bg-[color:var(--color-dark1)] text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] text-sm sm:text-base"
              />
              {errors.phone && <p className="text-xs sm:text-sm text-red-500 mt-1 italic">{errors.phone.message}</p>}
            </div>

            <div className="sm:col-span-1 flex items-center gap-2 sm:gap-3">
              <input 
                type="checkbox" 
                {...register('isBusiness')} 
                className="accent-[color:var(--color-accent)] size-4 sm:size-5" 
              />
              <label className="text-sm sm:text-base text-[color:var(--color-primary)] dark:text-white">
                Business Inquiry?
              </label>
            </div>

            <div className="sm:col-span-2">
              <textarea
                {...register('message')}
                placeholder="Your Message"
                rows={5}
                className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg border border-[color:var(--color-secondary)] bg-white dark:bg-[color:var(--color-dark1)] text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] text-sm sm:text-base resize-none"
              />
              {errors.message && <p className="text-xs sm:text-sm text-red-500 mt-1 italic">{errors.message.message}</p>}
            </div>

            <div className="sm:col-span-2 text-center">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 sm:px-8 lg:px-10 py-3 sm:py-4 bg-[color:var(--color-accent)] text-white font-semibold rounded-lg shadow-md hover:bg-[color:var(--color-primary-active)] transition-all duration-200 text-sm sm:text-base lg:text-lg"
              >
                SEND REQUEST
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default ContactForm;