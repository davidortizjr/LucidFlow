export async function listChannels(prisma) {
    return prisma.channel.findMany({
        select: {
            id: true,
            name: true,
            description: true,
            members: { select: { id: true } }
        }
    });
}

export async function getChannelById(prisma, channelId) {
    return prisma.channel.findUnique({
        where: { id: channelId },
        include: {
            team: true,
            members: { select: { id: true, name: true, avatar: true } },
            messages: { include: { user: true }, orderBy: { createdAt: 'desc' }, take: 50 }
        }
    });
}
