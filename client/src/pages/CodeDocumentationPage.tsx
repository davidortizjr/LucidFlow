import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDocumentationById, useDocumentationSummaries } from "../hooks/useApi";
import CreateDocumentationModal from "../components/Dashboard/CreateDocumentationModal";
import type { Doc } from "../types";

export default function CodeDocumentationPage() {
    const [searchParams] = useSearchParams();
    const { docs, loading, error, refetch } = useDocumentationSummaries();
    const typedDocs = docs as Doc[];

    const [search, setSearch] = useState("");
    const [selectedDocId, setSelectedDocId] = useState<string>("");
    const [showCreateModal, setShowCreateModal] = useState(searchParams.get("modal") === "create-documentation");

    useEffect(() => {
        if (!selectedDocId && typedDocs.length > 0) {
            setSelectedDocId(typedDocs[0].id);
        }
    }, [selectedDocId, typedDocs]);

    const { doc: selectedDocDetail, loading: docLoading, error: docError } = useDocumentationById(selectedDocId || undefined);

    const filteredDocs = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return typedDocs;
        return typedDocs.filter((doc) =>
            [doc.title, doc.category, doc.description || ""].join(" ").toLowerCase().includes(query)
        );
    }, [search, typedDocs]);

    const selectedDoc = useMemo(
        () => filteredDocs.find((doc) => doc.id === selectedDocId) || filteredDocs[0],
        [filteredDocs, selectedDocId]
    );
    const selectedDocContent = (selectedDocDetail as Doc | null)?.content || "";

    return (
        <main className="md:ml-64 pt-16 min-h-screen bg-background text-on-surface">
            <div className="px-6 pb-12 pt-8">
                <header className="mb-8 mt-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h2 className="font-manrope text-5xl font-extrabold text-on-surface tracking-tighter mb-2">Code Documentation</h2>
                            <p className="text-on-surface-variant max-w-lg leading-relaxed">
                                Browse and search through documentation for API endpoints, components, and database schemas.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-xl font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
                        >
                            <span className="material-symbols-outlined">add</span>
                            Create Documentation
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="h-[600px] rounded-2xl bg-surface-container-lowest animate-pulse" />
                        <div className="lg:col-span-3 h-[600px] rounded-2xl bg-surface-container-lowest animate-pulse" />
                    </div>
                ) : error ? (
                    <div className="bg-error-container text-on-error-container rounded-xl p-4 text-sm">{error}</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 space-y-3">
                                <div className="flex items-center gap-2 bg-surface-container dark:bg-surface-container-highest px-3 py-2 rounded-lg mb-4">
                                    <span className="material-symbols-outlined text-on-surface-variant dark:text-gray-300">search</span>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) => setSearch(event.target.value)}
                                        placeholder="Search docs..."
                                        className="flex-1 bg-transparent outline-none text-sm text-on-surface dark:text-white placeholder-on-surface-variant dark:placeholder-gray-400"
                                    />
                                </div>

                                {filteredDocs.map((doc) => {
                                    const selected = selectedDoc?.id === doc.id;
                                    return (
                                        <button
                                            key={doc.id}
                                            onClick={() => setSelectedDocId(doc.id)}
                                            className={`w-full text-left p-4 rounded-lg transition-all ${selected
                                                ? "bg-primary-fixed dark:bg-primary/30 text-primary dark:text-blue-300 ring-1 ring-primary"
                                                : "bg-surface-container-lowest dark:bg-surface-container hover:bg-surface-container dark:hover:bg-gray-700 border border-outline-variant dark:border-gray-600"
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-sm text-on-surface dark:text-white">{doc.title}</h4>
                                                    <p className={`text-xs mt-1 ${selected ? "text-primary dark:text-blue-300" : "text-on-surface-variant dark:text-gray-400"}`}>{doc.category}</p>
                                                </div>
                                                <span className={`text-lg ${selected ? "text-primary dark:text-blue-300" : "text-on-surface-variant dark:text-gray-400"}`}>
                                                    <span className="material-symbols-outlined">description</span>
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="lg:col-span-3">
                            {selectedDoc ? (
                                <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-8 border border-outline-variant dark:border-gray-600">
                                    <div className="mb-8 pb-6 border-b border-outline-variant dark:border-gray-600">
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div>
                                                <div className="inline-block px-3 py-1 bg-primary-fixed dark:bg-primary/30 text-primary dark:text-blue-300 text-xs font-semibold rounded-full mb-3">
                                                    {selectedDoc.category}
                                                </div>
                                                <h3 className="text-3xl font-extrabold font-manrope text-on-surface dark:text-white mb-2">{selectedDoc.title}</h3>
                                                <p className="text-on-surface-variant dark:text-gray-300">{selectedDoc.description || "No description provided."}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 text-sm">
                                            <div>
                                                <span className="text-on-surface-variant dark:text-gray-400">Updated </span>
                                                <span className="font-semibold text-on-surface dark:text-white">{new Date(selectedDoc.updatedAt ?? new Date()).toLocaleString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-surface-container dark:bg-gray-600 overflow-hidden">
                                                    {selectedDoc.createdBy?.avatar && <img src={selectedDoc.createdBy.avatar} className="w-full h-full object-cover" alt="author" />}
                                                </div>
                                                <span className="text-on-surface-variant dark:text-gray-400">By {selectedDoc.createdBy?.name || "Unknown"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6 text-on-surface-variant dark:text-gray-300">
                                        {docLoading ? (
                                            <div className="h-56 rounded-lg bg-surface-container dark:bg-gray-700 animate-pulse" />
                                        ) : docError ? (
                                            <div className="bg-error-container text-on-error-container rounded-lg p-4 text-sm">{docError}</div>
                                        ) : (
                                            <pre className="bg-surface-container dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap text-on-surface dark:text-gray-200">
                                                <code>{selectedDocContent}</code>
                                            </pre>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-surface-container-lowest dark:bg-surface-container rounded-2xl p-8 border border-outline-variant dark:border-gray-600 text-on-surface-variant dark:text-gray-400">
                                    No documentation found.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Create Documentation Modal */}
            {showCreateModal && (
                <CreateDocumentationModal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    onDocumentationCreated={refetch}
                />
            )}
        </main>
    );
}
