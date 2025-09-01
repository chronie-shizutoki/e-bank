# Database Setup

## Prerequisites
- PostgreSQL installed and running
- Access to PostgreSQL with superuser privileges

## Setup Instructions

1. **Install PostgreSQL** (if not already installed):
   - Windows: Download from https://www.postgresql.org/download/windows/
   - macOS: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql postgresql-contrib`

2. **Start PostgreSQL service**:
   - Windows: Start from Services or `net start postgresql-x64-14`
   - macOS: `brew services start postgresql`
   - Linux: `sudo systemctl start postgresql`

3. **Run the initialization script**:
   ```bash
   # Connect as postgres superuser
   psql -U postgres -f database/init.sql
   ```

4. **Verify the setup**:
   ```bash
   # Connect to the wallet_app database
   psql -U wallet_user -d wallet_app -h localhost
   
   # List tables
   \dt
   
   # Check table structure
   \d wallets
   \d transactions
   ```

## Environment Configuration

Make sure your `.env` file in the server directory matches the database configuration:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=wallet_app
DB_USER=wallet_user
DB_PASSWORD=wallet_password
```

## Troubleshooting

- If you get authentication errors, check your PostgreSQL `pg_hba.conf` file
- Make sure PostgreSQL is running on the correct port (default 5432)
- Verify the user has the correct permissions