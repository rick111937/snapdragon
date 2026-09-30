with open('frontend/src/components/Sidebar.jsx', 'r', encoding='utf-8') as f:
    s = f.read()

s = s.replace('color="#00f2fe"', 'color="var(--accent-cyan)"')
s = s.replace("color: '#00f2fe'", "color: 'var(--accent-cyan)'")

with open('frontend/src/components/Sidebar.jsx', 'w', encoding='utf-8') as f:
    f.write(s)

print("Sidebar.jsx updated successfully")
