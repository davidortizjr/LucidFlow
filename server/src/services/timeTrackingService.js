export async function listTimeRecords(prisma, query = {}) {
    const { userId, date } = query;
    const where = {};
    if (userId) where.userId = userId;
    if (date) where.date = new Date(date);

    return prisma.timeRecord.findMany({
        where,
        include: { user: { select: { id: true, name: true } } },
        orderBy: { date: 'desc' }
    });
}

export async function createTimeRecord(prisma, data) {
    return prisma.timeRecord.create({
        data,
        include: { user: true }
    });
}

export async function updateTimeRecord(prisma, id, data) {
    return prisma.timeRecord.update({
        where: { id },
        data,
        include: { user: true }
    });
}
