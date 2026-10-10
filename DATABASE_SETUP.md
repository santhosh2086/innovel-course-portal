# Innovel database setup (Windows PowerShell)

1. Open PowerShell in the `server` folder.
2. Create the tables if needed:

   ```powershell
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d innovel -v ON_ERROR_STOP=1 -f ".\schema.sql"
   ```

   If PostgreSQL is installed in another version folder, update `18` in the path.

3. Add sample course catalogue, demo enrolments, and sample class schedule:

   ```powershell
   node seed.mjs
   ```

4. Start the backend in this terminal:

   ```powershell
   npm start
   ```

5. Open a second terminal and start the frontend:

   ```powershell
   cd ..\client
   npm run dev
   ```

6. Open the Vite URL shown in the terminal.

## Demo logins

- Student: `student@example.com` / `ChangeMe123!`
- Staff: `staff@example.com` / `ChangeMe123!`

The seed script does not overwrite a password if the account already exists. Sample class entries intentionally have no Zoom join link; they are schedule placeholders, not real meetings. Real meetings require valid Zoom Server-to-Server OAuth credentials. Payments require valid Razorpay configuration.

**Environment note:** this setup does not require editing `server/.env`. Keep your existing environment values as they are.
