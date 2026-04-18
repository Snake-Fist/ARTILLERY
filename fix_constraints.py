with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Keydown update logic
keydown_target = """      if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          updateVal(prev => prev + e.key);
      }"""
      
keydown_new = """      if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          updateVal(prev => {
              const nextVal = prev + e.key;
              if (['gunX', 'gunY', 'tgtX', 'tgtY'].includes(activeField) && nextVal.length > 4) return prev;
              if (activeField === 'windSpeed' && parseFloat(nextVal) > 15) return '15';
              if (activeField === 'windDir' && parseFloat(nextVal) > 360) return '360';
              return nextVal;
          });
      }"""
content = content.replace(keydown_target, keydown_new)

# 2. Update Keypad update logic
keypad_target = """      } else if (val === 'NEXT') {
          const fields = ['gunX', 'gunY', 'gunElev', 'tgtX', 'tgtY', 'tgtElev', 'windSpeed', 'windDir'];
          const idx = fields.indexOf(activeField);
          if (idx !== -1) {
              setActiveField(fields[(idx + 1) % fields.length]);
          } else {
              setActiveField(null);
          }
      } else {
          updateVal(prev => prev + val);
      }"""

keypad_new = """      } else if (val === 'NEXT') {
          const fields = ['gunX', 'gunY', 'gunElev', 'tgtX', 'tgtY', 'tgtElev', 'windSpeed', 'windDir'];
          const idx = fields.indexOf(activeField);
          if (idx !== -1) {
              setActiveField(fields[(idx + 1) % fields.length]);
          } else {
              setActiveField(null);
          }
      } else {
          updateVal(prev => {
              const nextVal = prev + val;
              if (['gunX', 'gunY', 'tgtX', 'tgtY'].includes(activeField) && nextVal.length > 4) return prev;
              if (activeField === 'windSpeed' && parseFloat(nextVal) > 15) return '15';
              if (activeField === 'windDir' && parseFloat(nextVal) > 360) return '360';
              return nextVal;
          });
      }"""
content = content.replace(keypad_target, keypad_new)

# 3. Update TerminalField styling (make it left-aligned within the fixed amber box)
term_target = """<div style={{ fontSize: '14px', lineHeight: '14px', color: 'var(--term-bg)', backgroundColor: 'var(--term-fg)', fontWeight: 'bold', display: 'flex', justifyContent: 'flex-end', alignItems: 'stretch', width: '56px' }}>"""
term_new = """<div style={{ fontSize: '14px', lineHeight: '14px', color: 'var(--term-bg)', backgroundColor: 'var(--term-fg)', fontWeight: 'bold', display: 'flex', justifyContent: 'flex-start', alignItems: 'stretch', width: '60px' }}>"""
content = content.replace(term_target, term_new)

# Also ensure letterSpacing isn't causing resizing
span_target = """<span style={{ letterSpacing: '1px' }}>{val || (isActive ? '' : '-')}</span>"""
span_new = """<span style={{ letterSpacing: '2px', paddingLeft: '4px' }}>{val || (isActive ? '' : '-')}</span>"""
content = content.replace(span_target, span_new)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("done")
