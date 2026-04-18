with open('src/index.css', 'a', encoding='utf-8') as f:
    f.write("\n\n@keyframes term-cursor-anim {\n  0%, 49% {\n    background-color: var(--term-bg);\n    color: var(--term-fg);\n  }\n  50%, 100% {\n    background-color: transparent;\n    color: inherit;\n  }\n}\n\n.term-cursor-animate {\n  animation: term-cursor-anim 1s step-end infinite;\n}\n")
    
print("CSS appended.")
