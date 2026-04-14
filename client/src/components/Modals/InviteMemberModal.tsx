import { useState } from 'react';
import { BaseModal } from '../Modals';
import { FormInput } from '../Forms';
import { ErrorState } from '../States';
import { buildApiUrl } from '../../config/runtimeEndpoints';
import { useAuth } from '../../contexts/AuthContext';

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    teamId?: string;
    onInviteSent?: () => void;
}

export default function InviteMemberModal({
    isOpen,
    onClose,
    teamId = '',
    onInviteSent
}: InviteMemberModalProps) {
    const { token } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [inviteCode, setInviteCode] = useState('');
    const [invitedEmail, setInvitedEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);

        try {
            if (!teamId) {
                throw new Error('Team ID is required');
            }

            if (!email.trim()) {
                throw new Error('Email is required');
            }

            const url = await buildApiUrl(`/teams/${teamId}/invites`);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ email: email.trim().toLowerCase() })
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.message || errorBody?.error || 'Failed to send invite');
            }

            const payload = await response.json();
            const data = payload?.data || payload;

            setInviteCode(data.code);
            setInvitedEmail(data.email);
            setSuccess(true);
            setEmail('');

            if (onInviteSent) {
                onInviteSent();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send invite');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setEmail('');
        setError('');
        setSuccess(false);
        setInviteCode('');
        setInvitedEmail('');
        onClose();
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Invite Team Member"
            loading={loading}
        >
            <div className="space-y-6">
                {!success ? (
                    <>
                        <p className="text-on-surface-variant dark:text-gray-400 text-sm">
                            Send an invitation to someone to join your team. They'll receive a code to complete their signup.
                        </p>

                        {error && <ErrorState message={error} />}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <FormInput
                                label="Email Address"
                                type="email"
                                placeholder="colleague@example.com"
                                value={email}
                                onChange={setEmail}
                                disabled={loading}
                                required
                            />

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 rounded-lg bg-surface-container dark:bg-surface-container-highest text-on-surface dark:text-white transition-colors hover:bg-surface-variant disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !email.trim()}
                                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Sending...' : 'Send Invite'}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4 text-center space-y-2">
                            <div className="flex justify-center mb-2">
                                <span className="material-symbols-outlined text-5xl text-primary">check_circle</span>
                            </div>
                            <h3 className="font-semibold text-on-surface dark:text-white">Invite Sent!</h3>
                            <p className="text-sm text-on-surface-variant dark:text-gray-400">
                                Invitation sent to <span className="font-semibold">{invitedEmail}</span>
                            </p>
                        </div>

                        <div className="bg-surface-container dark:bg-surface-container-highest rounded-lg p-4 space-y-2">
                            <p className="text-xs font-semibold text-on-surface-variant dark:text-gray-400 uppercase">Invitation Code</p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 bg-background dark:bg-black/30 rounded px-3 py-2 font-mono text-sm text-on-surface dark:text-white border border-outline-variant dark:border-gray-700">
                                    {inviteCode}
                                </code>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(inviteCode);
                                    }}
                                    className="p-2 hover:bg-surface-variant dark:hover:bg-surface-container-highest rounded transition-colors"
                                    title="Copy code"
                                >
                                    <span className="material-symbols-outlined text-lg text-on-surface-variant dark:text-gray-400">content_copy</span>
                                </button>
                            </div>
                            <p className="text-xs text-on-surface-variant dark:text-gray-500 mt-2">
                                The invitation code is valid for 7 days. Share this code with the recipient if they don't receive the email.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-full px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold transition-colors hover:bg-primary/90"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </BaseModal>
    );
}
