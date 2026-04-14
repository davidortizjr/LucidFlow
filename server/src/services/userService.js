export async function listUsers(prisma) {
    return prisma.user.findMany({
        select: { id: true, email: true, name: true, avatar: true, role: true, status: true }
    });
}

export async function getUserById(prisma, id) {
    return prisma.user.findUnique({
        where: { id },
        include: { teams: true, tasks: true }
    });
}
