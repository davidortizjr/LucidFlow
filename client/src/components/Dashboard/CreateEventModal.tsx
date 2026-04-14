import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUsers } from "../../hooks/useApi";
import { BaseModal } from "../Modals";
import { FormInput, FormTextarea } from "../Forms";
import { ErrorState } from "../States";
import type { User } from "../../types/messages";
import { buildApiUrl } from "../../config/runtimeEndpoints";

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEventCreated?: () => void | Promise<void>;
}

export default function CreateEventModal({
    isOpen,
    onClose,
    onEventCreated,
}: CreateEventModalProps) {
    const navigate = useNavigate();
    const { users } = useUsers();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [location, setLocation] = useState("");
    const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const typedUsers = users as User[];

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setStartTime("");
        setEndTime("");
        setLocation("");
        setAttendeeIds([]);
    };

    const toggleAttendee = (userId: string) => {
        setAttendeeIds((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const eventsUrl = await buildApiUrl('/calendar-events');
            const response = await fetch(eventsUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    startTime,
                    endTime,
                    location,
                    attendeeIds: attendeeIds.length > 0 ? attendeeIds : undefined,
                }),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || errorBody?.message || "Failed to create event");
            }

            resetForm();

            if (onEventCreated) {
                await onEventCreated();
            }

            navigate("/calendar");
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
            title="Create Event"
            loading={loading}
        >
            <ErrorState error={error} title="Failed to create event" />

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <FormInput
                    label="Event Title"
                    value={title}
                    onChange={setTitle}
                    placeholder="e.g., Team Meeting"
                    required
                />

                <FormTextarea
                    label="Description"
                    value={description}
                    onChange={setDescription}
                    placeholder="Event details..."
                    rows={3}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormInput
                        label="Start Time"
                        value={startTime}
                        onChange={setStartTime}
                        type="datetime-local"
                        required
                    />

                    <FormInput
                        label="End Time"
                        value={endTime}
                        onChange={setEndTime}
                        type="datetime-local"
                        required
                    />
                </div>

                <FormInput
                    label="Location"
                    value={location}
                    onChange={setLocation}
                    placeholder="e.g., Conference Room A"
                />

                <div>
                    <label className="block text-sm font-semibold text-on-surface dark:text-slate-200 mb-3">
                        Attendees
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                        {typedUsers.map((user) => (
                            <label
                                key={user.id}
                                className="flex items-center gap-2 p-2 rounded hover:bg-surface-container-low dark:hover:bg-slate-700 cursor-pointer transition"
                            >
                                <input
                                    type="checkbox"
                                    checked={attendeeIds.includes(user.id)}
                                    onChange={() => toggleAttendee(user.id)}
                                    className="w-4 h-4 text-primary dark:text-blue-400 rounded"
                                />
                                <span className="text-sm text-on-surface dark:text-slate-200">
                                    {user.name}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-primary dark:bg-blue-600 hover:bg-primary/90 dark:hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-on-primary dark:text-white font-semibold py-2.5 rounded-lg transition"
                    >
                        {loading ? "Creating..." : "Create Event"}
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