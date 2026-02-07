import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is your shipping policy?",
    answer: "We offer free shipping on orders over $50. Standard shipping takes 2-5 business days. Express shipping is available for an additional fee and arrives in 1-2 business days.",
  },
  {
    question: "What is your return policy?",
    answer: "We offer a 30-day money-back guarantee. If you're not satisfied with your purchase, you can return it within 30 days for a full refund. Items must be unused and in original packaging.",
  },
  {
    question: "Is this product authentic?",
    answer: "Yes, all our products are 100% authentic and sourced directly from authorized distributors. We guarantee the quality and authenticity of every item we sell.",
  },
  {
    question: "How long does delivery take?",
    answer: "Standard delivery takes 2-5 business days within the continental US. International shipping is available and typically takes 7-14 business days depending on location.",
  },
  {
    question: "Do you offer warranties?",
    answer: "Yes, most of our products come with manufacturer warranties. The specific warranty period varies by product and is listed in the product details. We also offer extended warranty options at checkout.",
  },
];

export function ProductFAQ() {
  return (
    <div className="mt-12 max-w-3xl">
      <h3 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h3>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
