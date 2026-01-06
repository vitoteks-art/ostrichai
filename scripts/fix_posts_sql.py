import os
import re

def escape_row_str(row_content):
    # row_content is a string like "(val1, 'val2', ...)"
    new_row = ""
    i = 0
    in_string = False
    while i < len(row_content):
        char = row_content[i]
        if not in_string:
            if char == "'":
                # Start of string
                in_string = True
                new_row += char
            else:
                new_row += char
        else:
            # Inside string
            if char == "'":
                # It's an end of string if followed by , or ) or newline, OR if it's the very last char
                if i + 1 == len(row_content) or row_content[i+1] in [",", ")", "\n", "\r"]:
                    in_string = False
                    new_row += char
                elif i + 1 < len(row_content) and row_content[i+1] == "'":
                    # Already escaped ''
                    new_row += "''"
                    i += 1
                else:
                    # Internal unescaped single quote!
                    new_row += "''"
            else:
                new_row += char
        i += 1
    return new_row

def fix_posts_sql():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sql_file = os.path.join(base_dir, 'social_media_posts_rows.sql')
    output_file = os.path.join(base_dir, 'social_media_posts_rows_utf8.sql')
    
    print(f"Reading {sql_file} with utf-8...")
    with open(sql_file, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    
    # Replace column name
    content = content.replace('"metadata"', '"post_metadata"')
    
    print("Escaping internal single quotes...")
    
    # Find the block of values
    values_match = re.search(r"(VALUES\s*\()(.*)(\);)", content, re.DOTALL | re.IGNORECASE)
    if values_match:
        prefix = values_match.group(1)
        values_str = values_match.group(2)
        suffix = values_match.group(3)
        
        # Split by records. Records are separated by ), (
        # and possibly newlines. We use regex to split between records.
        # ), ( is the most common separator. 
        records = re.split(r"\),\s*\(", values_str)
        escaped_records = []
        for rec in records:
            # Process each record. Add back the parens for the first and last split if needed.
            # Actually, split removes the ), ( so we need to add them back in the join.
            # Each rec is "val1, 'val2', ..." 
            escaped = escape_row_str(rec)
            escaped_records.append(escaped)
        
        content = prefix + "),\n(".join(escaped_records) + suffix

    print(f"Writing {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✓ Done.")

if __name__ == "__main__":
    fix_posts_sql()
