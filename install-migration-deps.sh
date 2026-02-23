# Firebase Migration Scripts
# Add these dependencies to your main package.json or use the separate package-migration.json

npm install firebase-admin uuid
npm install --save-dev firebase-tools

# After installation, run:
# 1. ./firebase-migration.sh (deploy schema and rules)
# 2. node import-data.js (import sample data)
