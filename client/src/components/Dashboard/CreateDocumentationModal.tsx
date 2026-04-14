import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BaseModal } from "../Modals";
import { FormInput, FormSelect, FormTextarea } from "../Forms";
import { ErrorState } from "../States";
import { buildApiUrl } from "../../config/runtimeEndpoints";

interface CreateDocumentationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDocumentationCreated?: () => void | Promise<void>;
}

const CATEGORIES = [
    { value: "API", label: "API" },
    { value: "Component", label: "Component" },
    { value: "Database", label: "Database" },
    { value: "Guide", label: "Guide" },
    { value: "Tutorial", label: "Tutorial" },
    { value: "Other", label: "Other" },
];

export default function CreateDocumentationModal({
    isOpen,
    onClose,
    onDocumentationCreated,
}: CreateDocumentationModalProps) {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("API");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setCategory("API");
        setContent("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const docsUrl = await buildApiUrl('/documentation');
            const response = await fetch(docsUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    category,
                    content,
                }),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || errorBody?.message || "Failed to create documentation");
            }

            resetForm();

            if (onDocumentationCreated) {
                await onDocumentationCreated();
            }

            navigate("/code-docs");
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Create Documentation"
            loading={loading}
        >
            <ErrorState error={error} title="Failed to create documentation" />

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <FormInput
                    label="Title"
                    value={title}
                    onChange={setTitle}
                    placeholder="e.g., User Authentication API"
                    required
                />

                <FormSelect
                    label="Category"
                    value={category}
                    onChange={setCategory}
                    options={CATEGORIES}
                />

                <FormTextarea
                    label="Description"
                    value={description}
                    onChange={setDescription}
                    placeholder="Brief description of what this documentation covers"
                    rows={2}
                />

                <FormTextarea
                    label="Content"
                    value={content}
                    onChange={setContent}
                    placeholder="Enter your documentation content here... You can use markdown formatting."
                    rows={10}
                    className="font-mono text-sm"
                    required
                />

                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-primary dark:bg-blue-600 hover:bg-primary/90 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-on-primary dark:text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin material-symbols-outlined">hourglass_empty</span>
                                Creating...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">add</span>
                                Create Documentation
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 bg-surface-container dark:bg-slate-700 hover:bg-surface-container-high dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-on-surface dark:text-slate-100 font-semibold py-2.5 rounded-lg transition"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </BaseModal>
    );
}
