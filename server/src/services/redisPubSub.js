import { createClient } from 'redis';

const DEFAULT_CHANNEL = 'lucidflow:messages';

export function createRedisPubSub(options = {}) {
    const channel = options.channel || process.env.REDIS_MESSAGES_CHANNEL || DEFAULT_CHANNEL;
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        return {
            enabled: false,
            async publish() { },
            async shutdown() { }
        };
    }

    const publisher = createClient({ url: redisUrl });
    const subscriber = publisher.duplicate();

    let initialized = false;
    let initializingPromise = null;

    async function ensureConnected() {
        if (initialized) {
            return;
        }

        if (!initializingPromise) {
            initializingPromise = (async () => {
                await publisher.connect();
                await subscriber.connect();
                await subscriber.subscribe(channel, async (message) => {
                    if (typeof options.onMessage === 'function') {
                        await options.onMessage(message);
                    }
                });
                initialized = true;
            })();
        }

        await initializingPromise;
    }

    return {
        enabled: true,
        async publish(payload) {
            await ensureConnected();
            await publisher.publish(channel, payload);
        },
        async shutdown() {
            try {
                if (initialized) {
                    await subscriber.unsubscribe(channel);
                }
            } catch {
            }

            await Promise.allSettled([
                subscriber.quit(),
                publisher.quit()
            ]);
        },
        ensureConnected
    };
}
