'use client';

import { useState } from 'react';
import { Container } from '../layout/Container';
import { Section, SectionHeader } from '../layout/Section';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'How do I get a key?',
    answer: 'You can get a key by clicking "Get Key" in the navigation bar. Complete the short linkvertise and you\'ll receive your key instantly. Keys are bound to your device (HWID) for security.',
  },
  {
    question: 'Is sixsense safe to use?',
    answer: 'Yes! Our scripts are designed with safety in mind. We use anti-detection methods and regularly update our scripts to minimize any risks. However, using any third-party script always carries some risk.',
  },
  {
    question: 'What games are supported?',
    answer: 'We support multiple popular Roblox games including Words Bomb, Pet Simulator X, and more. Check our Scripts page for the full list of supported games.',
  },
  {
    question: 'How do I use the script?',
    answer: 'After getting your key, open your executor (Synapse, Fluxus, etc.), paste the loader script, and execute it. Enter your key when prompted, and the script will load automatically.',
  },
  {
    question: 'My key isn\'t working, what do I do?',
    answer: 'First, make sure you\'re using the correct key and haven\'t made any typos. If you\'re on a new device, you may need a HWID reset. Join our Discord for support.',
  },
  {
    question: 'Can I transfer my key to another device?',
    answer: 'Keys are bound to your device\'s HWID. If you need to transfer to a new device, you can request a HWID reset through our Discord server. Each key has limited resets.',
  },
  {
    question: 'Is there a premium version?',
    answer: 'Yes! Premium users get instant key bypass, priority support, early access to new features, and more. Check out our Premium page for details.',
  },
  {
    question: 'The script stopped working after a game update',
    answer: 'Game updates may temporarily break scripts. Our team works quickly to push updates. Join our Discord for real-time status updates and patch announcements.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Section id="faq" className="bg-[var(--background-secondary)]">
      <Container size="md">
        <SectionHeader
          title="Frequently Asked Questions"
          subtitle="Got questions? We've got answers."
        />

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`
                rounded-[var(--radius)] border border-[var(--border)]
                overflow-hidden transition-all duration-200
                ${openIndex === i ? 'bg-[var(--background-card)]' : 'bg-[var(--background)]'}
              `}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-medium text-[var(--text)]">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`
                    w-5 h-5 text-[var(--text-muted)] transition-transform duration-200
                    ${openIndex === i ? 'rotate-180 text-[var(--primary)]' : ''}
                  `}
                />
              </button>
              <div
                className={`
                  overflow-hidden transition-all duration-200
                  ${openIndex === i ? 'max-h-96' : 'max-h-0'}
                `}
              >
                <p className="px-5 pb-5 text-[var(--text-secondary)] leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export default FAQ;
