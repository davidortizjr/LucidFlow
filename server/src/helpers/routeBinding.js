export function bindPrisma(controller, prisma) {
    return (req, res) => controller(req, res, prisma);
}

export function bindPrismaWithOptions(controller, prisma, options = {}) {
    return (req, res) => controller(req, res, prisma, options);
}
