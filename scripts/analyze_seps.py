import os
import re

def analyze_separators():
    sql_file = 'e:/migration/leads-07/leads/backend/user_projects_rows.sql'
    with open(sql_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Check for ); occurrences
    seps = [m.start() for m in re.finditer(r'\);', content)]
    print(f"Total ); occurrences: {len(seps)}")
    for i, s in enumerate(seps):
        snippet = content[s-50:s+50].replace('\n', '\\n')
        print(f"Occurrence {i+1} at {s}: ...{snippet}...")
        
if __name__ == "__main__":
    analyze_separators()
