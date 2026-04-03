export async function getBoards(req, res, prisma) {
    try {
        const boards = await prisma.board.findMany({
            where: { projectId: req.params.projectId },
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
        res.json(boards);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export async function moveTask(req, res, prisma) {
    try {
        const {
            sourceBoardId,
            destinationBoardId,
            sourceIndex,
            destinationIndex,
            status
        } = req.body;

        const parsedDestinationIndex = Number.parseInt(String(destinationIndex), 10);
        if (!destinationBoardId || Number.isNaN(parsedDestinationIndex) || parsedDestinationIndex < 0) {
            return res.status(400).json({ error: 'destinationBoardId and valid destinationIndex are required' });
        }

        const allowedStatuses = new Set(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'ARCHIVED']);
        const safeStatus = typeof status === 'string' && allowedStatuses.has(status) ? status : undefined;

        const movedTask = await prisma.task.findUnique({
            where: { id: req.params.id },
            select: { id: true, boardId: true, position: true, status: true }
        });

        if (!movedTask) {
            return res.status(404).json({ error: 'Task not found' });
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
                    taskIds.map((taskId, index) =>
                        tx.task.update({
                            where: { id: taskId },
                            data: {
                                position: index,
                                ...(taskId === movedTask.id && safeStatus ? { status: safeStatus } : {})
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
                ...destinationIds.map((taskId, index) =>
                    tx.task.update({
                        where: { id: taskId },
                        data: {
                            boardId: destinationBoardId,
                            position: index,
                            ...(taskId === movedTask.id
                                ? { status: safeStatus || movedTask.status }
                                : {})
                        }
                    })
                )
            ]);

            // In case client sent stale sourceIndex, ensure source board has contiguous ordering.
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

        const updatedTask = await prisma.task.findUnique({
            where: { id: req.params.id },
            include: {
                assignedTo: { select: { id: true, name: true, avatar: true } },
                board: { select: { id: true, name: true } }
            }
        });

        res.json(updatedTask);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
