export async function listDocumentation(prisma, summaryOnly = false) {
    return prisma.codeDocumentation.findMany(
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
}

export async function getDocumentationById(prisma, id) {
    return prisma.codeDocumentation.findUnique({
        where: { id },
        include: { createdBy: { select: { id: true, name: true, avatar: true } } }
    });
}

export async function createDocumentation(prisma, data) {
    return prisma.codeDocumentation.create({
        data,
        include: { createdBy: { select: { id: true, name: true } } }
    });
}
