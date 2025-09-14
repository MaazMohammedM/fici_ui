import React from 'react';
import { FaWhatsapp } from "react-icons/fa";
import styles from './FloatingWhatsApp.module.css';

const FloatingWhatsApp: React.FC = () => {
  const phoneNumber = '918122003006'; // WhatsApp business number
  const message = 'Hello! I have a question about your products.';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className={styles.container}>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.whatsappButton}
        aria-label="Chat on WhatsApp"
      >
        <FaWhatsapp className={styles.icon} />
      </a>
    </div>
  );
};

export default FloatingWhatsApp;
