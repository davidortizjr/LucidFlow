import type { Message } from '../../../types';
import { formatRelative } from '../utils';

type MessageRowProps = {
    message: Message;
    previousMessage?: Message;
    currentUserId?: string;
    showDelivered?: boolean;
};

export function MessageRow({ message, previousMessage, currentUserId, showDelivered }: MessageRowProps) {
    const isOwnMessage = message.user?.id === currentUserId;
    const isFirstInStreak = !previousMessage || previousMessage.user?.id !== message.user?.id;
    const isSending = message._status === 'sending';
    const statusBgColor = isSending ? 'bg-primary/40' : 'bg-primary';
    const statusTextColor = isSending ? 'text-on-primary/60' : 'text-on-primary';

    return (
        <div className={`flex gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'} ${isFirstInStreak ? 'mt-4' : 'mt-1'}`}>
            {!isOwnMessage && isFirstInStreak && (
                <img
                    src={message.user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                    alt={message.user?.name || 'User'}
                    className="w-8 h-8 rounded-full object-cover"
                />
            )}
            {!isOwnMessage && !isFirstInStreak && <div className="w-8" />}

            <div className={`space-y-1 max-w-[75%] ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                {isFirstInStreak && (
                    <div className="text-xs text-on-surface-variant font-semibold">
                        {isOwnMessage ? 'You' : (message.user?.name || 'Unknown')}
                        <span className="ml-2 font-normal">{formatRelative(message.createdAt)}</span>
                    </div>
                )}
                <div className="space-y-1">
                    <div
                        className={`inline-block w-fit max-w-full p-3 rounded-lg text-sm whitespace-pre-wrap break-words transition-all duration-300 ${isOwnMessage
                            ? `${statusBgColor} ${statusTextColor}`
                            : 'bg-surface-container text-on-surface'
                            }`}
                    >
                        {message.content}
                    </div>
                    {showDelivered && isOwnMessage && message._status !== 'sending' && (
                        <p className="text-xs text-on-surface-variant dark:text-gray-500 ml-auto mr-1">Delivered</p>
                    )}
                </div>
            </div>

            {isOwnMessage && isFirstInStreak && (
                <img
                    src={message.user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                    alt={message.user?.name || 'User'}
                    className="w-8 h-8 rounded-full object-cover"
                />
            )}
            {isOwnMessage && !isFirstInStreak && <div className="w-8" />}
        </div>
    );
}
