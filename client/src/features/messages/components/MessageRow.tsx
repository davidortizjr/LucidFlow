import type { Message } from '../../../types';
import { formatRelative } from '../utils';

type MessageRowProps = {
    message: Message;
    previousMessage?: Message;
    currentUserId?: string;
};

export function MessageRow({ message, previousMessage, currentUserId }: MessageRowProps) {
    const isOwnMessage = message.user?.id === currentUserId;
    const isFirstInStreak = !previousMessage || previousMessage.user?.id !== message.user?.id;

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
                <div
                    className={`inline-block w-fit max-w-full p-3 rounded-lg text-sm whitespace-pre-wrap break-words ${isOwnMessage
                        ? 'bg-primary text-on-primary ml-auto'
                        : 'bg-surface-container text-on-surface'
                        }`}
                >
                    {message.content}
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
