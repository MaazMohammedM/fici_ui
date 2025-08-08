// File: /src/features/contact/components/ContactForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema } from './schema/contactSchema';
import type { ContactFormData } from './types/contactTypes';
import { useContactStore } from '@store/contactStore';
import emailjs from 'emailjs-com';

import { FiFacebook, FiInstagram, FiLinkedin } from 'react-icons/fi';
import {
  MessageCircleIcon
} from 'lucide-react';

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
    <main className="flex flex-col justify-between">
      <div className="flex flex-col justify-center items-center px-6 py-10 flex-grow">
        <div className="max-w-5xl w-full text-center mb-10">
          <h1 className="text-5xl font-secondary font-bold text-accent mb-4">Contact Us</h1>
          <p className="text-lg text-primary dark:text-gray-300 mb-8">
            We'd love to hear from you. Feel free to reach out!
          </p>

          {/* Contact Info Grid - Mobile Responsive */}
          <div className="grid grid-cols-2 md:flex md:flex-row justify-center gap-6 md:gap-12 text-left text-primary dark:text-gray-300">
            {/* First Row - Address and Phone */}
            <div className="col-span-1">
              <p className="font-semibold text-lg">Address</p>
              <p className="text-sm">4568, Flower Street<br />San Francisco, CA</p>
            </div>

            <div className="col-span-1">
              <p className="font-semibold text-lg">Phone</p>
              <p className="text-sm">+01 345 654 6542</p>
            </div>

            {/* Second Row - Email and Follow Us */}
            <div className="col-span-1">
              <p className="font-semibold text-lg">Email</p>
              <p className="text-sm">hello@fici-leather.com</p>
            </div>

            <div className="col-span-1">
              <p className="font-semibold text-lg">Follow Us</p>
              <div className="flex gap-3 mt-2">
                <a
                  href="https://www.facebook.com/FICI-Shoes"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FiFacebook className="w-4 h-4 cursor-pointer text-primary dark:text-white hover:text-accent" />
                </a>
                <a
                  href="https://www.instagram.com/FICI_Shoes"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FiInstagram className="w-4 h-4 cursor-pointer text-primary dark:text-white hover:text-accent" />
                </a>
                <a
                  href="https://wa.me/918122003006"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircleIcon className="w-4 h-4 cursor-pointer text-primary dark:text-white hover:text-accent" />
                </a>
                <a
                  href="https://www.linkedin.com/company/fici-shoes"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FiLinkedin className="w-4 h-4 cursor-pointer text-primary dark:text-white hover:text-accent" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl w-full bg-secondary dark:bg-dark2 p-10 rounded-2xl shadow-xl border border-secondary/30">
          <h2 className="text-3xl font-bold text-center mb-6 text-primary dark:text-accent">Get In Touch</h2>

          {status && (
            <p className={`text-center mb-4 font-medium ${statusType === 'success' ? 'text-green-500' : 'text-red-500'}`}>{status}</p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <input
                {...register('name')}
                placeholder="Name"
                className="w-full px-4 py-3 rounded-lg border border-secondary bg-white dark:bg-dark1 text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1 italic">{errors.name.message}</p>}
            </div>

            <div>
              <input
                {...register('email')}
                placeholder="Email"
                className="w-full px-4 py-3 rounded-lg border border-secondary bg-white dark:bg-dark1 text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1 italic">{errors.email.message}</p>}
            </div>

            <div>
              <input
                {...register('phone')}
                placeholder="Phone"
                className="w-full px-4 py-3 rounded-lg border border-secondary bg-white dark:bg-dark1 text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {errors.phone && <p className="text-xs text-red-500 mt-1 italic">{errors.phone.message}</p>}
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" {...register('isBusiness')} className="accent-accent size-5" />
              <label className="text-sm text-primary dark:text-white">Business Inquiry?</label>
            </div>

            <div className="md:col-span-2">
              <textarea
                {...register('message')}
                placeholder="Your Message"
                rows={5}
                className="w-full px-4 py-3 rounded-lg border border-secondary bg-white dark:bg-dark1 text-black dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {errors.message && <p className="text-xs text-red-500 mt-1 italic">{errors.message.message}</p>}
            </div>

            <div className="md:col-span-2 text-center">
              <button
                type="submit"
                className="px-8 py-3 bg-accent text-white font-semibold rounded-lg shadow-md hover:bg-primary-active transition"
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