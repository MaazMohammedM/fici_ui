import ContactForm from './ContactForm';
import SEOHead from '@lib/components/SEOHead';

const ContactPage = () => {
  return (
    <>
      <SEOHead
        title="Contact - FICI Shoes | Get in Touch | Customer Support"
        description="Get in touch with FICI Shoes for premium leather footwear inquiries, support, and customer service. Visit our showroom in Ambur, Tamil Nadu."
        keywords="contact fici shoes, customer support, leather shoes inquiry, ambur showroom, ficishoes contact"
        url="https://ficishoes.com/contact"
      />
      <div className="flex-1 w-full">
        <h1 className="sr-only">Contact Us - FICI Shoes Customer Support</h1>
        <ContactForm />
      </div>
    </>
  );
};

export default ContactPage;