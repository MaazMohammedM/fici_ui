import React from 'react';

// Inline policy text (do not import from file as requested)
const POLICY_TEXT = `ORDERING

To order FiCi shoes online one must shop on our website. All orders are then subject to acceptance by the Company and subject to availability of stock at the time of placement of the order. We are currently servicing orders within India and do not have international deliveries.
Payment Options: We provide safe and secure payment options and the following payment options are available to You to purchase our Products:
* Credit Card 
* Debit Card
* Net banking
* COD facility in select Cities.
All prices of the Products on the Website will be displayed in Indian Rupees. If Your payment is debited from Your account after a payment failure, it will be credited back within 7-10 business days, only after We receive a confirmation from the bank.
Once Your order is successfully placed and accepted by Us, You will receive a confirmation over email and text message from FiCi Shoes. This mail will contain all the details related to Your order. Please note that there may be certain orders that We are unable to process for reasons including but not limited to availability of stock, inaccuracies or errors in Product or pricing information, unidentifiable or invalid address etc. We reserve the right, at Our sole discretion, to refuse or cancel any order for any reason. We will contact You if all or any portion of Your order is cancelled. If Your order is cancelled after your net banking/ credit card/debit card has been charged, the said amount will be reversed back in Your account. In event the Company is unable to process Your order for any reason whatsoever, the Company is not liable to You, except to the limited extent of refund of any amount received from You towards the order. You will not be able to cancel orders that have already been processed and delivery. Cancellation of orders that have been already been delivery, is subject to the Our Returns section below. You can check your order status on https://ficishoes.com/account/login

SHIPPING AND DELIVERY

We are committed to deliver You the best of Our service and therefore endeavour to provide free shipping to most cities in India. Click here to check if Your city is eligible for free shipping! Any additional charges or levies will have to be borne by the customer. 
The approximate delivery time is 7 – 10 working days from the day of confirmation of order for online orders. Shipping and delivery time is subject to factors beyond our control including but not limited to unexpected travel delays from our courier partners and transporters due to weather conditions, strikes, public holidays, festivals, political and/or religious unrest etc. If You face any delay in receiving your shipments, please call us at Our numbers +91 8122003006, or email us at nmfinternational@gmail.com  Please note that the delivery time to You are subject to factors beyond our control including unexpected travel delays from our courier partners and transporters due to weather conditions, government instability, strikes etc. We will not be liable for any loss or expenses sustained by You arising from any delay in the delivery of the Products howsoever caused.

EXCHANGE AND RETURN POLICY

We endeavor to provide You a great shopping and customer experience every time You shop with us. If at all You are not 100% satisfied with Your purchase, You can exchange Your Products in the order in case the Product is damaged/defective or there is a size mis-match of the Product.
To return or exchange any Product sold through the Site, You are required to comply with the below mentioned conditions:
* Notify Us Within 3 Days:
Please notify FiCi Shoes of receipt of a damaged/defective Product or if you would like to exchange it for another size or another product no later than 3 days from the day you receive the product.
* Late Notifications Not Eligible:
If you are unable to notify us within 3 days of delivery, you will not be eligible for a replacement or exchange of the Product and FiCi Shoes shall not be held liable for the failure to replace the Products.
* Ways to Contact Us:
To exchange damaged, defective or wrongly delivered items, please get in touch with our customer support team by email at nmfinternational@gmail.com or phone at +91 8122003006.
In order to assess the condition of the product, we will need you to send us at least three images of the item. Our team will then guide you through the return process.
Note: Without images of the product, we cannot process a return or exchange request.

Once a return or exchange request has been successfully initiated and all necessary conditions have been met,  you have return the product to our office address.

Size Mis-match or Product Exchange:
In case of a size mis-match or if you wish to exchange the product for another size or color:
Please initiate an exchange request on our website or customer care no +91-8122003006
Customer must bear return shipping charges for exchange or refund.
The product being exchanged must be:
* The original product purchased
* In its original packaging
* With the original tags and invoice intact

MODE OF REFUND
Refunds shall be processed on receipt of the Product in its original nature/condition, subject to aforementioned terms and conditions. Refunds will be processed once the Product is received at our warehouse and subject to confirmation from Our quality personnel. In case any return/exchange request is rejected basis on physical quality check our team, the customer is not eligible for the return-refund or exchange request.The refund will be processed in the following manner.

REFUND POLICY

How can a customer get their refund?
* Refunds will be processed within 10-12 days after we receive the returned or exchanged items and have notified the customer that they are eligible for a refund request.
* All Refunds for Prepaid orders shall be done in the source account only
* All Refunds for Cash on Delivery orders shall be done in the bank account details provided at the time of placing the refund request.

Please note that we shall not be responsible for any delays in credit to the Cardholder's credit card/ debit card account as that is managed by the Cardholder's issuing bank. In case of any delay, it shall be up to the customer to take it up with their respective credit card/ debit card bank with the ficishoes.com refund process reference.

Note: Shipping or COD fees that were incurred when the order was placed are not eligible for a refund.

CANCELLATION POLICY

We make every effort to fulfill all the orders placed. However, please note that there may be certain orders that we are unable to process and must cancel.
The reasons include limitations on quantities available for purchase, inaccuracies or errors in product, pricing and stock information, or problems identified by our credit and fraud avoidance department.
If your order is cancelled after your credit card/debit card or Net Banking has been charged, the said amount will be reversed back in your respective Credit card/debit card or Net Banking Account.

Cancellation By The Customer

You can cancel an order until it has not been packed in our warehouse. We will not be able to cancel the order if it has been processed (shipped) by us. ficishoes.com has the full right to decide whether an order has been processed or not. The customer agrees not to dispute the decision made by ficishoes.com and accept ficishoes.com decision regarding the cancellation. Any amount paid will be refunded back to the same mode as was chosen by you to make the payment. In case delivery is attempted, we request you to deny acceptance if you do not wish to keep the product.`;

// Very small formatter to turn the plain text into presentable HTML
function renderPolicy(text: string) {
  const lines = text.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = () => {
    if (listBuffer.length) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc pl-6 space-y-2">
          {listBuffer.map((item, idx) => (
            <li key={idx} className="text-gray-700 dark:text-gray-300 leading-relaxed">{item}</li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushList();
      elements.push(<div key={`sp-${elements.length}`} className="h-3" />);
      continue;
    }

    // Section headings (all caps words with spaces)
    if (/^[A-Z\s&]+$/.test(line) && line.length <= 40) {
      flushList();
      elements.push(
        <h2 key={`h-${elements.length}`} className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mt-6 mb-2">
          {line}
        </h2>
      );
      continue;
    }

    // Bullet points starting with '*'
    if (line.startsWith('*')) {
      listBuffer.push(line.replace(/^\*\s*/, ''));
      continue;
    }

    // Normal paragraph
    flushList();
    elements.push(
      <p key={`p-${elements.length}`} className="text-gray-700 dark:text-gray-300 leading-relaxed">
        {line}
      </p>
    );
  }
  flushList();
  return elements;
}

const ShippingReturnsPolicy: React.FC = () => {
  return (
    <div className="bg-white dark:bg-neutral-900">
      {/* Header */}
      <section className="border-b bg-neutral-50 dark:bg-neutral-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Shipping, Returns & Refund Policy</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Clear and transparent policies for your peace of mind.</p>
        </div>
      </section>

      {/* Content */}
      <section>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 prose prose-neutral dark:prose-invert">
          {renderPolicy(POLICY_TEXT)}
        </div>
      </section>
    </div>
  );
}

export default ShippingReturnsPolicy;
