export async function getUsers(req, res, prisma) {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, name: true, avatar: true, role: true, status: true }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getUserById(req, res, prisma) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            include: { teams: true, tasks: true }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
