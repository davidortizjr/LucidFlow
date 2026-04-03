export async function getDocumentation(req, res, prisma) {
    try {
        const summaryOnly = req.query.summary === 'true';

        const docs = await prisma.codeDocumentation.findMany(
            summaryOnly
                ? {
                    where: { isPublished: true },
                    select: {
                        id: true,
                        title: true,
                        category: true,
                        description: true,
                        updatedAt: true,
                        createdBy: { select: { id: true, name: true, avatar: true } }
                    },
                    orderBy: { updatedAt: 'desc' }
                }
                : {
                    where: { isPublished: true },
                    include: { createdBy: { select: { id: true, name: true, avatar: true } } },
                    orderBy: { updatedAt: 'desc' }
                }
        );
        res.json(docs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function getDocumentationById(req, res, prisma) {
    try {
        const doc = await prisma.codeDocumentation.findUnique({
            where: { id: req.params.id },
            include: { createdBy: { select: { id: true, name: true, avatar: true } } }
        });
        res.json(doc);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function createDocumentation(req, res, prisma) {
    try {
        const doc = await prisma.codeDocumentation.create({
            data: req.body,
            include: { createdBy: { select: { id: true, name: true } } }
        });
        res.json(doc);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
