import ContactForm from './ContactForm';
import SEOHead from '@lib/components/SEOHead';

const ContactPage = () => {
  return (
    <>
      <SEOHead 
        title="Contact Us - FICI Shoes"
        description="Get in touch with FICI Shoes for premium leather footwear inquiries, support, and customer service. Visit our showroom in Ambur, Tamil Nadu."
        keywords="contact fici shoes, customer support, leather shoes inquiry, ambur showroom, ficishoes contact"
        url="https://ficishoes.com/contact"
      />
      <div className="flex-1 w-full">
        <ContactForm />
      </div>
    </>
  );
};

export default ContactPage;