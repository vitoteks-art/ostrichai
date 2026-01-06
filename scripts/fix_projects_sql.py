import os
import re

def escape_sql_values(values_str):
    """
    State machine to correctly escape single quotes within string literals
    in a PostgreSQL VALUES clause like: ('val1', 'val2''s', ...), ('v3', ...)
    """
    new_str = ""
    in_string = False
    i = 0
    n = len(values_str)
    
    while i < n:
        char = values_str[i]
        
        if not in_string:
            if char == "'":
                in_string = True
                new_str += char
            else:
                new_str += char
        else:
            # Inside a string literal
            if char == "'":
                # Is it an end-of-string or an escaped quote?
                # In standard SQL, '' is an escaped quote.
                # In the input, if we see ' followed by , or ) or \n, it's likely end of string.
                # BUT, wait! If the input is ALREADY broken (unescaped '), we need to FIX it.
                
                is_end_of_string = False
                # Peek ahead to see if it's followed by , or ) or \s or end of content
                j = i + 1
                while j < n and values_str[j].isspace():
                    j += 1
                
                if j == n or values_str[j] in [',', ')']:
                    is_end_of_string = True
                
                if is_end_of_string:
                    # Closing quote
                    in_string = False
                    new_str += char
                else:
                    # It's an internal single quote that should have been escaped!
                    # Or it's already an escaped quote ''
                    if i + 1 < n and values_str[i+1] == "'":
                        # Already escaped, just keep it (both quotes)
                        new_str += "''"
                        i += 1 
                    else:
                        # UNESCAPED internal quote! Fix it.
                        new_str += "''"
            else:
                new_str += char
        i += 1
    return new_str

def fix_projects_sql():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_file = os.path.join(base_dir, 'user_projects_rows.sql')
    output_file = os.path.join(base_dir, 'user_projects_rows_utf8.sql')
    
    print(f"Reading {input_file}...")
    with open(input_file, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    
    # Trim garbage
    last_semicolon = content.rfind(');')
    if last_semicolon != -1:
        content = content[:last_semicolon+2]
        
    print("Escaping quotes via state machine...")
    
    # Pre-process: replace \' with '' to unify escaping style for the state machine
    content = content.replace("\\'", "''")
    
    match = re.search(r"^(.*?VALUES\s*\()(.*)(\);.*)$", content, re.DOTALL | re.IGNORECASE)
    if match:
        prefix = match.group(1)
        values_str = match.group(2)
        suffix = match.group(3)
        
        escaped_values = escape_sql_values(values_str)
        content = prefix + escaped_values + suffix
        print("✓ Successfully processed values block.")
    else:
        print("Could not find VALUES block.")

    print(f"Writing {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    # Double check record count in output
    records = re.findall(r"\s*'\s*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\s*'", content)
    print(f"Final file appears to have {len(records)} potential records (UUID matches).")
    
    print("✓ Done.")

if __name__ == "__main__":
    fix_projects_sql()
