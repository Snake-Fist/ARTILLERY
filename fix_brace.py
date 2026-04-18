with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "          }\n\n          }\n\n          const minRPx"
replacement = "          }\n\n          const minRPx"

if target in content:
    content = content.replace(target, replacement)
    print("Fixed extra } at line 617")

# Wait, what about the calculateAzimuthAndRange?
# Was there an if (rangeCorrection) { there? No, because calculateAzimuthAndRange is pure math, rangeCorrection was only used in the component.

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

