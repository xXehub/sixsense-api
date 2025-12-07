'use client';

import { useState } from 'react';
import { 
  HelpCircle, Book, MessageCircle, ExternalLink, ChevronDown, ChevronRight, 
  Search, FileText, Video, Code, Shield, Key, Users, Gamepad2
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  { id: '1', question: 'How do I generate a new license key?', answer: 'Navigate to the Keys page from the sidebar, then click the "Generate Key" button. You can select the key type (standard, premium, trial) and set an expiration date.', category: 'keys' },
  { id: '2', question: 'How do I ban a user?', answer: 'Go to the Users page, find the user you want to ban, click the action menu (three dots), and select "Ban User". You can also add a reason for the ban.', category: 'users' },
  { id: '3', question: 'How do I add a new game script?', answer: 'Navigate to the Games page and click "Add Game". Fill in the game details including name, thumbnail URL, and the game ID from Roblox.', category: 'games' },
  { id: '4', question: 'What do the different key types mean?', answer: 'Standard keys provide basic access to scripts. Premium keys unlock all features including auto-updates and priority support. Trial keys are limited to 7 days.', category: 'keys' },
  { id: '5', question: 'How do I export user data?', answer: 'On the Users page, click the "Export" button. You can choose to export as CSV or JSON format. Only administrators can export user data.', category: 'users' },
  { id: '6', question: 'How do I view activity logs?', answer: 'Go to Activity Logs from the sidebar. You can filter by type (auth, admin, system, security) and status to find specific events.', category: 'system' },
  { id: '7', question: 'How do I configure webhooks?', answer: 'Navigate to Settings > Notifications tab. Enter the Discord webhook URL and select which events trigger notifications.', category: 'system' },
  { id: '8', question: 'How do I change security settings?', answer: 'Go to Settings > Security tab. You can configure 2FA requirements, login attempts limit, and session timeout.', category: 'system' },
];

const docs = [
  { title: 'Getting Started Guide', icon: Book, description: 'Learn the basics of the admin panel' },
  { title: 'API Documentation', icon: Code, description: 'Complete API reference for developers' },
  { title: 'Security Best Practices', icon: Shield, description: 'Keep your panel secure' },
  { title: 'Video Tutorials', icon: Video, description: 'Watch step-by-step guides' },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const categories = [
    { key: 'all', label: 'All', icon: HelpCircle, count: 8 },
    { key: 'keys', label: 'License Keys', icon: Key, count: 2 },
    { key: 'users', label: 'Users', icon: Users, count: 2 },
    { key: 'games', label: 'Games', icon: Gamepad2, count: 1 },
    { key: 'system', label: 'System', icon: Shield, count: 3 },
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Help Center</h1>
          <p className="text-sm text-gray-400 mt-1">Find answers and documentation</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors">
          <MessageCircle className="h-4 w-4" />
          Contact Support
        </button>
      </div>

      {/* Stats Cards / Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {docs.map((doc, index) => {
          const colors = ['bg-blue-500', 'bg-primary', 'bg-amber-500', 'bg-purple-500'];
          return (
            <div key={doc.title} className="bg-[#111] border border-[#1a1a1a] rounded-md p-5 hover:border-[#333] transition-colors cursor-pointer">
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-md ${colors[index]}`}>
                  <doc.icon className={`h-5 w-5 ${index === 1 ? 'text-black' : 'text-white'}`} />
                </div>
                <ExternalLink className="h-4 w-4 text-gray-500" />
              </div>
              <p className="text-sm font-semibold text-white mt-4">{doc.title}</p>
              <p className="text-xs text-gray-400 mt-1">{doc.description}</p>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="bg-[#111] border border-[#1a1a1a] rounded-md">
        {/* Header */}
        <div className="p-5 border-b border-[#1a1a1a]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">Frequently Asked Questions</h2>
              <p className="text-sm text-gray-400 mt-1">Common questions and answers</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#222] rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="p-5 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === cat.key
                    ? 'bg-primary text-black'
                    : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                }`}
              >
                {cat.label}
                <span className={`ml-1.5 ${selectedCategory === cat.key ? 'text-black/70' : 'text-gray-500'}`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* FAQ List */}
        <div className="divide-y divide-[#1a1a1a]">
          {filteredFAQs.map((faq) => (
            <div key={faq.id} className="hover:bg-[#0a0a0a] transition-colors">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                className="w-full p-5 flex items-start gap-4 text-left"
              >
                <div className="p-2 rounded-md bg-blue-500/20 shrink-0">
                  <HelpCircle className="h-4 w-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{faq.question}</p>
                  {expandedFAQ === faq.id && (
                    <p className="text-sm text-gray-400 mt-3 leading-relaxed">{faq.answer}</p>
                  )}
                </div>
                <div className="shrink-0 text-gray-500">
                  {expandedFAQ === faq.id ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#1a1a1a] bg-[#0a0a0a]">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Can't find what you're looking for?
            </p>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-gray-300 text-sm font-medium rounded-md hover:text-white transition-colors">
              <MessageCircle className="h-4 w-4" />
              Ask a Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
