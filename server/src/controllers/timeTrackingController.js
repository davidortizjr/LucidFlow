export async function getTimeRecords(req, res, prisma) {
    try {
        const { userId, date } = req.query;
        const where = {};
        if (userId) where.userId = userId;
        if (date) where.date = new Date(date);

        const records = await prisma.timeRecord.findMany({
            where,
            include: { user: { select: { id: true, name: true } } },
            orderBy: { date: 'desc' }
        });
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function createTimeRecord(req, res, prisma) {
    try {
        const record = await prisma.timeRecord.create({
            data: req.body,
            include: { user: true }
        });
        res.json(record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function updateTimeRecord(req, res, prisma) {
    try {
        const record = await prisma.timeRecord.update({
            where: { id: req.params.id },
            data: req.body,
            include: { user: true }
        });
        res.json(record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
