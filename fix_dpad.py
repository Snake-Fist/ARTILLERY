with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the Keydown listener to handle Tab/Space/Return
target_keydown = """      if (e.key === 'Backspace') {
          e.preventDefault();
          updateVal(prev => prev.slice(0, -1));
          return;
      }
      if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          updateVal(prev => prev + e.key);
      }
      if (e.key === '.' && ['gunElev', 'tgtElev', 'windSpeed', 'windDir'].includes(activeField)) {
          e.preventDefault();
          updateVal(prev => prev.includes('.') ? prev : prev + '.');
      }
      if (e.key === 'Enter') {
          e.preventDefault();
          setActiveField(null);
      }"""

new_keydown = """      if (e.key === 'Backspace') {
          e.preventDefault();
          updateVal(prev => prev.slice(0, -1));
          return;
      }
      if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          updateVal(prev => prev + e.key);
      }
      if (e.key === '.' && ['gunElev', 'tgtElev', 'windSpeed', 'windDir'].includes(activeField)) {
          e.preventDefault();
          updateVal(prev => prev.includes('.') ? prev : prev + '.');
      }
      if (e.key === 'Enter' || e.code === 'Space' || e.key === 'Tab') {
          e.preventDefault();
          const fields = ['gunX', 'gunY', 'gunElev', 'tgtX', 'tgtY', 'tgtElev', 'windSpeed', 'windDir'];
          const idx = fields.indexOf(activeField);
          if (idx !== -1) {
              setActiveField(fields[(idx + 1) % fields.length]);
          } else {
              setActiveField(null);
          }
      }"""

content = content.replace(target_keydown, new_keydown)


# 2. Update TerminalField for uniform fixed background
term_field_target = """                  <span style={{ fontSize: '14px', color: 'var(--term-bg)', backgroundColor: 'var(--term-fg)', fontWeight: 'bold', padding: '0 4px', textAlign: 'right', display: 'inline-block' }}>"""
term_field_new = """                  <span style={{ fontSize: '14px', color: 'var(--term-bg)', backgroundColor: 'var(--term-fg)', fontWeight: 'bold', padding: '0 4px', textAlign: 'right', display: 'inline-block', width: '56px' }}>"""

content = content.replace(term_field_target, term_field_new)


# 3. Update the DPAD and KEYPAD Layout arrays!
# We extract the whole row:
dpad_row_start = "{/* DPAD & KEYPAD ROW */}"
# It ends right before {/* TERMINAL INPUTS */}
dpad_row_end_idx = content.find("{/* TERMINAL INPUTS */}", content.find(dpad_row_start))

if dpad_row_end_idx != -1:
    old_row = content[content.find(dpad_row_start):dpad_row_end_idx]
    
    new_row = """{/* DPAD & KEYPAD ROW */}
                     {showDPad && (
                     <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                         {/* DPAD */}
                         <div className="dpad-item">
                             <div style={{ fontSize: '10px', textAlign: 'center', marginBottom: '4px', textTransform: 'uppercase' }}>{dpadMode === 'PAN' && zoomMode === 'OFF' ? 'N/A' : dpadMode}</div>
                             <div className="dpad-grid" style={{ gridTemplateColumns: 'repeat(3, 26px)', gridTemplateRows: 'repeat(5, 26px)', gap: '2px' }}>
                                 <div />
                                 <RepeatButton className="dpad-btn" onClick={() => { if (dpadMode === 'GUN') handleGridAdjust('gun', 'N'); else if (dpadMode === 'TGT') handleGridAdjust('tgt', 'N'); else if (dpadMode === 'ADJUST') handleAdjust('N'); else if (dpadMode === 'PAN') handlePan('N'); }}>▲</RepeatButton>
                                 <div />
                                 <RepeatButton className="dpad-btn" onClick={() => { if (dpadMode === 'GUN') handleGridAdjust('gun', 'W'); else if (dpadMode === 'TGT') handleGridAdjust('tgt', 'W'); else if (dpadMode === 'ADJUST') handleAdjust('W'); else if (dpadMode === 'PAN') handlePan('W'); }}>◀</RepeatButton>
                                 {dpadMode === 'ADJUST' ? <button onClick={handleResetAdjust} className="dpad-btn dpad-btn-reset" style={{ marginTop: 0 }}>⨯</button> : <div />}
                                 <RepeatButton className="dpad-btn" onClick={() => { if (dpadMode === 'GUN') handleGridAdjust('gun', 'E'); else if (dpadMode === 'TGT') handleGridAdjust('tgt', 'E'); else if (dpadMode === 'ADJUST') handleAdjust('E'); else if (dpadMode === 'PAN') handlePan('E'); }}>▶</RepeatButton>
                                 <div />
                                 <RepeatButton className="dpad-btn" onClick={() => { if (dpadMode === 'GUN') handleGridAdjust('gun', 'S'); else if (dpadMode === 'TGT') handleGridAdjust('tgt', 'S'); else if (dpadMode === 'ADJUST') handleAdjust('S'); else if (dpadMode === 'PAN') handlePan('S'); }}>▼</RepeatButton>
                                 <div />
                                 <div />
                                 <div />
                                 <div />
                                 <button className="dpad-btn" style={{ gridColumn: '1 / -1', fontSize: '10px', borderStyle: 'solid' }} onClick={() => { if (dpadMode === 'TGT') setDpadMode('GUN'); else if (dpadMode === 'GUN') setDpadMode('ADJUST'); else if (dpadMode === 'ADJUST') setDpadMode('PAN'); else setDpadMode('TGT'); }}>MODE</button>
                             </div>
                         </div>
                         
                         {/* KEYPAD */}
                         <div className="dpad-item">
                             <div style={{ fontSize: '10px', textAlign: 'center', marginBottom: '4px' }}>KEYPAD</div>
                             <div className="dpad-grid" style={{ gridTemplateColumns: 'repeat(3, 26px)', gridTemplateRows: 'repeat(5, 26px)', gap: '2px' }}>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '14px'}} onClick={() => handleKeypadPress('7')}>7</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '14px'}} onClick={() => handleKeypadPress('8')}>8</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '14px'}} onClick={() => handleKeypadPress('9')}>9</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '14px'}} onClick={() => handleKeypadPress('4')}>4</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '14px'}} onClick={() => handleKeypadPress('5')}>5</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '14px'}} onClick={() => handleKeypadPress('6')}>6</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '14px'}} onClick={() => handleKeypadPress('1')}>1</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '14px'}} onClick={() => handleKeypadPress('2')}>2</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '14px'}} onClick={() => handleKeypadPress('3')}>3</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '14px'}} onClick={() => handleKeypadPress('.')}>.</RepeatButton>
                                 <RepeatButton className="dpad-btn" style={{fontSize: '14px'}} onClick={() => handleKeypadPress('0')}>0</RepeatButton>
                                 <button className="dpad-btn dpad-btn-reset" style={{fontSize: '10px', borderStyle: 'solid'}} onClick={() => handleKeypadPress('DEL')}>DEL</button>
                                 <button className="dpad-btn" style={{ gridColumn: '1 / -1', fontSize: '14px', borderStyle: 'solid', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => handleKeypadPress('NEXT')}>▶</button>
                             </div>
                         </div>
                     </div>
                     )}

                     """
    content = content.replace(old_row, new_row)
else:
    print("Error: dpad row not found")
    
# Wait, handleKeypadPress needs to know 'NEXT'
keypad_hd_target = "      if (val === 'DEL') {\n          updateVal(prev => prev.slice(0, -1));\n      } else {\n          updateVal(prev => prev + val);\n      }"
keypad_hd_new = """      if (val === 'DEL') {
          updateVal(prev => prev.slice(0, -1));
      } else if (val === 'NEXT') {
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
      
content = content.replace(keypad_hd_target, keypad_hd_new)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("done")
