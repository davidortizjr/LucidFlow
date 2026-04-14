import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects, useUsers } from "../../hooks/useApi";
import { BaseModal } from "../Modals";
import { FormInput, FormSelect, FormTextarea } from "../Forms";
import { ErrorState } from "../States";
import type { User } from "../../types/messages";
import type { Project } from "../../types";
import { buildApiUrl } from "../../config/runtimeEndpoints";

interface CreateTicketModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTicketCreated?: () => void | Promise<void>;
}

const PRIORITIES = [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "URGENT", label: "Urgent" },
];

const STATUSES = [
    { value: "TODO", label: "To Do" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "IN_REVIEW", label: "In Review" },
    { value: "DONE", label: "Done" },
];

export default function CreateTicketModal({
    isOpen,
    onClose,
    onTicketCreated,
}: CreateTicketModalProps) {
    const navigate = useNavigate();
    const { projects } = useProjects();
    const { users } = useUsers();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("MEDIUM");
    const [status, setStatus] = useState("TODO");
    const [dueDate, setDueDate] = useState("");
    const [projectId, setProjectId] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const projectsArray = Array.isArray(projects)
        ? projects
        : (projects as any)?.data || [];
    const typedProjects = projectsArray as Project[];
    const typedUsers = users as User[];

    useEffect(() => {
        if (projectId === "" && typedProjects.length > 0) {
            setProjectId(typedProjects[0].id);
        }
    }, [typedProjects, projectId]);

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setPriority("MEDIUM");
        setStatus("TODO");
        setDueDate("");
        setProjectId(typedProjects[0]?.id || "");
        setAssignedTo("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const tasksUrl = await buildApiUrl('/tasks');
            const response = await fetch(tasksUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    priority,
                    status,
                    dueDate: dueDate || undefined,
                    projectId,
                    assignedTo: assignedTo || undefined,
                }),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || errorBody?.message || "Failed to create ticket");
            }

            resetForm();

            if (onTicketCreated) {
                await onTicketCreated();
            }

            navigate("/boards");
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
            title="Create Ticket"
            loading={loading}
        >
            <ErrorState error={error} title="Failed to create ticket" />

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <FormInput
                    label="Ticket Title"
                    value={title}
                    onChange={setTitle}
                    placeholder="e.g., Fix login bug"
                    required
                />

                <FormTextarea
                    label="Description"
                    value={description}
                    onChange={setDescription}
                    placeholder="Ticket details..."
                    rows={4}
                />

                <FormSelect
                    label="Project"
                    value={projectId}
                    onChange={setProjectId}
                    options={typedProjects.map((p) => ({ value: p.id, label: p.name }))}
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormSelect
                        label="Priority"
                        value={priority}
                        onChange={setPriority}
                        options={PRIORITIES}
                    />

                    <FormSelect
                        label="Status"
                        value={status}
                        onChange={setStatus}
                        options={STATUSES}
                    />
                </div>

                <FormInput
                    label="Due Date"
                    value={dueDate}
                    onChange={setDueDate}
                    type="date"
                />

                <FormSelect
                    label="Assign To"
                    value={assignedTo}
                    onChange={setAssignedTo}
                    options={[
                        { value: "", label: "Unassigned" },
                        ...typedUsers.map((u) => ({ value: u.id, label: u.name })),
                    ]}
                />

                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-primary dark:bg-blue-600 hover:bg-primary/90 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-on-primary dark:text-white font-semibold py-2.5 rounded-lg transition"
                    >
                        {loading ? "Creating..." : "Create Ticket"}
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