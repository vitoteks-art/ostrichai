import os
import psycopg2
import re
import json

# Database connection details
DB_CONFIG = {
    'host': 'localhost',
    'database': 'ostrichai',
    'user': 'postgres',
    'password': 'OpeOremipo@2014'
}

def import_projects_parameterized():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sql_file = os.path.join(base_dir, 'user_projects_rows.sql')
    log_file = os.path.join(base_dir, 'import_log.txt')
    
    print("=" * 60)
    print("IMPORTING PROJECTS PARAMETERIZED")
    print("=" * 60)
    
    with open(sql_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    match = re.search(r"VALUES\s*\((.*)\);", content, re.DOTALL | re.IGNORECASE)
    if not match:
        print("No VALUES block found.")
        return
        
    values_content = match.group(1)
    
    def get_records(s):
        records = []
        current = ""
        in_string = False
        i = 0
        while i < len(s):
            char = s[i]
            if not in_string:
                if char == "'":
                    in_string = True
                    current += char
                elif char == ")" and i + 1 < len(s) and s[i+1] == ",":
                    records.append(current)
                    current = ""
                    i += 2 
                    while i < len(s) and s[i] != "(":
                        i += 1
                    i += 1 
                    continue
                else:
                    current += char
            else:
                if char == "'":
                    if i + 1 < len(s) and s[i+1] == "'":
                        current += "''"
                        i += 1
                    else:
                        in_string = False
                        current += char
                else:
                    current += char
            i += 1
        if current.strip():
            records.append(current)
        return records

    records_raw = get_records(values_content)
    print(f"Found {len(records_raw)} records.")
    
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    with open(log_file, 'w', encoding='utf-8') as log_f:
        try:
            cur.execute("DELETE FROM user_projects")
            conn.commit()
            print("✓ Cleared table.")
            log_f.write("✓ Cleared table.\n")
            
            success = 0
            fail = 0
            
            for idx, raw_rec in enumerate(records_raw):
                def split_cols(s):
                    cols = []
                    current = ""
                    in_string = False
                    i = 0
                    while i < len(s):
                        char = s[i]
                        if not in_string:
                            if char == "'":
                                in_string = True
                                current += char
                            elif char == ",":
                                cols.append(current.strip())
                                current = ""
                            else:
                                current += char
                        else:
                            if char == "'":
                                if i + 1 < len(s) and s[i+1] == "'":
                                    current += "''"
                                    i += 1
                                else:
                                    in_string = False
                                    current += char
                            else:
                                current += char
                        i += 1
                    cols.append(current.strip())
                    return cols

                cols = split_cols(raw_rec)
                if len(cols) != 10:
                    msg = f"Record {idx} FAIL: Expected 10 columns, got {len(cols)}\n"
                    log_f.write(msg)
                    fail += 1
                    continue
                    
                params = []
                for col in cols:
                    if col.startswith("'") and col.endswith("'"):
                        val = col[1:-1].replace("''", "'").replace("\\'", "'")
                        params.append(val)
                    elif col.upper() == "NULL":
                        params.append(None)
                    else:
                        params.append(col)
                
                try:
                    cur.execute(
                        """
                        INSERT INTO user_projects 
                        (id, user_id, title, type, status, thumbnail_url, file_url, metadata, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        params
                    )
                    success += 1
                    if success % 10 == 0:
                        print(f"Progress: {success} imported...")
                except Exception as e:
                    msg = f"Record {idx} FAIL: {e}\n"
                    log_f.write(msg)
                    log_f.write(f"Params start: {str(params)[:200]}\n\n")
                    fail += 1
                    conn.rollback()
            
            conn.commit()
            print(f"\n✓ Completed: {success} success, {fail} failed.")
            log_f.write(f"\n✓ Completed: {success} success, {fail} failed.\n")
            
        except Exception as e:
            print(f"Critical error: {e}")
            log_f.write(f"Critical error: {e}\n")
        finally:
            cur.close()
            conn.close()

if __name__ == "__main__":
    import_projects_parameterized()
