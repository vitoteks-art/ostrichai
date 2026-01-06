import os
import re

def analyze_sql():
    sql_file = 'e:/migration/leads-07/leads/backend/user_projects_rows_utf8.sql'
    if not os.path.exists(sql_file):
        print(f"File not found: {sql_file}")
        return
        
    with open(sql_file, 'r', encoding='utf-8') as f:
        content = f.read()
        
    print(f"Content length: {len(content)}")
    print(f"Number of INSERT INTO: {content.count('INSERT INTO')}")
    print(f"Number of semicolons: {content.count(';')}")
    
    # Try the regex from the import script
    inserts = re.findall(r"INSERT INTO .*? VALUES \((.*?)\);", content, re.DOTALL)
    print(f"Regex found {len(inserts)} matches.")
    
    if len(inserts) > 0:
        print(f"First match length: {len(inserts[0])}")
        print(f"First match snippet: {inserts[0][:100]}...")

if __name__ == "__main__":
    analyze_sql()
