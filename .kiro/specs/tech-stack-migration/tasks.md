# Implementation Plan: Tech Stack Migration

## Overview

Migrate the SAMS frontend from React + TypeScript + Tailwind + Radix UI to React + JavaScript + Tailwind CSS (no TypeScript, no Radix UI). The backend and database are untouched. All pages, features, and visual design are preserved exactly. The migration works file-by-file, replacing `.tsx`/`.ts` files with `.jsx`/`.js` equivalents and swapping every Radix UI primitive with a plain HTML + Tailwind equivalent.

## Tasks

- [x] 1. Reconfigure the project build for JavaScript
  - Remove TypeScript dev dependencies (`typescript`, `@types/*`) from `package.json`
  - Remove all `@radix-ui/*` packages from `package.json`
  - Rename `vite.config.ts` to `vite.config.js` and strip type annotations
  - Rename `src/main.tsx` to `src/main.jsx` and update `index.html` entry point reference
  - Update `vite.config.js` to point at `src/main.jsx`
  - Delete `tsconfig*.json` files if present
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Create shared UI primitive replacements (no Radix UI)
  - [x] 2.1 Implement Button, Input, Label, Textarea primitives in `src/app/components/ui/`
    - Plain `<button>`, `<input>`, `<label>`, `<textarea>` wrappers with Tailwind class merging via `clsx`
    - Preserve all existing variant/size props used across the codebase
    - _Requirements: 1.3, 8.2_

  - [x] 2.2 Implement Card, Badge, Separator primitives
    - `Card`, `CardHeader`, `CardContent`, `CardTitle` as styled `<div>` wrappers
    - `Badge` as a styled `<span>`; `Separator` as a styled `<hr>`
    - _Requirements: 1.3, 8.2_

  - [x] 2.3 Implement Table primitives
    - `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` as thin wrappers around native `<table>` elements with Tailwind classes
    - _Requirements: 1.3, 8.2_

  - [x] 2.4 Implement Select primitive (replaces Radix Select)
    - Controlled `<select>` wrapper exposing `value`, `onValueChange`, `placeholder` props
    - `SelectTrigger`, `SelectContent`, `SelectItem` sub-components that render as a styled native `<select>` + `<option>` list
    - _Requirements: 1.3, 8.2_

  - [x] 2.5 Implement Dialog primitive (replaces Radix Dialog)
    - Modal built with a `<dialog>` element or a portal `<div>` overlay + Tailwind
    - Exposes `open`, `onOpenChange`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogContent`
    - Closes on backdrop click and Escape key
    - _Requirements: 1.3, 8.2_

  - [x] 2.6 Implement AlertDialog primitive (replaces Radix AlertDialog)
    - Confirmation modal with `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogAction`, `AlertDialogCancel`
    - _Requirements: 1.3, 8.2_

  - [x] 2.7 Implement Tabs primitive (replaces Radix Tabs)
    - Controlled tab bar: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
    - Active tab tracked via local state; content panels shown/hidden with CSS
    - _Requirements: 1.3, 8.2_

  - [x] 2.8 Implement Checkbox, Avatar, Alert primitives
    - `Checkbox` as a styled `<input type="checkbox">` wrapper
    - `Avatar`, `AvatarImage`, `AvatarFallback` as `<img>` + fallback `<span>` with Tailwind
    - `Alert`, `AlertTitle`, `AlertDescription` as styled `<div>` wrappers
    - _Requirements: 1.3, 8.2_

  - [x] 2.9 Implement DropdownMenu primitive (replaces Radix DropdownMenu)
    - Toggle-based dropdown: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`
    - Closes on outside click and Escape key
    - _Requirements: 1.3, 8.2_

  - [x] 2.10 Implement toast notification utility (replaces `sonner`)
    - Lightweight `toast.success / toast.error / toast.info` using a React context + portal
    - Matches existing call sites: `toast.success(msg)`, `toast.error(msg)`, `toast.error(msg, { description })`, `toast.success(msg, { description, duration })`
    - _Requirements: 1.3, 8.2_

- [x] 3. Migrate core infrastructure files
  - [x] 3.1 Migrate `src/app/services/api.ts` to `api.js`
    - Remove TypeScript class syntax (`private`, type annotations, `ApiError` class generics)
    - Keep all methods and error-throwing behaviour identical
    - Export `ApiError` as a plain JS class extending `Error`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.3 Migrate `src/app/contexts/AuthContext.tsx` to `AuthContext.jsx`
    - Remove all TypeScript interfaces and type annotations
    - Keep `Role` as a plain JS string constant set; keep `persistUser`, `login`, `logout`, `updateUser`, `useAuth` identical
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 3.5 Migrate `src/app/contexts/DataContext.tsx` to `DataContext.jsx`
    - Remove all TypeScript interfaces, generics, and type annotations
    - Keep all normalizer functions (`normalizeStudent`, `normalizeTeacher`, `normalizeSubject`, etc.) and CRUD callbacks identical
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 3.7 Migrate `src/app/routes.tsx` to `routes.jsx`
    - Remove TypeScript; keep all route definitions and role arrays identical
    - Implement auth guard: unauthenticated redirects to `/login`; wrong role redirects to `/`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5. Migrate Layout and entry point
  - [x] 5.1 Migrate `src/app/App.tsx` to `App.jsx`
    - Remove TypeScript; wire `AuthProvider`, `DataProvider`, `RouterProvider`, and the toast `Toaster` using the new JS primitives
    - _Requirements: 8.1_

  - [x] 5.2 Migrate `src/app/components/Layout.tsx` to `Layout.jsx`
    - Replace `DropdownMenu` / `Avatar` / `Button` Radix imports with the new JS primitives from task 2
    - Keep all navigation items, role-filtering logic, mobile sidebar toggle, and Tailwind classes identical
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 6. Migrate page components
  - [x] 6.1 Migrate `LoginPage.tsx` to `LoginPage.jsx`
    - Replace Radix `Card`, `Button`, `Input`, `Label` imports with new primitives; replace `sonner` toast with new toast utility
    - Keep form logic, redirect-if-logged-in effect, and all Tailwind classes identical
    - _Requirements: 8.1, 8.2, 2.7_

  - [x] 6.2 Migrate `DashboardPage.tsx` to `DashboardPage.jsx`
    - Replace `Alert` Radix import with new primitive; keep role-switch rendering logic identical
    - _Requirements: 8.1, 8.2_

  - [x] 6.3 Migrate dashboard sub-components
    - Migrate `AdminDashboard.tsx`, `TeacherDashboard.tsx`, `StudentDashboard.tsx` to `.jsx`
    - Replace all Radix UI imports with new primitives; preserve all stat cards, charts (recharts stays), and layout
    - _Requirements: 8.1, 8.2_

  - [x] 6.4 Migrate `StudentsPage.tsx` to `StudentsPage.jsx`
    - Replace `Dialog`, `AlertDialog`, `Select`, `Table`, `Button`, `Input`, `Label`, `Card`, `Badge` Radix imports with new primitives
    - Keep all CRUD handlers, search filter, role-based access guard, and Tailwind classes identical
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 6.5 Migrate `TeachersPage.tsx` to `TeachersPage.jsx`
    - Replace all Radix imports with new primitives; keep class multi-select checkbox logic, subject assignment, homeroom selection, and all validation identical
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 6.6 Migrate `ClassesPage.tsx` to `ClassesPage.jsx`
    - Replace all Radix imports with new primitives; keep CRUD handlers, academic year select, homeroom teacher select, and table identical
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 6.7 Migrate `SubjectsPage.tsx` to `SubjectsPage.jsx`
    - Replace all Radix imports with new primitives; keep subject card grid, CRUD dialogs, department select, and validation identical
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 6.8 Migrate `MarksPage.tsx` to `MarksPage.jsx`
    - Replace all Radix imports with new primitives; keep teacher-scoped class/student/subject filtering, grade auto-calculation, marks entry form, and submit logic identical
    - _Requirements: 8.1, 8.2, 8.4_

  - [x] 6.9 Migrate `ReportsPage.tsx` to `ReportsPage.jsx`
    - Replace all Radix imports with new primitives; keep `aggregateClassReports`, `ReportCard`, PDF export (html2canvas + jspdf), print, selection modes, and all Tailwind classes identical
    - _Requirements: 8.1, 8.2, 8.5_

  - [x] 6.11 Migrate `CredentialsPage.tsx` to `CredentialsPage.jsx`
    - Replace all Radix imports with new primitives; keep generate/regenerate/copy/toggle-password logic and table layout identical
    - _Requirements: 8.1, 8.2, 8.6_

  - [x] 6.12 Migrate `ProfilePage.tsx` to `ProfilePage.jsx`
    - Replace all Radix imports (`Tabs`, `Avatar`, `Badge`, `Separator`, `Select`, `Card`, `Button`, `Input`, `Label`, `Textarea`) with new primitives
    - Keep all three profile-type branches (admin/teacher/student), form state, save handlers, and password change logic identical
    - _Requirements: 8.1, 8.2, 8.7_

  - [x] 6.13 Migrate `NotFoundPage.tsx` to `NotFoundPage.jsx`
    - Remove TypeScript; keep existing markup and Tailwind classes
    - _Requirements: 8.1, 4.5_

- [x] 8. Clean up and wire everything together
  - [x] 8.1 Delete all original `.tsx` and `.ts` source files after confirming `.jsx`/`.js` replacements are in place
    - Remove the entire `src/app/components/ui/` Radix-based files replaced in task 2
    - _Requirements: 1.1_

  - [x] 8.2 Verify `package.json` has no remaining `@radix-ui/*` or TypeScript dependencies
    - Confirm `sonner` is removed and replaced by the custom toast utility
    - _Requirements: 1.1, 1.3_

  - [x] 8.3 Run `vite build` and confirm zero TypeScript or Radix-related errors
    - Fix any remaining import paths that still reference `.tsx`/`.ts` extensions
    - _Requirements: 1.1, 1.4_

## Notes

- The backend (`backend/`) and database (`database/`) directories are never modified
- All Tailwind utility classes from the original files are carried over verbatim - visual output must be identical
- `lucide-react`, `recharts`, `react-router`, `html2canvas`, and `jspdf` are kept as-is; only Radix UI and TypeScript are removed
