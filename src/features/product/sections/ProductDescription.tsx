import React from "react";

interface Props {
  description?: string;
}

const ProductDescription: React.FC<Props> = ({ description }) => {
  if (!description) return null;
  return (
    <div className="text-gray-600 dark:text-gray-400 space-y-2">
      <p>{description}</p>
    </div>
  );
};

export default ProductDescription;