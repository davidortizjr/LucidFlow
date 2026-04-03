# Contributing to LucidFlow

We love your input! Here's how to contribute effectively to LucidFlow.

## Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Keep commits focused and descriptive
   - Follow the project's coding standards

3. **Test your changes**
   - Frontend: `pnpm lint` and `pnpm type-check`
   - Ensure no regressions

4. **Submit a pull request**
   - Clear description of changes
   - Reference related issues

## Code Standards

### Frontend (React/TypeScript)
- Use functional components with hooks
- Proper TypeScript typing (avoid `any`)
- Component naming: PascalCase
- File organization: one component per file

### Backend (Express)
- RESTful API design
- Proper error handling with status codes
- Input validation on all endpoints
- Meaningful variable and function names

## Commit Messages

Use clear, descriptive commit messages:
```
feat: add task drag-and-drop
fix: resolve message filtering bug
docs: update API documentation
refactor: reorganize component structure
```

## Database Changes

1. Update `prisma/schema.prisma`
2. Generate migration: `pnpm prisma migrate dev --name your_change`
3. Test thoroughly

## Questions?

Open an issue or contact the team directly.
