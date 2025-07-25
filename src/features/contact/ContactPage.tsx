import ContactForm from './ContactForm';

const ContactPage = () => {
  return (
    <main className="flex-grow w-full px-4 py-8 bg-gradient-light dark:bg-gradient-dark">
      <div className="max-w-7xl mx-auto">
        <ContactForm />
      </div>
    </main>
  );
};

export default ContactPage;
