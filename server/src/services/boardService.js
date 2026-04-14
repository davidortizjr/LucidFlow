import { HttpError } from '../helpers/response.js';

const ALLOWED_STATUSES = new Set(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'ARCHIVED']);

export async function listBoardsByProject(prisma, projectId) {
    return prisma.board.findMany({
        where: { projectId },
        include: {
            tasks: {
                select: {
                    id: true,
                    title: true,
                    description: true,
                    status: true,
                    priority: true,
                    position: true,
                    dueDate: true,
                    assignedTo: { select: { id: true, name: true, avatar: true } }
                },
                orderBy: { position: 'asc' }
            }
        },
        orderBy: { position: 'asc' }
    });
}

export async function moveTaskBetweenBoards(prisma, taskId, input) {
    const {
        sourceBoardId,
        destinationBoardId,
        sourceIndex,
        destinationIndex,
        status
    } = input;

    const parsedDestinationIndex = Number.parseInt(String(destinationIndex), 10);
    if (!destinationBoardId || Number.isNaN(parsedDestinationIndex) || parsedDestinationIndex < 0) {
        throw new HttpError('destinationBoardId and valid destinationIndex are required', 400, 'VALIDATION_ERROR');
    }

    const safeStatus = typeof status === 'string' && ALLOWED_STATUSES.has(status) ? status : undefined;

    const movedTask = await prisma.task.findUnique({
        where: { id: taskId },
        select: { id: true, boardId: true, position: true, status: true }
    });

    if (!movedTask) {
        throw new HttpError('Task not found', 404, 'NOT_FOUND');
    }

    const actualSourceBoardId = sourceBoardId || movedTask.boardId;
    const parsedSourceIndex = Number.isInteger(sourceIndex) ? sourceIndex : movedTask.position;

    await prisma.$transaction(async (tx) => {
        if (actualSourceBoardId === destinationBoardId) {
            const boardTasks = await tx.task.findMany({
                where: { boardId: actualSourceBoardId },
                orderBy: { position: 'asc' },
                select: { id: true }
            });

            const taskIds = boardTasks.map((task) => task.id);
            const currentIndex = taskIds.indexOf(movedTask.id);
            if (currentIndex === -1) return;

            taskIds.splice(currentIndex, 1);
            const clampedDestination = Math.min(Math.max(parsedDestinationIndex, 0), taskIds.length);
            taskIds.splice(clampedDestination, 0, movedTask.id);

            await Promise.all(
                taskIds.map((currentTaskId, index) =>
                    tx.task.update({
                        where: { id: currentTaskId },
                        data: {
                            position: index,
                            ...(currentTaskId === movedTask.id && safeStatus ? { status: safeStatus } : {})
                        }
                    })
                )
            );
            return;
        }

        const sourceTasks = await tx.task.findMany({
            where: { boardId: actualSourceBoardId, NOT: { id: movedTask.id } },
            orderBy: { position: 'asc' },
            select: { id: true }
        });

        const destinationTasks = await tx.task.findMany({
            where: { boardId: destinationBoardId, NOT: { id: movedTask.id } },
            orderBy: { position: 'asc' },
            select: { id: true }
        });

        const destinationIds = destinationTasks.map((task) => task.id);
        const clampedDestination = Math.min(Math.max(parsedDestinationIndex, 0), destinationIds.length);
        destinationIds.splice(clampedDestination, 0, movedTask.id);

        await Promise.all([
            ...sourceTasks.map((task, index) =>
                tx.task.update({
                    where: { id: task.id },
                    data: { position: index }
                })
            ),
            ...destinationIds.map((currentTaskId, index) =>
                tx.task.update({
                    where: { id: currentTaskId },
                    data: {
                        boardId: destinationBoardId,
                        position: index,
                        ...(currentTaskId === movedTask.id
                            ? { status: safeStatus || movedTask.status }
                            : {})
                    }
                })
            )
        ]);

        if (!Number.isInteger(parsedSourceIndex) || parsedSourceIndex < 0) {
            const normalizedSource = await tx.task.findMany({
                where: { boardId: actualSourceBoardId },
                orderBy: { position: 'asc' },
                select: { id: true }
            });

            await Promise.all(
                normalizedSource.map((task, index) =>
                    tx.task.update({
                        where: { id: task.id },
                        data: { position: index }
                    })
                )
            );
        }
    });

    return prisma.task.findUnique({
        where: { id: taskId },
        include: {
            assignedTo: { select: { id: true, name: true, avatar: true } },
            board: { select: { id: true, name: true } }
        }
    });
}
