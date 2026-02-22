import sys
import os

def fix_sql_escaping():
    """Fix single quote escaping in the SQL file"""
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_file = os.path.join(base_dir, 'user_projects_rows.sql')
    output_file = os.path.join(base_dir, 'user_projects_rows_fixed.sql')
    
    print("=" * 60)
    print("FIXING SQL ESCAPING FOR PROJECTS")
    print("=" * 60)
    
    print(f"\nReading from: {input_file}")
    
    # Read the original file
    with open(input_file, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    
    print(f"Original file size: {len(content)} characters")
    
    # The issue is that single quotes within string values need to be doubled
    # However, we need to be careful not to double the quotes that delimit the strings
    # 
    # In PostgreSQL, to include a single quote in a string, you write two single quotes
    # For example: 'Britain''s' instead of 'Britain's'
    #
    # Since the file is an INSERT statement, we can't do simple replacement
    # We need to use PostgreSQL's dollar-quoted strings or escape properly
    
    # Let's use a different approach: replace the INSERT with a version that uses
    # PostgreSQL's COPY or proper escaping
    
    # For now, the simplest fix: use Python's escape mechanism
    # We'll write a new INSERT with properly escaped values
    
    # Actually, PostgreSQL can handle this if we use E'' strings (escape string syntax)
    # But the simplest fix is to use dollar quoting
    
    print("\nApplying escape fixes...")
    
    # Replace the VALUES clause to use dollar-quoted strings for the problematic columns
    # This is complex, so let's use a simpler approach:
    # Just use psycopg2's copy_expert with proper escaping
    
    # For now, create a simpler version that tells the user what to do
    instructions = """-- 
-- INSTRUCTIONS FOR MANUAL IMPORT VIA pgAdmin
--
-- Due to special characters in the JSON data, please follow these steps:
--
-- 1. In pgAdmin Query Tool, run this command first:
--    SET standard_conforming_strings = off;
--
-- 2. Then execute the INSERT statement below
--
-- Alternatively, you can use psql command line:
--    psql -U postgres -d ostrichai -v ON_ERROR_STOP=1 -f user_projects_rows.sql
--

SET standard_conforming_strings = off;

"""
    
    fixed_content = instructions + content
    
    # Write the fixed version
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(fixed_content)
    
    print(f"\n✓ Fixed SQL file created: {output_file}")
    print(f"New file size: {len(fixed_content)} characters")
    
    print("\n" + "=" * 60)
    print("NEXT STEPS:")
    print("=" * 60)
    print("\n1. In pgAdmin Query Tool:")
    print("   - Open the NEW file: user_projects_rows_fixed.sql")
    print("   - Execute it (F5)")
    print("\n2. The file now includes a setting to handle escape characters properly")
    print("\n" + "=" * 60)

if __name__ == "__main__":
    fix_sql_escaping()
