export async function getChannels(req, res, prisma) {
    try {
        const channels = await prisma.channel.findMany({
            select: {
                id: true,
                name: true,
                description: true,
                members: { select: { id: true } }
            }
        });
        res.json(channels);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getChannelById(req, res, prisma) {
    try {
        const channel = await prisma.channel.findUnique({
            where: { id: req.params.id },
            include: {
                team: true,
                members: { select: { id: true, name: true, avatar: true } },
                messages: { include: { user: true }, orderBy: { createdAt: 'desc' }, take: 50 }
            }
        });
        res.json(channel);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
