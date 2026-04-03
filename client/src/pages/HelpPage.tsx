import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface FAQItem {
    id: string;
    question: string;
    answer: string;
    category: "general" | "boards" | "calendar" | "team" | "tracking" | "account";
}

const FAQ_ITEMS: FAQItem[] = [
    {
        id: "1",
        category: "general",
        question: "What is LucidFlow?",
        answer:
            "LucidFlow is a comprehensive project management and team collaboration platform designed to streamline workflows, enhance communication, and boost productivity across your organization.",
    },
    {
        id: "2",
        category: "boards",
        question: "How do I create a new ticket on the Boards?",
        answer:
            "Navigate to the Boards section and click the 'Create Ticket' button in the dashboard. Fill in the ticket details including title, description, priority, and assignee, then click Create.",
    },
    {
        id: "3",
        category: "boards",
        question: "Can I move tickets between columns?",
        answer:
            "Yes! You can drag and drop tickets between different status columns (Todo, In Progress, In Review, Done) to update their status.",
    },
    {
        id: "4",
        category: "calendar",
        question: "How do I schedule events on the Calendar?",
        answer:
            "Go to the Calendar section and click 'Create Event'. Enter the event title, description, date, time, location, and select attendees. The event will be visible to all invited team members.",
    },
    {
        id: "5",
        category: "team",
        question: "How can I message a team member?",
        answer:
            "Click on the Messages section, navigate to the Direct tab, select a team member from the list, and type your message. Your conversation history will be saved.",
    },
    {
        id: "6",
        category: "team",
        question: "How do I invite new team members?",
        answer:
            "Click the 'Invite Member' button in the sidebar. This will open an invitation dialog where you can enter the email address of the person you want to invite to your team.",
    },
    {
        id: "7",
        category: "tracking",
        question: "How do I track my time?",
        answer:
            "Go to Time Tracking section, click 'Clock In' to start tracking, and 'Clock Out' when finished. Your time entries are automatically saved and can be filtered by date range.",
    },
    {
        id: "8",
        category: "account",
        question: "How do I change my profile settings?",
        answer:
            "Navigate to Settings and you can update your profile information, notification preferences, privacy settings, and appearance options.",
    },
    {
        id: "9",
        category: "account",
        question: "How do I log out?",
        answer:
            "Click on the Logout option in the sidebar navigation. Your session will be securely ended and you'll be redirected to the login page.",
    },
    {
        id: "10",
        category: "general",
        question: "Is my data secure?",
        answer:
            "Yes, LucidFlow uses industry-standard encryption and security practices to protect your data. All communications are encrypted and your information is stored securely.",
    },
];

const CATEGORIES = [
    { value: "general", label: "General" },
    { value: "boards", label: "Boards" },
    { value: "calendar", label: "Calendar" },
    { value: "team", label: "Team" },
    { value: "tracking", label: "Time Tracking" },
    { value: "account", label: "Account" },
];

export default function HelpPage() {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState<string>("general");
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const filteredFAQ = FAQ_ITEMS.filter((item) => {
        const matchesCategory =
            selectedCategory === "all" || item.category === selectedCategory;
        const matchesSearch =
            searchQuery === "" ||
            item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const toggleExpanded = (id: string) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedItems(newExpanded);
    };

    return (
        <main className="md:ml-64 pt-16 min-h-screen bg-background text-on-surface">
            <div className="max-w-4xl mx-auto px-6 pb-12">
                {/* Header */}
                <div className="py-8">
                    <h1 className="text-4xl font-bold text-on-surface mb-2">Help & Support</h1>
                    <p className="text-on-surface-variant text-lg">
                        Find answers to common questions and learn how to use LucidFlow effectively
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <input
                        type="text"
                        placeholder="Search help topics..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-lg text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                {/* Category Filter */}
                <div className="mb-8">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setSelectedCategory("all")}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${selectedCategory === "all"
                                    ? "bg-primary text-on-primary"
                                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                                }`}
                        >
                            All Topics
                        </button>
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.value}
                                onClick={() => setSelectedCategory(cat.value)}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all ${selectedCategory === cat.value
                                        ? "bg-primary text-on-primary"
                                        : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* FAQ Items */}
                <div className="space-y-4 mb-12">
                    {filteredFAQ.length > 0 ? (
                        filteredFAQ.map((item) => (
                            <div
                                key={item.id}
                                className="bg-surface-container border border-outline-variant rounded-lg overflow-hidden transition-all"
                            >
                                <button
                                    onClick={() => toggleExpanded(item.id)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-container-high transition-colors"
                                >
                                    <span className="text-left font-semibold text-on-surface">
                                        {item.question}
                                    </span>
                                    <span
                                        className={`transition-transform transform ${expandedItems.has(item.id) ? "rotate-180" : ""
                                            }`}
                                    >
                                        <span className="material-symbols-outlined">
                                            expand_more
                                        </span>
                                    </span>
                                </button>
                                {expandedItems.has(item.id) && (
                                    <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-lowest">
                                        <p className="text-on-surface-variant leading-relaxed">
                                            {item.answer}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-on-surface-variant text-lg">
                                No results found. Try a different search or category.
                            </p>
                        </div>
                    )}
                </div>

                {/* Support Section */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-surface-container border border-outline-variant rounded-lg p-6">
                        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-primary text-2xl">
                                mail
                            </span>
                        </div>
                        <h3 className="font-bold text-on-surface mb-2">Email Support</h3>
                        <p className="text-on-surface-variant text-sm mb-4">
                            Get help from our support team
                        </p>
                        <a
                            href="mailto:support@lucidflow.com"
                            className="text-primary font-semibold hover:underline"
                        >
                            support@lucidflow.com
                        </a>
                    </div>

                    <div className="bg-surface-container border border-outline-variant rounded-lg p-6">
                        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-primary text-2xl">
                                description
                            </span>
                        </div>
                        <h3 className="font-bold text-on-surface mb-2">Documentation</h3>
                        <p className="text-on-surface-variant text-sm mb-4">
                            Read our full documentation
                        </p>
                        <button
                            onClick={() => navigate("/code-docs")}
                            className="text-primary font-semibold hover:underline"
                        >
                            View Docs
                        </button>
                    </div>

                    <div className="bg-surface-container border border-outline-variant rounded-lg p-6">
                        <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-primary text-2xl">
                                question_mark
                            </span>
                        </div>
                        <h3 className="font-bold text-on-surface mb-2">Community</h3>
                        <p className="text-on-surface-variant text-sm mb-4">
                            Ask questions and connect with users
                        </p>
                        <a
                            href="#"
                            className="text-primary font-semibold hover:underline"
                        >
                            Join Forum
                        </a>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="bg-primary-fixed border border-primary rounded-lg p-8 text-center">
                    <h2 className="text-2xl font-bold text-on-primary-fixed mb-4">
                        Need more help?
                    </h2>
                    <p className="text-on-primary-fixed-variant mb-6">
                        Check out our documentation or contact our support team
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate("/code-docs")}
                            className="px-6 py-3 bg-on-primary-fixed text-primary-fixed font-semibold rounded-lg hover:scale-[1.02] transition-transform"
                        >
                            View Documentation
                        </button>
                        <a
                            href="mailto:support@lucidflow.com"
                            className="px-6 py-3 bg-primary-container text-on-primary-container font-semibold rounded-lg hover:scale-[1.02] transition-transform inline-block"
                        >
                            Contact Support
                        </a>
                    </div>
                </div>
            </div>
        </main>
    );
}
