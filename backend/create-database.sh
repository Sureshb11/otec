#!/bin/bash

# Script to create database on Azure PostgreSQL
# Usage: ./create-database.sh

echo "Creating database on Azure PostgreSQL..."

PGPASSWORD=Newnalam26 psql -h otec.postgres.database.azure.com -U clouduser@otec -d postgres -c "CREATE DATABASE otec_db;" 2>/dev/null || echo "Database might already exist or connection failed"

echo "Database creation attempt completed."
echo "Note: If the database already exists, you'll see an error which is normal."

