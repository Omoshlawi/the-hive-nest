#!/bin/bash

# Colors for better visibility
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color
TICK="${GREEN}✓${NC}"
CROSS="${RED}✗${NC}"

# Navigate to root directory
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Function to count directories
count_dirs() {
    find . -name "$1" -type d | wc -l
}

# Function to clean directories with progress
clean_dirs() {
    local dir_name=$1
    local dir_count=$(count_dirs "$dir_name")
    
    if [ "$dir_count" -eq 0 ]; then
        echo -e "${BLUE}→${NC} No $dir_name directories found"
        return 0
    fi

    echo -e "${BLUE}→${NC} Cleaning $dir_count $dir_name directories..."
    find . -name "$dir_name" -type d -print -exec rm -rf {} + 2>/dev/null
    
    # Verify cleanup
    local remaining=$(count_dirs "$dir_name")
    if [ "$remaining" -eq 0 ]; then
        echo -e "$TICK Removed all $dir_name directories"
        return 0
    else
        echo -e "$CROSS Failed to remove some $dir_name directories"
        return 1
    fi
}

# Function to clean files with progress
clean_files() {
    local file_name=$1
    local file_count=$(find . -name "$file_name" -type f | wc -l)
    
    if [ "$file_count" -eq 0 ]; then
        echo -e "${BLUE}→${NC} No $file_name files found"
        return 0
    fi

    echo -e "${BLUE}→${NC} Cleaning $file_count $file_name files..."
    find . -name "$file_name" -type f -print -exec rm -f {} + 2>/dev/null
    
    # Verify cleanup
    local remaining=$(find . -name "$file_name" -type f | wc -l)
    if [ "$remaining" -eq 0 ]; then
        echo -e "$TICK Removed all $file_name files"
        return 0
    else
        echo -e "$CROSS Failed to remove some $file_name files"
        return 1
    fi
}

# Print start message
echo -e "${GREEN}Starting cleanup...${NC}"
echo "Current directory: $(pwd)"
echo

# Create array of directories and files to clean
directories=("dist" "node_modules" ".turbo" ".cache" ".next" "build" ".swc")
files=(".DS_Store" "package-lock.json" "yarn.lock" "pnpm-lock.yaml" "tsconfig.tsbuildinfo")

# Clean directories
for dir in "${directories[@]}"; do
    clean_dirs "$dir"
done

# Clean files
for file in "${files[@]}"; do
    clean_files "$file"
done

# Calculate total space freed
space_freed=$(df -h . | awk 'NR==2 {print $4}')
echo
echo -e "${GREEN}✨ Cleanup completed!${NC}"
echo -e "Available space: $space_freed"

# Optional: Add git clean for untracked files
echo
# Prompt user to clean untracked files
# This section asks the user if they want to remove files not tracked by git
# The -p flag allows showing a prompt message
# -n 1 means read only 1 character
# -r prevents backslash from being interpreted as an escape character
read -p "Do you want to clean untracked files? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # If user enters 'y' or 'Y':
    echo -e "${BLUE}→${NC} Cleaning untracked files..."
    # git clean removes untracked files:
    # -f force
    # -x remove ignored files too
    # -d remove untracked directories too
    git clean -fxd -e "*.env" -e ".env.*"
    echo -e "$TICK Untracked files removed"
fi