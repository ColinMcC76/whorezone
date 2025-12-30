import React, { useState } from 'react';

export interface AccordionItem {
  question: string;
  answer: string;
}

interface AccordionProps {
  items: AccordionItem[];
}

// Simple accordion component used for FAQs and command lists. It toggles
// visibility of answers on click.
export default function Accordion({ items }: AccordionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="accordion">
      {items.map((item, index) => (
        <div
          key={index}
          className={`accordion-item ${activeIndex === index ? 'active' : ''}`}
        >
          <div
            className="accordion-question"
            onClick={() => toggle(index)}
          >
            <span>{item.question}</span>
            <span className="accordion-icon">+</span>
          </div>
          <div className="accordion-answer">
            <p>{item.answer}</p>
          </div>
        </div>
      ))}
    </div>
  );
}