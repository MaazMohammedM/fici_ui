import React, { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import emailjs from 'emailjs-com';
import Footer from '@components/Footer';

interface FormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  isBusiness: boolean;
}

interface FormErrors {
  name: string;
  email: string;
  phone: string;
  message: string;
  isBusiness: boolean;
}

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    message: '',
    isBusiness: false,
  });

  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);
  const [errors, setErrors] = useState<FormErrors>({
    name: '',
    email: '',
    phone: '',
    message: '',
    isBusiness: false,
  });

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const phoneRegex = /^[0-9]{10,15}$/;

  const validateField = (name: keyof FormData, value: string | boolean): string => {
    switch (name) {
      case 'email':
        return typeof value === 'string' && !emailRegex.test(value)
          ? 'Please enter a valid email address.'
          : '';
      case 'phone':
        return typeof value === 'string' && !phoneRegex.test(value)
          ? 'Please enter a valid phone number (10 to 15 digits).'
          : '';
      case 'name':
        return typeof value === 'string' && !value.trim()
          ? 'Name is required.'
          : '';
      case 'message':
        return typeof value === 'string' && !value.trim()
          ? 'Message is required.'
          : '';
      default:
        return '';
    }
  };

const handleChange = (
  e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
) => {
  const { name, value, type } = e.target;

  // Narrow target type for checkbox input to safely access 'checked'
  const checked = type === 'checkbox' && (e.target as HTMLInputElement).checked;

  const fieldName = name as keyof FormData;
  const newValue = type === 'checkbox' ? checked : value;

  setFormData((prevData) => ({
    ...prevData,
    [fieldName]: newValue,
  }));

  const errorMessage = validateField(fieldName, newValue);
  setErrors((prevErrors) => ({
    ...prevErrors,
    [fieldName]: errorMessage,
  }));
};


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      phone: validateField('phone', formData.phone),
      message: validateField('message', formData.message),
      isBusiness: false,
    };

    setErrors(newErrors);

    const formIsValid = Object.values(newErrors).every((error) => !error);

    if (!formIsValid) {
      setStatus('Please fix the errors before submitting.');
      setStatusType('error');
      return;
    }

    setStatus('Submitting your message...');
    setStatusType(null);

    try {
      const result = await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        {
          from_name: formData.name,
          from_email: formData.email,
          phone: formData.phone,
          message: formData.message,
          to_name: 'Fici Shoes',
          is_business: formData.isBusiness ? 'Yes' : 'No',
        },
        import.meta.env.VITE_EMAILJS_USER_ID
      );

      if (result.text === 'OK') {
        setStatus('Your message has been sent successfully!');
        setStatusType('success');
        setFormData({ name: '', email: '', phone: '', message: '', isBusiness: false });
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
    <div className="flex flex-col min-h-screen bg-gradient-to-r from-blue-50 via-green-50 to-white">
      <div className="flex-grow p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md mx-auto mb-8 mt-16">
          <h1 className="text-3xl font-semibold text-center mb-4">Contact Us</h1>

          {status && (
            <p className={`text-center mb-4 ${statusType === 'success' ? 'text-green-500' : 'text-red-500'}`}>
              {status}
            </p>
          )}

          <div className="text-center text-purple-600 mb-4 text-lg font-semibold animate-pulse">
            Are you a business? <span className="text-purple-800">Let us know!</span>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 p-2 rounded-md mt-1"
                placeholder="Enter your name"
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 p-2 rounded-md mt-1"
                placeholder="Enter your email"
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Mobile Number
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 p-2 rounded-md mt-1"
                placeholder="Enter your mobile number"
              />
              {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
            </div>

            {/* Message */}
            <div className="mb-4">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={5}
                className="w-full border border-gray-300 p-2 rounded-md mt-1"
                placeholder="Enter your message"
              ></textarea>
              {errors.message && <p className="text-red-500 text-sm">{errors.message}</p>}
            </div>

            {/* Business checkbox */}
            <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="isBusiness"
                name="isBusiness"
                checked={formData.isBusiness}
                onChange={handleChange}
                className="mr-2"
              />
              <label htmlFor="isBusiness" className="text-sm text-gray-700">
                Are you a business?
              </label>
            </div>

            {/* Submit */}
            <div className="mb-4">
              <button
                type="submit"
                className="w-full bg-purple-800 text-white p-2 rounded-md hover:bg-purple-600"
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ContactPage;