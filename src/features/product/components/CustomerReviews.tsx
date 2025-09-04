import React from 'react';
import StarComponent from 'utils/StarComponent';
const CustomerReviews: React.FC = () => {
  return (
    <div className="mt-16">
      <h2 className="text-2xl font-bold text-primary dark:text-secondary mb-8 text-center">
        Voices of Elegance
      </h2>
      <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
        What Our Customers Say
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-dark2 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-lg font-semibold">JM</span>
            </div>
            <div>
              <h4 className="font-semibold text-primary dark:text-secondary">Jamica May</h4>
              <div className="flex items-center space-x-1">
                <StarComponent rating={4.5} />
                <span className="text-sm text-gray-600 dark:text-gray-400">4.5/5 Star rating</span>
              </div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            I've noticed a significant improvement in the texture and appearance of my skin since incorporating this scrub into my regimen. It's a must-have for anyone looking for glowing skin!
          </p>
        </div>

        <div className="bg-white dark:bg-dark2 p-6 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-lg font-semibold">LF</span>
            </div>
            <div>
              <h4 className="font-semibold text-primary dark:text-secondary">Lynda F.</h4>
              <div className="flex items-center space-x-1">
                <StarComponent rating={4.5} />
                <span className="text-sm text-gray-600 dark:text-gray-400">4.5/5 Star rating</span>
              </div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            I love that it's made with natural ingredients, leaving my skin feeling nourished and rejuvenated after each use. It's become a staple in my self-care routine, and I can't recommend it enough!
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerReviews; 