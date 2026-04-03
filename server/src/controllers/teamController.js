export async function getTeams(req, res, prisma) {
    try {
        const teams = await prisma.team.findMany({
            include: { members: { select: { id: true, name: true, avatar: true } } }
        });
        res.json(teams);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getTeamById(req, res, prisma) {
    try {
        const team = await prisma.team.findUnique({
            where: { id: req.params.id },
            include: {
                members: { select: { id: true, name: true, avatar: true, role: true, status: true } },
                projects: true,
                channels: true
            }
        });
        res.json(team);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
