---
trigger: always_on
---

# LedgerLens Development Guide

## Project Overview

LedgerLens is a financial ledger application with a monorepo structure. Currently, only the Angular frontend is implemented; `backend/` and `db/` directories exist but are empty placeholders for future development.

## Architecture

### Monorepo Structure

```
ledger-lens/
├── frontend/          # Angular 21 application (active)
├── backend/           # Empty - backend services (planned)
└── db/                # Empty - database layer (planned)
```

### Frontend (Angular 21)

- **Framework**: Angular (Latest version).
- **Architecture**: Use **Standalone Components** exclusively (No NgModules).
- **State Management**: Use Angular **Signals** for reactivity.
- **UI Library**: PrimeNG. Use PrimeNG components for tables, dialogs, and charts.
- **Styling**: Tailwind CSS. Use utility classes directly in HTML. Avoid creating custom CSS files unless absolutely necessary.
- **Language**: TypeScript (Strict mode).
- **Date Handling**: Use **dayjs** for all date and time manipulations. Avoid using native `Date` object directly.

### Backend (Go)

- **Language**: Go (Latest version).
- **Web Framework**: Gin.
- **Database**: PostgreSQL.
- **ORM**: GORM.
- **Migrations**: golang-migrate.
- **Architecture**: RESTful API.

## Technology Stack

### Core Framework

- **Angular 21**: Latest version with standalone component architecture
- **TypeScript 5.9**: Strict mode enabled with `noImplicitReturns` and `noFallthroughCasesInSwitch`
- **RxJS 7.8**: Included but prefer signals for state management

### Backend Stack

- **Go**: Latest stable version.
- **Gin**: Web framework for API development.
- **GORM**: ORM library for database interactions.
- **PostgreSQL**: Relational database.
- **golang-migrate**: Database migration tool.

### UI Libraries

- **PrimeNG 20.3**: Primary component library
- **TailwindCSS 4.1**: Utility-first styling (imported in `styles.css` via `@import "tailwindcss"`)
- **PrimeIcons 7.0**: Icon set

### Testing

- **Vitest 4.0**: Test runner (not Karma, despite README mentioning it)
- **jsdom 27.1**: DOM environment for tests

## Development Workflows

### Running the Application

```bash
cd frontend
npm start              # Starts dev server at http://localhost:4200
npm run watch          # Build in watch mode
npm run build          # Production build
npm test               # Run Vitest tests
```

### Code Generation

```bash
ng generate component component-name    # Generate new component
ng generate --help                      # List all available schematics
```

## Coding Conventions

### Component Structure

- **Naming**: Use `App` class name pattern (not `AppComponent`)
- **Selectors**: Use `app-` prefix (configured in `angular.json`)
- **Separation of Concerns**: Always edit the corresponding `.html` and `.css` files for UI changes. Do not use inline `template` or `styles` in the `.ts` file.
- **Signals**: Protect signal properties with `protected readonly` modifier
  ```typescript
  protected readonly title = signal('ledger-lens');
  ```

### File Naming

- Components: `app.ts`, `app.html`, `app.css` (not `app.component.ts`)
- Config files: `app.config.ts`, `app.routes.ts`

### Code Style (Prettier)

- **Print Width**: 100 characters
- **Quotes**: Single quotes for TypeScript/JavaScript
- **HTML Parser**: Uses Angular parser for HTML files (configured in `package.json`)
- Package manager: `npm@10.9.2` (specified in `packageManager` field)

### TypeScript Configuration

- **Strict Mode**: Enabled with additional checks:
  - `noImplicitOverride: true`
  - `noPropertyAccessFromIndexSignature: true`
  - `noImplicitReturns: true`
  - `noFallthroughCasesInSwitch: true`
- **Angular Compiler**: Strict templates and injection parameters enabled

## Important Notes

- **Standalone Components Only**: No NgModules - use `imports` array in `@Component` decorator
- **Global Error Handling**: `provideBrowserGlobalErrorListeners()` enabled in `app.config.ts`

## Interaction Rules

- **Language**: Always respond and explain in **Traditional Chinese (繁體中文)** unless asked otherwise.
- **Tone**: Professional, concise, and helpful.
- **Verification**: Before suggesting code, check if it aligns with the latest Angular syntax (Signals/Standalone).
