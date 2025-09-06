import React, { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

interface Props {
  subCategory?: string;
}

const CollapsibleSections: React.FC<Props> = ({ subCategory }) => {
  const [open, setOpen] = useState<string | null>(null);

  const toggle = (section: string) =>
    setOpen(open === section ? null : section);

  const sections = [
    {
      key: "details",
      title: "Product Details",
      content:
        "Crafted with premium materials and designed for comfort. Perfect for daily wear and special occasions.",
    },
    {
      key: "care",
      title: "Care Instructions",
      content: "Hand wash recommended. Do not bleach. Iron on low heat.",
    },
    {
      key: "fit",
      title: "Fit Information",
      content: subCategory
        ? `Tailored fit suitable for ${subCategory}.`
        : "True to size. Choose your usual size.",
    },
  ];

  return (
    <div className="space-y-3">
      {sections.map(({ key, title, content }) => {
        const isOpen = open === key;
        return (
          <div
            key={key}
            className="border rounded-xl bg-white dark:bg-gray-900 shadow-sm"
          >
            <button
              onClick={() => toggle(key)}
              className="w-full flex justify-between items-center px-4 py-3 text-left text-primary dark:text-secondary font-medium"
            >
              <span className="flex items-center gap-2">
                <Info className="w-5 h-5 text-accent" />
                {title}
              </span>
              {isOpen ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            {isOpen && (
              <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400">
                {content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CollapsibleSections;